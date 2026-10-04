"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/components/AppContext";
import JeePathLogo, { JeePathMark } from "@/components/JeePathLogo";

export default function LoginScreen({
  initialTab = "signin",
}: {
  /** Lets the landing page's "Get started" vs. "Log in" links open the right tab. */
  initialTab?: "signin" | "signup";
}) {
  const { login, register } = useApp();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expired, setExpired] = useState(false);

  /**
   * `auth.ts` bounces here with `?expired=1` when a refresh attempt was
   * rejected, i.e. the session really ended. Without this the student is just
   * dumped back on a login form with no explanation of why.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    setExpired(new URLSearchParams(window.location.search).get("expired") === "1");
  }, []);

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

  const signup = activeTab === "signup";
  const switchTo = (tab: "signin" | "signup") => {
    setError("");
    setActiveTab(tab);
  };
  const inputClass =
    "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
  const labelClass = "block text-sm font-medium text-ink-2";

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      {/* Brand panel: what you get, stated plainly */}
      <aside className="hidden w-[44%] max-w-[560px] flex-col justify-between border-r border-line bg-surface px-12 py-12 lg:flex">
        <JeePathLogo size={36} textClassName="text-2xl" />
        <div>
          <JeePathMark size={72} />
          <p className="mt-8 max-w-sm text-2xl font-semibold leading-snug text-ink">
            JEE Physics practice that checks every answer against the official key.
          </p>
          <ul className="mt-8 space-y-4 text-ink-2">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              342 official JEE Advanced questions, with their official answers
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              All 28 NCERT Physics chapters, Class 11 and 12
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              Right or wrong the moment you submit, with the worked solution
            </li>
          </ul>
        </div>
        <p className="text-sm text-muted">jeepath.ai</p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <JeePathLogo size={36} textClassName="text-2xl" />
          </div>

          <h1 className="text-2xl font-semibold text-ink">{signup ? "Create your account" : "Sign in"}</h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {signup ? "Already have an account? " : "New here? "}
            <button
              type="button"
              onClick={() => switchTo(signup ? "signin" : "signup")}
              className="cursor-pointer font-semibold text-accent hover:underline"
            >
              {signup ? "Sign in" : "Create an account"}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {expired && !error && (
              <div role="status" className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-ink">
                Your session expired. Sign in again to pick up where you left off.
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            {signup && (
              <div className="space-y-1.5">
                <label htmlFor="login-full-name" className={labelClass}>Full name</label>
                <input
                  id="login-full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-email" className={labelClass}>Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className={labelClass}>Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "At least 8 characters" : ""}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-lg bg-ink py-2.5 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (signup ? "Creating account…" : "Signing in…") : signup ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
