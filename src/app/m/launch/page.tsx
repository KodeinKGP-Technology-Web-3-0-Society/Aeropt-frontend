"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/components/AppContext";
import { NativeButton } from "@/native/ui/NativeButton";
import { NativeHaptics } from "@/native/platform";
import { getLastTab, hasCompletedFirstRun } from "@/native/store/appPrefs";

export default function LaunchScreen() {
  const router = useRouter();
  const { isLoggedIn, authLoading } = useApp();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const firstRunDone = await hasCompletedFirstRun();
      setIsReturningUser(firstRunDone);
    })();
  }, []);

  // When animation finishes and auth is loaded, route signed-in users automatically
  useEffect(() => {
    if (!authLoading && isLoggedIn && animationComplete) {
      void (async () => {
        const lastTab = await getLastTab("home");
        // Ensure clean routing to real tab routes (/home, /study, etc.)
        const targetRoute = lastTab.startsWith("/") ? lastTab : `/${lastTab}`;
        router.replace(targetRoute);
      })();
    }
  }, [authLoading, isLoggedIn, animationComplete, router]);

  const handleGetStarted = () => {
    void NativeHaptics.impact("medium");
    router.push("/auth?tab=signup");
  };

  const handleSignIn = () => {
    void NativeHaptics.impact("light");
    router.push("/auth?tab=login");
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-[#f6f7f9] text-[#0f172a] flex flex-col justify-between px-6 py-12 select-none relative overflow-hidden">
      {/* Subtle background ambient paper pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top spacer */}
      <div className="pt-8" />

      {/* Centered Brand Mark Animation */}
      <div className="flex flex-col items-center justify-center my-auto z-10">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg
            width="112"
            height="112"
            viewBox="0 0 48 48"
            className="overflow-visible"
          >
            {/* 1. Road stem drawing in */}
            <motion.path
              d="M31 11.5 V28.5 C31 37.5 25 42 18 42 C13.2 42 10 39.4 8.6 36"
              fill="none"
              stroke="#0f172a"
              strokeWidth="8.4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
            />

            {/* 2. Lane dashed line */}
            <motion.path
              d="M31 15 V28.5 C31 37.5 25 42 18 42 C13.2 42 10 39.4 8.6 36"
              fill="none"
              stroke="#f6f7f9"
              strokeWidth="1.6"
              strokeDasharray="2.6 2.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            />

            {/* 3. Top shirorekha bar */}
            <motion.path
              d="M15 11.5 H39"
              stroke="#0f172a"
              strokeWidth="3.6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
            />

            {/* 4. Goal flagpole and teal flag rising */}
            <motion.path
              d="M34.6 11.5 V2.6"
              stroke="#0f172a"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.8, ease: "easeOut" }}
            />
            <motion.path
              d="M34.6 2.6 L43 5.1 L34.6 7.6 Z"
              fill="#0d9488"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.95,
              }}
              onAnimationComplete={() => {
                void NativeHaptics.impact("light");
                setAnimationComplete(true);
              }}
            />
          </svg>
        </div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7, ease: [0.2, 0, 0, 1] }}
          className="mt-6 text-center"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a]">
            Jee<span className="text-[#0d9488]">Path</span>
          </h1>
          <p className="text-sm text-[#64748b] mt-1 font-medium">
            Your path to JEE
          </p>
        </motion.div>
      </div>

      {/* Action Buttons for new users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: animationComplete && (!isLoggedIn || !isReturningUser) ? 1 : 0,
          y: animationComplete && (!isLoggedIn || !isReturningUser) ? 0 : 20,
        }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="w-full flex flex-col gap-3 z-10"
      >
        <NativeButton
          size="lg"
          fullWidth
          variant="primary"
          onClick={handleGetStarted}
        >
          Get started
        </NativeButton>

        <NativeButton
          size="lg"
          fullWidth
          variant="secondary"
          onClick={handleSignIn}
        >
          I already have an account
        </NativeButton>
      </motion.div>
    </div>
  );
}
