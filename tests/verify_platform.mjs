#!/usr/bin/env node
/**
 * JAN—DRISHTI Telangana Development Intelligence
 * Automated Dataset, Sample Test-Case & Live API Verification Suite
 *
 * Run with: npm test
 */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "server", "data");
const SAMPLES_DIR = path.join(ROOT_DIR, "samples");

let passed = 0;
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function readJson(filePath) {
  assert.ok(fs.existsSync(filePath), `Expected file to exist: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function waitForServer(baseUrl, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

async function main() {
  console.log("==================================================================");
  console.log(" JAN—DRISHTI · Telangana Platform Verification & Test Suite");
  console.log("==================================================================\n");

  console.log("Suite 1 · Static Spatial & Statistical Dataset Integrity");

  const testSpec = readJson(path.join(SAMPLES_DIR, "village_test_cases.json"));
  const villages = readJson(path.join(DATA_DIR, "villages_catalog.json"));
  const mandals = readJson(path.join(DATA_DIR, "mandals_catalog.json"));
  const analyticsSummary = readJson(path.join(DATA_DIR, "analytics_summary.json"));
  const districtsGeo = readJson(path.join(DATA_DIR, "gis", "districts.geojson"));

  await check("Villages catalog contains all 11,154 Telangana villages with unique codes", () => {
    assert.equal(villages.length, testSpec.total_villages_in_registry);
    const seen = new Set(villages.map((v) => v.vc));
    assert.equal(seen.size, villages.length, "Duplicate village_code detected");
  });

  await check("All 11,154 villages satisfy Telangana geographic & mathematical score invariants", () => {
    const [minLat, maxLat] = testSpec.invariants.telangana_lat_bounds;
    const [minLon, maxLon] = testSpec.invariants.telangana_lon_bounds;

    for (const v of villages) {
      assert.ok(v.lat >= minLat && v.lat <= maxLat, `Out-of-bounds latitude for ${v.vc}: ${v.lat}`);
      assert.ok(v.lon >= minLon && v.lon <= maxLon, `Out-of-bounds longitude for ${v.vc}: ${v.lon}`);
      for (const key of ["edu_s", "hea_s", "wat_s", "liv_s", "env_s", "ovr_s", "vvi"]) {
        assert.ok(v[key] >= 0 && v[key] <= 100, `Score ${key} out of [0,100] for ${v.vc}`);
      }
      assert.ok(
        Math.abs(v.ovr_s + v.vvi - 100.0) <= 0.2,
        `Complement invariant ovr_s + vvi == 100 violated for ${v.vc}`
      );
    }
  });

  await check("Mandals catalog contains all 444 Telangana Mandals with HLPCA, PCA, Climate & Reach blocks", () => {
    const keys = Object.keys(mandals);
    assert.equal(keys.length, testSpec.total_mandals_in_registry);
    const sampleMandal = mandals[keys[0]];
    assert.ok(sampleMandal.hlpca && sampleMandal.pca && sampleMandal.climate && sampleMandal.reach);
  });

  await check("Districts GeoJSON & all 5 separate Sector GIS layers are valid FeatureCollections", () => {
    assert.equal(districtsGeo.type, "FeatureCollection");
    assert.equal(districtsGeo.features.length, testSpec.total_districts_in_registry);

    for (const sec of ["education", "health", "water", "livelihood", "environment"]) {
      const layer = readJson(path.join(DATA_DIR, "gis", `${sec}_gis.json`));
      assert.equal(layer.sector, sec);
      assert.equal(layer.mandals.type, "FeatureCollection");
      assert.equal(layer.mandals.features.length, 444);
      assert.ok(Array.isArray(layer.facilities) && layer.facilities.length > 0);
    }
  });

  await check("All 10 District-sharded village polygon geometry archives (01.json..10.json) exist", () => {
    let totalPolygons = 0;
    for (let i = 1; i <= 10; i++) {
      const code = String(i).padStart(2, "0");
      const shard = readJson(path.join(DATA_DIR, "village_geometries", `${code}.json`));
      totalPolygons += Object.keys(shard).length;
    }
    assert.equal(totalPolygons, testSpec.total_villages_in_registry);
  });

  console.log("\nSuite 2 · Benchmark Sample Test Cases (samples/village_test_cases.json)");

  const villageByCode = new Map(villages.map((v) => [v.vc, v]));

  for (const tc of testSpec.test_cases) {
    await check(`${tc.test_id}: ${tc.expected.village_name} (${tc.village_code}, ${tc.expected.district_name})`, () => {
      const v = villageByCode.get(tc.village_code);
      assert.ok(v, `Missing village ${tc.village_code}`);
      assert.equal(v.vn, tc.expected.village_name);
      assert.equal(v.mc, tc.expected.mandal_code);
      assert.equal(v.mn, tc.expected.mandal_name);
      assert.equal(v.dc, tc.expected.district_code);
      assert.equal(v.dn, tc.expected.district_name);
      assert.equal(v.area, tc.expected.area_sq_km);
      assert.equal(v.pop, tc.expected.total_population);
      assert.equal(v.hh, tc.expected.households);
      assert.equal(v.tanks, tc.expected.tanks_total);
      assert.equal(v.ovr_s, tc.expected.overall_score);
      assert.equal(v.vvi, tc.expected.vvi_v2);
      assert.equal(v.vvi_lvl, tc.expected.vvi_v2_level);

      const shard = readJson(path.join(DATA_DIR, "village_geometries", `${v.dc}.json`));
      const geom = shard[v.vc];
      assert.ok(geom && (geom.type === "Polygon" || geom.type === "MultiPolygon"));
    });
  }

  console.log("\nSuite 3 · Live REST API & Policy Formulation Integration Tests");

  let baseUrl = "http://127.0.0.1:3000";
  let spawnedProc = null;

  const alreadyUp = await waitForServer(baseUrl, 1200);
  if (!alreadyUp) {
    const testPort = 3099;
    baseUrl = `http://127.0.0.1:${testPort}`;
    const tsxBin = path.join(ROOT_DIR, "node_modules", ".bin", "tsx");
    spawnedProc = spawn(tsxBin, ["server.ts"], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        PORT: String(testPort),
        NODE_ENV: "production",
        GEMINI_API_KEY: "YOUR_GEMINI_API_KEY",
      },
      stdio: "ignore",
    });
    const booted = await waitForServer(baseUrl, 15000);
    assert.ok(booted, "Failed to start ephemeral server.ts instance for integration tests");
  }

  try {
    await check("GET /api/health returns online status and verified Telangana counts", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, "online");
      assert.equal(body.state, "Telangana");
      assert.equal(body.villages, 11154);
      assert.equal(body.mandals, 444);
      assert.equal(body.districts, 10);
    });

    await check("GET /api/villages/featured returns representative rural settlements across Districts", async () => {
      const res = await fetch(`${baseUrl}/api/villages/featured`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.results.length >= 9 && body.results.length <= 10);
      const uniqueDistricts = new Set(body.results.map((r) => r.district_code));
      assert.equal(uniqueDistricts.size, body.results.length);
    });

    await check("GET /api/villages/search?name=Gajwel locates Gajwel (0421020) with prefix priority", async () => {
      const res = await fetch(`${baseUrl}/api/villages/search?name=Gajwel&limit=10`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.results.some((r) => r.village_code === "0421020"));
    });

    await check("GET /api/villages/0421020 returns full 5-sector dossier, benchmarks & polygon geometry", async () => {
      const res = await fetch(`${baseUrl}/api/villages/0421020`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.population.village_code, "0421020");
      assert.equal(body.analytics.village_code, "0421020");
      assert.ok(body.sectors.education && body.sectors.health && body.sectors.water);
      assert.ok(body.sectors.livelihood && body.sectors.environment);
      assert.ok(body.benchmarks.mandal && body.benchmarks.district && body.benchmarks.telangana_state);
      assert.ok(body.spatial?.available && body.spatial.geometry.coordinates.length > 0);
    });

    await check("GET /api/gis/sector/water & /api/gis/villages?mandal_code=0421 serve valid GeoJSON", async () => {
      const secRes = await fetch(`${baseUrl}/api/gis/sector/water`);
      assert.equal(secRes.status, 200);
      const secBody = await secRes.json();
      assert.equal(secBody.mandals.features.length, 444);

      const vilRes = await fetch(`${baseUrl}/api/gis/villages?mandal_code=0421`);
      assert.equal(vilRes.status, 200);
      const vilBody = await vilRes.json();
      assert.equal(vilBody.type, "FeatureCollection");
      assert.ok(vilBody.features.length > 5);
    });

    await check("GET /api/analytics/summary?village_code=0421020 serves 2011–2026 longitudinal trajectories", async () => {
      const res = await fetch(`${baseUrl}/api/analytics/summary?village_code=0421020`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.longitudinal_trends);
      assert.equal(body.longitudinal_trends.state_series.length, 6);
      assert.equal(body.longitudinal_trends.village_series.length, 6);
      assert.equal(body.longitudinal_trends.sector_gains.length, 5);
    });

    await check("POST /api/ai/agent synthesizes schema-valid policy, 100% budget mix & committee report", async () => {
      const tc = testSpec.test_cases[0];
      const res = await fetch(`${baseUrl}/api/ai/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          village_code: tc.village_code,
          query: tc.sample_policy_query,
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.village_code, tc.village_code);

      const analysis = body.outputs?.analysis;
      assert.ok(analysis?.policy && analysis?.dashboard && analysis?.report);

      const mix = analysis.policy.budget_priority_mix;
      assert.equal(mix.length, testSpec.invariants.budget_priority_mix_sectors);
      const sumPct = mix.reduce((acc, item) => acc + Number(item.allocation_percent), 0);
      assert.equal(Math.round(sumPct), testSpec.invariants.budget_priority_mix_sum);
    });
  } finally {
    if (spawnedProc) {
      spawnedProc.kill("SIGTERM");
    }
  }

  console.log("\n==================================================================");
  console.log(` Results: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unhandled verification error:", err);
  process.exit(1);
});
