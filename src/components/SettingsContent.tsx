"use client";

import React, { useState } from "react";
import { useApp } from "@/components/AppContext";

export default function SettingsContent() {
  const { data, setData, logout } = useApp();
  
  const [name, setName] = useState(data.user.name);
  const [badge, setBadge] = useState(data.user.badge);
  const [email, setEmail] = useState(data.user.email);
  const [saved, setSaved] = useState(false);
  const [alerts, setAlerts] = useState(true);
  const [theme, setTheme] = useState("dark");

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
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
      {/* Header */}
      <div className="mb-8 select-none">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Configure your JEE Copilot and account settings.</p>
      </div>

      <div className="max-w-[620px] space-y-6">
        {saved && (
          <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-3 text-center font-bold tracking-wide animate-fadeIn">
            ✓ Settings updated successfully
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#0d0e16] border border-[#1b1c2b] rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Profile details</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#07080d] border border-[#1b1c2b] focus:border-[#6258ff]/80 text-xs text-white rounded-lg p-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Target Exam Badge
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full bg-[#07080d] border border-[#1b1c2b] focus:border-[#6258ff]/80 text-xs text-white rounded-lg p-3 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Registered Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#07080d] border border-[#1b1c2b] focus:border-[#6258ff]/80 text-xs text-white rounded-lg p-3 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="bg-[#6258ff] hover:bg-[#5045ff] text-white font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all shadow-[0_4px_15px_rgba(98,88,255,0.25)] cursor-pointer mt-2"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Study Preferences Card */}
        <div className="bg-[#0d0e16] border border-[#1b1c2b] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Study Preferences</h3>
          
          <div className="flex items-center justify-between py-2 border-b border-[#1b1c2b]/50">
            <div>
              <p className="text-xs font-bold text-slate-300">Daily Study Reminders</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">Get alerts when your daily streak is in danger</p>
            </div>
            <button
              onClick={() => setAlerts(!alerts)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                alerts ? "bg-[#1c6f32]" : "bg-[#1b1c2b]"
              }`}
            >
              <span
                className={`h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                  alerts ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[#1b1c2b]/50">
            <div>
              <p className="text-xs font-bold text-slate-300">Target Level Strategy</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">Align recommendation algorithms with target</p>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-[#07080d] border border-[#1b1c2b] text-[11px] font-bold text-white rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="dark">JEE Advanced (Conceptual focus)</option>
              <option value="main">JEE Main (Speed & Formula focus)</option>
              <option value="boards">Boards (Descriptive focus)</option>
            </select>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">Danger Zone</h3>
          <p className="text-xs text-slate-400 font-medium">Log out from your current learning session on this device.</p>
          <button
            onClick={logout}
            className="bg-transparent hover:bg-red-950/25 border border-red-900/50 hover:border-red-600 text-xs font-bold text-red-400 uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all cursor-pointer"
          >
            Sign Out Account
          </button>
        </div>
      </div>
    </div>
  );
}
