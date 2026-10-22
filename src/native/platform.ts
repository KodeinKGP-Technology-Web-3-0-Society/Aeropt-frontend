import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App } from "@capacitor/app";

/**
 * Platform detection helpers.
 * Safe to call on both server and client.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isNative(): boolean {
  if (!isBrowser()) return false;
  return Capacitor.isNativePlatform();
}

export function getPlatform(): "android" | "ios" | "web" {
  if (!isBrowser()) return "web";
  const p = Capacitor.getPlatform();
  if (p === "android") return "android";
  if (p === "ios") return "ios";
  return "web";
}

export function isAndroid(): boolean {
  return getPlatform() === "android";
}

export function isIOS(): boolean {
  return getPlatform() === "ios";
}

/**
 * Native Haptics abstraction.
 * Falls back to Web Vibration API on desktop/mobile browsers if supported,
 * or gracefully no-ops.
 */
export const NativeHaptics = {
  async impact(style: "light" | "medium" | "heavy" = "light"): Promise<void> {
    if (isNative()) {
      try {
        const impactStyle =
          style === "heavy"
            ? ImpactStyle.Heavy
            : style === "medium"
            ? ImpactStyle.Medium
            : ImpactStyle.Light;
        await Haptics.impact({ style: impactStyle });
        return;
      } catch {
        // Ignore native failure
      }
    }
    // Web fallback
    if (isBrowser() && "vibrate" in navigator) {
      const ms = style === "heavy" ? 25 : style === "medium" ? 15 : 8;
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignore web vibration permission issues
      }
    }
  },

  async notification(type: "success" | "warning" | "error" = "success"): Promise<void> {
    if (isNative()) {
      try {
        const notifType =
          type === "warning"
            ? NotificationType.Warning
            : type === "error"
            ? NotificationType.Error
            : NotificationType.Success;
        await Haptics.notification({ type: notifType });
        return;
      } catch {
        // Ignore native failure
      }
    }
    // Web fallback
    if (isBrowser() && "vibrate" in navigator) {
      const pattern =
        type === "success"
          ? [10, 50, 15]
          : type === "error"
          ? [30, 40, 30]
          : [15, 30, 15];
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore web vibration errors
      }
    }
  },

  async selection(): Promise<void> {
    if (isNative()) {
      try {
        await Haptics.selectionChanged();
        return;
      } catch {
        // Ignore
      }
    }
    if (isBrowser() && "vibrate" in navigator) {
      try {
        navigator.vibrate(5);
      } catch {
        // Ignore
      }
    }
  },
};

/**
 * Native Preferences (asynchronous KV store).
 * Uses @capacitor/preferences on device, falls back to localStorage in desktop browser.
 */
export const NativePreferences = {
  async get(key: string): Promise<string | null> {
    if (isNative()) {
      try {
        const { value } = await Preferences.get({ key });
        return value;
      } catch {
        return null;
      }
    }
    if (isBrowser()) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.set({ key, value });
        return;
      } catch {
        return;
      }
    }
    if (isBrowser()) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage quota / privacy mode
      }
    }
  },

  async remove(key: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.remove({ key });
        return;
      } catch {
        return;
      }
    }
    if (isBrowser()) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Storage error
      }
    }
  },

  async clear(): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.clear();
        return;
      } catch {
        return;
      }
    }
    if (isBrowser()) {
      try {
        localStorage.clear();
      } catch {
        // Storage error
      }
    }
  },
};

/**
 * Native StatusBar abstraction.
 * On device sets system status bar style/color; no-ops in browser.
 */
export const NativeStatusBar = {
  async setStyle(style: "dark" | "light"): Promise<void> {
    if (!isNative()) return;
    try {
      await StatusBar.setStyle({
        style: style === "dark" ? Style.Dark : Style.Light,
      });
    } catch {
      // Ignore
    }
  },

  async setBackgroundColor(color: string): Promise<void> {
    if (!isNative()) return;
    try {
      await StatusBar.setBackgroundColor({ color });
    } catch {
      // Ignore
    }
  },

  async setOverlaysWebView(overlay: boolean): Promise<void> {
    if (!isNative()) return;
    try {
      await StatusBar.setOverlaysWebView({ overlay });
    } catch {
      // Ignore
    }
  },
};

/**
 * Native App abstraction (lifecycle, back button).
 */
export const NativeApp = {
  async exitApp(): Promise<void> {
    if (isNative()) {
      try {
        await App.exitApp();
      } catch {
        // Ignore
      }
    }
  },

  addBackButtonListener(
    handler: (data: { canGoBack: boolean }) => void
  ): () => void {
    if (!isNative()) {
      return () => {};
    }
    let removeFn: (() => void) | undefined;
    App.addListener("backButton", handler).then((handle) => {
      removeFn = () => handle.remove();
    }).catch(() => {
      // Ignore
    });

    return () => {
      if (removeFn) removeFn();
    };
  },
};
