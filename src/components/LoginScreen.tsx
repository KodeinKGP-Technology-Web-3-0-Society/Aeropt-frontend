"use client";

import React, { useState } from "react";
import { useApp } from "@/components/AppContext";

export default function LoginScreen() {
  const { login, register, data } = useApp();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      if (activeTab === "signup") {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-[#05060c] bg-slate-50 px-4 font-sans dark:text-slate-100 text-slate-900 selection:bg-[#6258ff] selection:text-white relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6258ff]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1c6f32]/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Brand Logo and Subtitle */}
        <div className="mb-9 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#776eff] to-[#5045ff] text-white shadow-[0_0_24px_rgba(98,88,255,0.4)]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5">
                <path
                  d="M7 13.8a2.8 2.8 0 1 0 2.65 1.9h4.7A2.8 2.8 0 1 0 17 12.1V9.65A2.8 2.8 0 1 0 14.35 6H9.65A2.8 2.8 0 1 0 7 9.65v4.15Zm3-6.3h4m1.5 1.55v3.9m-6.2 3.25h5.4M7 9.65v4.15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight dark:text-white text-slate-900">Prepwise</span>
          </div>
          <p className="text-[13px] dark:text-slate-400 text-slate-500 font-medium tracking-wide">
            Knows where you&apos;re stuck before you do.
          </p>
        </div>

        {/* Card Box */}
        <div className="w-full dark:bg-[#0d0e16] bg-white/80 border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-6.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex border-b dark:border-[#1b1c2b] border-slate-200 pb-4 mb-5">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 pb-2 text-[13px] font-semibold tracking-wide border-b-2 text-center transition-all ${
                activeTab === "signin"
                  ? "border-[#6258ff] dark:text-white text-slate-900"
                  : "border-transparent dark:text-slate-500 text-slate-500 dark:hover:text-slate-300 text-slate-700"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 pb-2 text-[13px] font-semibold tracking-wide border-b-2 text-center transition-all ${
                activeTab === "signup"
                  ? "border-[#6258ff] dark:text-white text-slate-900"
                  : "border-transparent dark:text-slate-500 text-slate-500 dark:hover:text-slate-300 text-slate-700"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg p-2.5 text-center">
                {error}
              </div>
            )}

            {activeTab === "signup" && (
              <div>
                <label className="block text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full dark:bg-[#07080d] bg-white border dark:border-[#1b1c2b] border-slate-200 focus:border-[#6258ff]/80 focus:ring-1 focus:ring-[#6258ff]/30 dark:text-white text-slate-900 placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
                />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full dark:bg-[#07080d] bg-white border dark:border-[#1b1c2b] border-slate-200 focus:border-[#6258ff]/80 focus:ring-1 focus:ring-[#6258ff]/30 dark:text-white text-slate-900 placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[11px] font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full dark:bg-[#07080d] bg-white border dark:border-[#1b1c2b] border-slate-200 focus:border-[#6258ff]/80 focus:ring-1 focus:ring-[#6258ff]/30 dark:text-white text-slate-900 placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6258ff] hover:bg-[#5045ff] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[13px] tracking-wide py-2.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(98,88,255,0.25)] hover:shadow-[0_4px_20px_rgba(98,88,255,0.4)] mt-2"
            >
              {isSubmitting ? "Please wait..." : activeTab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[10px] text-center dark:text-slate-600 text-slate-400 font-medium leading-relaxed tracking-wider uppercase">
          By continuing you agree to our <br className="sm:hidden" />
          <span className="text-[#6258ff] cursor-pointer hover:underline">Terms</span> &{" "}
          <span className="text-[#6258ff] cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
