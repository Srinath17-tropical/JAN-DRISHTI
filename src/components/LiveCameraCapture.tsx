import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  RefreshCw,
  SwitchCamera,
  Trash2,
  Upload,
  X,
} from "lucide-react";

export function stampGpsWatermarkOnImage(
  source: HTMLImageElement | HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  meta: {
    mode: "before" | "after";
    villageLabel: string;
    gpsLabel: string;
    caption: string;
  }
): string {
  const canvas = document.createElement("canvas");
  const targetW = 960;
  const aspect = sourceWidth > 0 && sourceHeight > 0 ? sourceHeight / sourceWidth : 9 / 16;
  const targetH = Math.max(480, Math.min(720, Math.round(targetW * aspect)));
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(source, 0, 0, targetW, targetH);

  // Subtle contrast scrim + evidence bar at bottom
  const barH = 74;
  ctx.fillStyle = "rgba(6, 10, 20, 0.86)";
  ctx.fillRect(0, targetH - barH, targetW, barH);

  ctx.fillStyle = meta.mode === "before" ? "#f59e0b" : "#10b981";
  ctx.font = "600 15px monospace";
  ctx.fillText(
    `JAN-DRISHTI FIELD PROOF · ${meta.mode === "before" ? "COMPLAINT EVIDENCE" : "RESOLVED VERIFICATION"}`,
    20,
    targetH - 46
  );

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "500 14px sans-serif";
  ctx.fillText(`${meta.villageLabel} — ${meta.caption.slice(0, 48)}`, 20, targetH - 24);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px monospace";
  const rightStamp = `${meta.gpsLabel.slice(0, 38)} · ${new Date().toLocaleString("en-IN")}`;
  const textW = ctx.measureText(rightStamp).width;
  ctx.fillText(rightStamp, Math.max(20, targetW - textW - 20), targetH - 46);

  return canvas.toDataURL("image/jpeg", 0.88);
}

interface LiveCameraCaptureProps {
  mode: "before" | "after";
  villageLabel: string;
  gpsLabel: string;
  caption: string;
  photoUrl: string;
  onPhotoChange: (dataUrl: string) => void;
}

