import { useEffect, useState, type ComponentType, type ReactNode } from "react";

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => ReactNode;
};

export default function dynamic<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> } | ComponentType<P>>,
  options?: DynamicOptions
): ComponentType<P> {
  return function DynamicComponent(props: P) {
    const [LoadedComponent, setLoadedComponent] = useState<ComponentType<P> | null>(null);

    useEffect(() => {
      let active = true;
      loader()
        .then((mod) => {
          if (!active) return;
          const resolved =
            typeof mod === "function"
              ? mod
              : (mod as { default: ComponentType<P> }).default;
          setLoadedComponent(() => resolved);
        })
        .catch((err) => {
          console.error("Failed to dynamically load component:", err);
        });
      return () => {
        active = false;
      };
    }, []);

    if (!LoadedComponent) {
      return <>{options?.loading ? options.loading() : null}</>;
    }

    return <LoadedComponent {...props} />;
  };
}
