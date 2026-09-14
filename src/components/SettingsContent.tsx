"use client";

import React, { useState } from "react";
import { useApp } from "@/components/AppContext";

export default function SettingsContent() {
  const { data, setData, logout, appTheme, setAppTheme } = useApp();
  
  const [name, setName] = useState(data.user.name);
  const [badge, setBadge] = useState(data.user.badge);
  const [email, setEmail] = useState(data.user.email);
  const [saved, setSaved] = useState(false);
  const [alerts, setAlerts] = useState(true);
  const [strategy, setStrategy] = useState("advanced");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        name,
        badge,
        email,
      },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8 select-none">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-xs text-muted font-medium mt-1">Configure your JEE Copilot and account settings.</p>
      </div>

      <div className="max-w-[620px] space-y-6">
        {saved && (
          <div className="animate-fadeIn rounded-xl border border-success/30 bg-success/10 p-3 text-center text-xs font-bold tracking-wide text-success">
            ✓ Settings updated successfully
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-4">Profile details</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-canvas border border-line focus:border-accent/80 text-xs text-ink rounded-lg p-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                  Target Exam Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full bg-canvas border border-line focus:border-accent/80 text-xs text-ink rounded-lg p-3 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                Registered Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-canvas border border-line focus:border-accent/80 text-xs text-ink rounded-lg p-3 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="mt-2 cursor-pointer rounded-lg bg-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-accent-on transition-colors hover:bg-accent-hover"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Study Preferences Card */}
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-xs font-bold text-ink uppercase tracking-widest">Study Preferences</h3>
          
          <div className="flex items-center justify-between py-2 border-b border-line/50">
            <div>
              <p className="text-xs font-bold text-ink-2">Daily Study Reminders</p>
              <p className="text-[10px] text-muted font-semibold mt-0.5 uppercase tracking-wide">Get alerts when your daily streak is in danger</p>
            </div>
            <button
              onClick={() => setAlerts(!alerts)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                alerts ? "bg-success" : "bg-hover"
              }`}
            >
              <span
                className={`h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                  alerts ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-line/50">
            <div>
              <p className="text-xs font-bold text-ink-2">Target Level Strategy</p>
              <p className="text-[10px] text-muted font-semibold mt-0.5 uppercase tracking-wide">Align recommendation algorithms with target</p>
            </div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="bg-canvas border border-line text-[11px] font-bold text-ink rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="advanced">JEE Advanced (Conceptual focus)</option>
              <option value="main">JEE Main (Speed & Formula focus)</option>
              <option value="boards">Boards (Descriptive focus)</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-line/50">
            <div>
              <p className="text-xs font-bold text-ink-2">Application Theme</p>
              <p className="text-[10px] text-muted font-semibold mt-0.5 uppercase tracking-wide">Switch between Light and Dark mode</p>
            </div>
            <select
              value={appTheme}
              onChange={(e) => setAppTheme(e.target.value as "light" | "dark")}
              className="bg-canvas border border-line text-[11px] font-bold text-ink rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 rounded-2xl border border-danger/30 bg-danger/5 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-danger">Danger Zone</h3>
          <p className="text-xs font-medium text-muted">Log out from your current learning session on this device.</p>
          <button
            onClick={() => void logout()}
            className="cursor-pointer rounded-lg border border-danger/50 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-danger transition-colors hover:bg-danger/10"
          >
            Sign Out Account
          </button>
        </div>
      </div>
    </div>
  );
}