export default function LiveCameraCapture({
  mode,
  villageLabel,
  gpsLabel,
  caption,
  photoUrl,
  onPhotoChange,
}: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const startCamera = useCallback(
    async (nextFacing: "environment" | "user" = facingMode, deviceId?: string) => {
      setCameraError("");
      setCameraLoading(true);
      setCameraReady(false);
      stopStream();

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraLoading(false);
        setCameraError(
          "Live camera API is unavailable in this browser context. Use 'Upload Photo' to attach an image from your device."
        );
        return;
      }

      try {
        let stream: MediaStream;
        try {
          const videoConstraint: MediaTrackConstraints = deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 720 } };
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraint,
            audio: false,
          });
        } catch {
          // Fallback for desktop webcams that reject facingMode / resolution constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        setCameraOpen(true);

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === "videoinput");
          setVideoDevices(cams);
          const activeTrack = stream.getVideoTracks()[0];
          const activeSettings = activeTrack?.getSettings();
          if (activeSettings?.deviceId) {
            setSelectedDeviceId(activeSettings.deviceId);
          }
        } catch {
          // Ignore device enumeration errors
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setCameraError(
            "Camera permission was denied or blocked by browser/embed settings. Allow camera access in the browser bar or use 'Upload Photo' below."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setCameraError(
            "No physical camera detected on this device. Use 'Upload Photo' to attach field evidence."
          );
        } else {
          setCameraError(
            `Could not start live camera (${msg || "device busy"}). Use 'Upload Photo' below.`
          );
        }
        setCameraOpen(false);
      } finally {
        setCameraLoading(false);
      }
    },
    [facingMode, stopStream]
  );

  // Bind MediaStream once <video> mounts
  useEffect(() => {
    const videoEl = videoRef.current;
    const stream = streamRef.current;
    if (!cameraOpen || !videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }

    const markReady = () => {
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        setCameraReady(true);
      }
    };

    videoEl.addEventListener("loadedmetadata", markReady);
    videoEl.addEventListener("canplay", markReady);

    videoEl
      .play()
      .then(() => markReady())
      .catch(() => {
        // Autoplay fallback handled by user interaction
      });

    return () => {
      videoEl.removeEventListener("loadedmetadata", markReady);
      videoEl.removeEventListener("canplay", markReady);
    };
  }, [cameraOpen, cameraLoading]);

  function handleCaptureFrame() {
    const videoEl = videoRef.current;
    if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
      setCameraError("Waiting for camera video frame to initialize. Please try capturing again.");
      return;
    }
    const stamped = stampGpsWatermarkOnImage(
      videoEl,
      videoEl.videoWidth,
      videoEl.videoHeight,
      {
        mode,
        villageLabel,
        gpsLabel,
        caption: caption || "Civic Field Evidence",
      }
    );
    if (stamped) {
      onPhotoChange(stamped);
      stopStream();
      setCameraOpen(false);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const stamped = stampGpsWatermarkOnImage(
          img,
          img.naturalWidth || 960,
          img.naturalHeight || 540,
          {
            mode,
            villageLabel,
            gpsLabel,
            caption: caption || file.name,
          }
        );
        onPhotoChange(stamped);
      };
      img.onerror = () => {
        setCameraError("Selected file could not be decoded as an image. Please pick a JPG or PNG photo.");
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleToggleFacing() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    void startCamera(next);
  }

  return (
    <div className="space-y-3">
      {/* Control Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {!cameraOpen ? (
          <button
            type="button"
            onClick={() => void startCamera(facingMode)}
            disabled={cameraLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white transition whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <Camera size={14} />
            <span>{cameraLoading ? "Starting Camera..." : photoUrl ? "Retake via Live Camera" : "Open Live Camera"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              stopStream();
              setCameraOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-white/20 bg-white/[0.06] text-white hover:bg-white/10 transition whitespace-nowrap shrink-0"
          >
            <X size={14} />
            <span>Close Camera</span>
          </button>
        )}

        <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-2 text-xs font-medium border border-white/20 bg-white/[0.05] text-slate-200 hover:bg-white/10 transition whitespace-nowrap shrink-0">
          <Upload size={14} />
          <span>Upload Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />
        </label>

        {photoUrl && !cameraOpen && (
          <button
            type="button"
            onClick={() => onPhotoChange("")}
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-red-300 hover:text-red-200 border border-red-500/30 bg-red-500/10 whitespace-nowrap shrink-0"
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Diagnostic Alert if Camera Blocked or Missing */}
      {cameraError && (
        <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 leading-relaxed">
          {cameraError}
        </div>
      )}

      {/* Live Video Viewfinder */}
      {cameraOpen && (
        <div className="border border-amber-500/45 bg-black overflow-hidden">
          <div className="relative w-full aspect-video bg-[#02050b] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-xs text-slate-300">
                Initializing camera video feed...
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 to-transparent px-3 py-2 flex items-center justify-between text-[11px] font-mono text-slate-200">
              <span className="truncate">{villageLabel}</span>
              <span className="truncate text-amber-300">{gpsLabel.split("·")[0].trim()}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#080e1a] border-t border-white/10">
            <div className="flex items-center gap-2">
              {videoDevices.length > 1 ? (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    void startCamera(facingMode, e.target.value);
                  }}
                  className="border border-white/15 bg-[#050811] px-2 py-1.5 text-xs text-white focus:outline-none max-w-[190px]"
                >
                  {videoDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleFacing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-white/15 bg-white/[0.04] text-slate-200 hover:bg-white/10 whitespace-nowrap"
                >
                  <SwitchCamera size={13} />
                  <span>Flip Camera</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCaptureFrame}
              disabled={!cameraReady}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-45 whitespace-nowrap"
            >
              <CheckCircle2 size={14} />
              <span>Capture &amp; Stamp GPS Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Captured / Uploaded Photo Preview */}
      {photoUrl && !cameraOpen && (
        <div className="border border-emerald-500/35 bg-[#040811] overflow-hidden">
          <img
            src={photoUrl}
            alt="GPS stamped field evidence"
            className="w-full h-44 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-emerald-300 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>GPS &amp; Timestamp Watermarked</span>
            </span>
            <button
              type="button"
              onClick={() => void startCamera(facingMode)}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <RefreshCw size={11} />
              <span>Retake</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
