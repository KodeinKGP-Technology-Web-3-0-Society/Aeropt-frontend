"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NativeHaptics } from "../platform";

interface ToastMessage {
  id: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: { type?: ToastMessage["type"]; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, options?: { type?: ToastMessage["type"]; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: ToastMessage = {
        id,
        message,
        type: options?.type || "info",
        duration: options?.duration ?? 2000,
      };

      if (toast.type === "error" || toast.type === "warning") {
        void NativeHaptics.notification(toast.type);
      } else {
        void NativeHaptics.impact("light");
      }

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration);
    },
    []
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className={`px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold text-center select-none pointer-events-auto border backdrop-blur-none ${
                toast.type === "error"
                  ? "bg-[#ef4444] text-white border-[#dc2626]"
                  : toast.type === "success"
                  ? "bg-[#0d9488] text-white border-[#0f766e]"
                  : "bg-[#0f172a] text-white border-[#1e293b]"
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
