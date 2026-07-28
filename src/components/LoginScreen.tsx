"use client";

import React, { useState } from "react";
import { useApp } from "@/components/AppContext";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Premium Isometric 3D Cube Logo
const PrepwiseLogo = () => (
  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#3b82f6] text-white shadow-md shadow-indigo-500/20">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      {/* Top Face */}
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.15)"/>
      {/* Left Face */}
      <path d="M2 7v10l10 5V12L2 7z" fill="rgba(255,255,255,0.05)"/>
      {/* Right Face */}
      <path d="M22 7v10l-10 5V12l10-5z" fill="rgba(255,255,255,0.2)"/>
      {/* Inner Node */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  </div>
);

export default function LoginScreen() {
  const { login, register } = useApp();
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
    <div className="flex min-h-screen items-center justify-center px-4 py-8 font-sans bg-[#f8fafc] dark:bg-[#090a0f] bg-grid-pattern transition-colors duration-300 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px] bg-[#6258ff]/[0.06] dark:bg-[#6258ff]/[0.12] transition-colors duration-300" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none blur-[120px] bg-[#1c6f32]/[0.03] dark:bg-[#1c6f32]/[0.08] transition-colors duration-300" />

      <div className="z-10 relative w-full flex flex-col items-center max-w-[1200px]">
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
          
          {/* Left Side: Lottie Animation */}
          <div className="hidden md:flex flex-col items-center justify-center w-full max-w-[650px] overflow-visible">
            <DotLottieReact src="/STUDENT.lottie" loop autoplay className="w-full h-auto drop-shadow-[0_10px_20px_rgba(0,107,255,0.15)] scale-[1.35] origin-center" />
          </div>

          {/* Right Side: Login Form */}
          <div className="w-full max-w-[420px] flex flex-col items-stretch">
            
            {/* Logo and Brand Title Centered Above Card */}
            <div className="flex items-center justify-center gap-3 mb-6 select-none animate-fade-in">
              <PrepwiseLogo />
              <span className="text-3xl font-extrabold tracking-tight dark:text-white text-[#0f172a] font-sans">
                Prepwise
              </span>
            </div>

            {/* Card Box */}
            <div className="w-full dark:bg-[#13141a] bg-white border dark:border-[#1d1f2b] border-slate-200/80 rounded-[28px] p-8 shadow-xl transition-all duration-300">
              
              <h2 className="text-xl font-bold dark:text-white text-[#0f172a] text-center mb-6 tracking-tight">
                {activeTab === "signin" 
                  ? "Sign in to continue your journey" 
                  : "Create an account to begin your journey"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center animate-shake">
                    {error}
                  </div>
                )}

                {activeTab === "signup" && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                      Full name
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full dark:bg-[#1a1b24] bg-slate-100 border border-transparent dark:focus:border-indigo-500/50 focus:border-blue-500/50 dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all shadow-inner"
                    />
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@jee-elite.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full dark:bg-[#1a1b24] bg-slate-100 border border-transparent dark:focus:border-indigo-500/50 focus:border-blue-500/50 dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
                      Password
                    </label>
                    {activeTab === "signin" && (
                      <button
                        type="button"
                        onClick={() => alert("Password reset option is currently not configured.")}
                        className="text-xs text-[#65a30d] dark:text-[#bef264] hover:underline font-semibold cursor-pointer select-none"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full dark:bg-[#1a1b24] bg-slate-100 border border-transparent dark:focus:border-indigo-500/50 focus:border-blue-500/50 dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-600 rounded-2xl px-5 py-3.5 text-[15px] outline-none transition-all shadow-inner"
                  />
                </div>

                {/* Main Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#006bff] dark:bg-[#b4c6ff] hover:bg-[#005cd6] dark:hover:bg-[#c3d5ff] text-white dark:text-[#0c0d12] font-bold text-sm tracking-wider py-4 rounded-full transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none"
                >
                  {isSubmitting 
                    ? "PLEASE WAIT..." 
                    : activeTab === "signin" 
                      ? "SIGN IN" 
                      : "CREATE ACCOUNT"}
                </button>
              </form>

              {/* Divider: OR CONTINUE WITH */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-slate-200 dark:border-[#20212f]" />
                <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
                  OR CONTINUE WITH
                </span>
                <div className="flex-1 border-t border-slate-200 dark:border-[#20212f]" />
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => alert("Google Login simulation")}
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-[#2d303f] hover:bg-slate-50 dark:hover:bg-[#1a1b24] rounded-full dark:text-white text-slate-800 text-sm font-semibold transition-all active:scale-[0.97]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Apple Login simulation")}
                  className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-[#2d303f] hover:bg-slate-50 dark:hover:bg-[#1a1b24] rounded-full dark:text-white text-slate-800 text-sm font-semibold transition-all active:scale-[0.97]"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Bottom Switch Link and Button */}
              {activeTab === "signin" ? (
                <div className="mt-8 text-center border-t border-slate-100 dark:border-[#1d1f2b] pt-6 transition-all duration-300">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setActiveTab("signup");
                      }}
                      className="text-[#65a30d] dark:text-[#bef264] hover:underline font-bold cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setActiveTab("signup");
                    }}
                    className="w-full mt-4 bg-transparent border border-slate-200 dark:border-[#2d303f] hover:bg-slate-50 dark:hover:bg-[#1a1b24] text-slate-800 dark:text-white font-bold text-xs tracking-wider py-4 rounded-full transition-all active:scale-[0.98] select-none"
                  >
                    CREATE ACCOUNT
                  </button>
                </div>
              ) : (
                <div className="mt-8 text-center border-t border-slate-100 dark:border-[#1d1f2b] pt-6 transition-all duration-300">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setActiveTab("signin");
                      }}
                      className="text-[#65a30d] dark:text-[#bef264] hover:underline font-bold cursor-pointer"
                    >
                      Sign in
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setActiveTab("signin");
                    }}
                    className="w-full mt-4 bg-transparent border border-slate-200 dark:border-[#2d303f] hover:bg-slate-50 dark:hover:bg-[#1a1b24] text-slate-800 dark:text-white font-bold text-xs tracking-wider py-4 rounded-full transition-all active:scale-[0.98] select-none"
                  >
                    SIGN IN
                  </button>
                </div>
              )}

            </div>

            {/* Footer Terms */}
            <p className="mt-6 text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium leading-relaxed tracking-wider uppercase select-none">
              By continuing you agree to our <br className="sm:hidden" />
              <span className="text-[#006bff] dark:text-indigo-400 cursor-pointer hover:underline">Terms</span> &amp;{" "}
              <span className="text-[#006bff] dark:text-indigo-400 cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
