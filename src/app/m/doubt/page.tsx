"use client";

import React, { useState } from "react";
import { AppShell } from "@/native/shell/AppShell";
import { Send, Mic, Sparkles, Bot, User } from "lucide-react";
import { NativeHaptics } from "@/native/platform";

interface ChatMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    sender: "tutor",
    text: "Hello! I'm your JEE Tutor. Need help breaking down a tricky physics question, chemistry reaction, or math proof?",
    time: "Just now",
  },
];

export default function MobileDoubtScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    void NativeHaptics.impact("light");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText.trim(),
      time: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate tutor response
    setTimeout(() => {
      void NativeHaptics.notification("success");
      const tutorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "tutor",
        text: "Let's work through this step by step. Which fundamental principle or equation do you think governs this?",
        time: "Now",
      };
      setMessages((prev) => [...prev, tutorMsg]);
    }, 600);
  };

  const handleSuggestionClick = (query: string) => {
    setInputText(query);
    void NativeHaptics.selection();
  };

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-[#0d9488] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">AI Tutor</h2>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active · Grounded in JEE syllabus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#64748b] bg-[#f1f5f9] px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>Step-by-step</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col flex-1 justify-between p-4 pb-2">
        {/* Chat Message Stream */}
        <div className="flex flex-col gap-3 overflow-y-auto mb-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-[#0f172a] text-white"
                    : "bg-teal-100 text-[#0d9488]"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-[#0f172a] text-white rounded-tr-xs"
                    : "bg-white text-[#0f172a] border border-[#e2e8f0] rounded-tl-xs shadow-2xs"
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`block text-[10px] mt-1 ${
                    msg.sender === "user" ? "text-slate-400" : "text-[#94a3b8]"
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="flex flex-col gap-1.5 mb-3">
            <p className="text-[11px] text-[#64748b] font-medium px-1">Suggested prompts:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Derive Torque formula",
                "Why is angular momentum conserved?",
                "Give me a JEE Main rotation problem",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-white border border-[#cbd5e1] hover:border-[#0d9488] text-[#334155] px-3 py-1.5 rounded-full text-left transition-colors active:bg-slate-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-1.5 flex items-center gap-1.5 shadow-sm">
          <button
            type="button"
            aria-label="Voice input"
            onClick={() => void NativeHaptics.impact("medium")}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] active:bg-[#e2e8f0] transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your question or doubt..."
            className="flex-1 text-sm bg-transparent px-2 py-1 focus:outline-none text-[#0f172a] placeholder-[#94a3b8]"
          />

          <button
            type="button"
            aria-label="Send message"
            disabled={!inputText.trim()}
            onClick={handleSend}
            className="w-10 h-10 rounded-xl bg-[#0d9488] text-white flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:bg-[#0f766e] active:scale-95 transition-all"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
