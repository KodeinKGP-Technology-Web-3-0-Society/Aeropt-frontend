"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NativeApp } from "../platform";
import { useToast } from "../ui/NativeToast";

interface BackHandlerRegistry {
  hasOpenOverlay: () => boolean;
  closeOverlay: () => void;
  confirmExitLesson?: () => boolean;
}

let activeOverlayHandler: BackHandlerRegistry | null = null;

export function registerOverlayHandler(handler: BackHandlerRegistry | null) {
  activeOverlayHandler = handler;
}

export function NativeBackHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    const cleanup = NativeApp.addBackButtonListener(() => {
      // 1. Close open bottom sheet or dialog
      if (activeOverlayHandler && activeOverlayHandler.hasOpenOverlay()) {
        activeOverlayHandler.closeOverlay();
        return;
      }

      // 5. Inside lesson or practice run: confirm sheet / handler
      if (
        pathname?.startsWith("/study/room") ||
        pathname?.startsWith("/lesson/room") ||
        pathname?.startsWith("/assess")
      ) {
        if (activeOverlayHandler?.confirmExitLesson) {
          const handled = activeOverlayHandler.confirmExitLesson();
          if (handled) return;
        }
      }

      // 4. On Home tab root: "Press back again to exit" toast within 2s
      if (pathname === "/home" || pathname === "/" || pathname === "/m/launch") {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          void NativeApp.exitApp();
        } else {
          lastBackPressTimeRef.current = now;
          showToast("Press back again to exit", { duration: 2000 });
        }
        return;
      }

      // 3. On other tab roots (Study, Chat, Plan, Progress): return to Home
      if (
        pathname === "/study" ||
        pathname === "/chat" ||
        pathname === "/plan" ||
        pathname === "/progress"
      ) {
        router.push("/home");
        return;
      }

      // 2. Pop stack inside current tab
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/home");
      }
    });

    return () => {
      cleanup();
    };
  }, [pathname, router, showToast]);

  return null;
}
