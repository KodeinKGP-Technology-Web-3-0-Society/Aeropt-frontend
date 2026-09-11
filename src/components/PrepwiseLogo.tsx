"use client";

import React from "react";

/** Isometric cube mark — shared between the landing page nav and the auth screen. */
export default function PrepwiseLogo({ size = 44 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-accent-hover text-white shadow-md shadow-accent/20"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size * 0.55, height: size * 0.55 }}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.15)" />
        <path d="M2 7v10l10 5V12L2 7z" fill="rgba(255,255,255,0.05)" />
        <path d="M22 7v10l-10 5V12l10-5z" fill="rgba(255,255,255,0.2)" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      </svg>
    </div>
  );
}
