"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: {
    App?: {
      addListener: (
        event: "backButton",
        handler: (data: { canGoBack: boolean }) => void,
      ) => Promise<{ remove: () => void }>;
      exitApp: () => void;
    };
    StatusBar?: {
      setStyle: (options: { style: "DARK" | "LIGHT" }) => Promise<void>;
      setBackgroundColor: (options: { color: string }) => Promise<void>;
    };
  };
}

export default function CapacitorInit() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
    if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) {
      return;
    }

    let removeListener: (() => void) | undefined;

    const setupBackButton = async () => {
      const app = cap.Plugins?.App;
      if (!app) return;

      const sub = await app.addListener("backButton", ({ canGoBack }) => {
        if (pathname === "/home" || pathname === "/" || !canGoBack) {
          app.exitApp();
        } else {
          router.back();
        }
      });
      removeListener = () => sub.remove();
    };

    void setupBackButton();

    return () => {
      if (removeListener) removeListener();
    };
  }, [router, pathname]);

  return null;
}
