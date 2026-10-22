"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { NativeHaptics } from "../platform";
import { motionTokens } from "../motion/tokens";

export interface NativeButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  haptic?: boolean | "light" | "medium" | "heavy";
  isLoading?: boolean;
  children: React.ReactNode;
}

export function NativeButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  haptic = "light",
  isLoading = false,
  disabled = false,
  className = "",
  onClick,
  children,
  ...props
}: NativeButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (haptic) {
      const style = typeof haptic === "string" ? haptic : "light";
      void NativeHaptics.impact(style);
    }
    onClick?.(e);
  };

  const baseStyles =
    "relative inline-flex items-center justify-center font-medium rounded-xl select-none transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:outline-none";

  const sizeStyles = {
    sm: "h-9 px-3.5 text-xs font-semibold",
    md: "h-12 px-5 text-sm font-semibold",
    lg: "h-14 px-6 text-base font-bold",
  }[size];

  // Colors strictly adhering to .impeccable.md:
  // Ink navy text, single teal signal accent (#0d9488), no gaming glow or purple gradients
  const variantStyles = {
    primary:
      "bg-[#0d9488] text-white hover:bg-[#0f766e] active:bg-[#115e59] shadow-sm",
    secondary:
      "bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f8fafc] active:bg-[#f1f5f9] shadow-xs",
    outline:
      "bg-transparent text-[#0f172a] border border-[#cbd5e1] hover:bg-[#f8fafc] active:bg-[#f1f5f9]",
    ghost:
      "bg-transparent text-[#334155] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]",
    danger:
      "bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#b91c1c]",
  }[variant];

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <motion.button
      whileTap={disabled || isLoading ? undefined : { scale: motionTokens.scalePress }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
