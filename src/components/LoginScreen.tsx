"use client";

import React, { useState } from "react";
import { useApp } from "@/components/AppContext";

export default function LoginScreen() {
  const { login, data } = useApp();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    login(email);
  };

  const handleGoogleSignIn = () => {
    login("arjun.mehta@google.com");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060c] px-4 font-sans text-slate-100 selection:bg-[#6258ff] selection:text-white relative overflow-hidden">
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
            <span className="text-xl font-bold tracking-tight text-white">Prepwise</span>
          </div>
          <p className="text-[13px] text-slate-400 font-medium tracking-wide">
            {data.chat.conversation[1]?.gapDescription ? "Knows where you're stuck before you do." : "Knows where you're stuck before you do."}
          </p>
        </div>

        {/* Card Box */}
        <div className="w-full bg-[#0d0e16]/80 border border-[#1b1c2b] rounded-2xl p-6.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex border-b border-[#1b1c2b] pb-4 mb-5">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 pb-2 text-[13px] font-semibold tracking-wide border-b-2 text-center transition-all ${
                activeTab === "signin"
                  ? "border-[#6258ff] text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 pb-2 text-[13px] font-semibold tracking-wide border-b-2 text-center transition-all ${
                activeTab === "signup"
                  ? "border-[#6258ff] text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
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

            {/* Email field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#07080d] border border-[#1b1c2b] focus:border-[#6258ff]/80 focus:ring-1 focus:ring-[#6258ff]/30 text-white placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#07080d] border border-[#1b1c2b] focus:border-[#6258ff]/80 focus:ring-1 focus:ring-[#6258ff]/30 text-white placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#6258ff] hover:bg-[#5045ff] active:scale-[0.99] text-white font-semibold text-[13px] tracking-wide py-2.5 rounded-lg transition-all shadow-[0_4px_20px_rgba(98,88,255,0.25)] hover:shadow-[0_4px_20px_rgba(98,88,255,0.4)] mt-2"
            >
              {activeTab === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5">
            <span className="flex-1 h-[1px] bg-[#1b1c2b]" />
            <span className="px-3 text-[11px] font-medium text-slate-600 uppercase tracking-widest">or</span>
            <span className="flex-1 h-[1px] bg-[#1b1c2b]" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-transparent hover:bg-white/[0.03] active:bg-white/[0.05] border border-[#212239] text-[13px] text-slate-200 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition-all"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[15px] w-[15px]">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[10px] text-center text-slate-600 font-medium leading-relaxed tracking-wider uppercase">
          By continuing you agree to our <br className="sm:hidden" />
          <span className="text-[#6258ff] cursor-pointer hover:underline">Terms</span> &{" "}
          <span className="text-[#6258ff] cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
