"use client";

import React, { useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api/voice";

interface AudioTutorPlayerProps {
  text: string;
  compact?: boolean;
  className?: string;
  title?: string;
}

export default function AudioTutorPlayer({
  text,
  compact = false,
  className = "",
  title = "Audio Tutor",
}: AudioTutorPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speaker, setSpeaker] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("prepwise_voice_speaker") || "aditya";
    }
    return "aditya";
  });
  const [speed, setSpeed] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount or text change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [text]);

  async function handleTogglePlay() {
    setError(null);

    // If currently playing, pause it
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If paused with existing audio, resume
    if (!isPlaying && audioRef.current && audioRef.current.src) {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    // Otherwise, synthesize with Bulbul TTS
    if (!text || !text.trim()) return;

    setIsLoading(true);
    try {
      const result = await synthesizeSpeech(text, speaker);
      if (!result.audio_base64) {
        throw new Error("No audio generated.");
      }

      const audioSrc = `data:audio/wav;base64,${result.audio_base64}`;
      const audio = new Audio(audioSrc);
      audio.playbackRate = speed;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setError("Error playing audio.");
      };

      audioRef.current = audio;
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to synthesize tutor voice.";
      setError(msg);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSpeakerChange(newSpeaker: string) {
    setSpeaker(newSpeaker);
    if (typeof window !== "undefined") {
      localStorage.setItem("prepwise_voice_speaker", newSpeaker);
    }
    // Stop current audio so next play uses the newly selected speaker
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }

  function handleSpeedCycle() {
    const speeds = [1, 1.25, 1.5];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={isLoading || !text.trim()}
          title={isPlaying ? "Pause voice tutor" : "Listen to explanation (Bulbul TTS)"}
          aria-label={isPlaying ? "Pause audio tutor" : "Listen to audio tutor"}
          className={`group inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
            isPlaying
              ? "border-accent bg-accent text-accent-on shadow-xs"
              : "border-line bg-surface text-muted hover:border-accent hover:text-ink hover:bg-accent-soft"
          }`}
        >
          {isLoading ? (
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : isPlaying ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}

          <span>{isLoading ? "Generating..." : isPlaying ? "Playing" : "Listen"}</span>

          {isPlaying && (
            <div className="flex items-center gap-0.5 ml-0.5 h-3">
              <span className="w-0.5 h-1.5 bg-current animate-pulse rounded-full" />
              <span className="w-0.5 h-3 bg-current animate-pulse delay-75 rounded-full" />
              <span className="w-0.5 h-2 bg-current animate-pulse delay-150 rounded-full" />
            </div>
          )}
        </button>

        {isPlaying && (
          <button
            type="button"
            onClick={handleSpeedCycle}
            className="cursor-pointer rounded-md bg-surface border border-line px-1.5 py-0.5 text-[10px] font-bold text-muted hover:text-ink"
            title="Playback speed"
          >
            {speed}x
          </button>
        )}
      </div>
    );
  }

  // Expanded banner player for Doubt Room or prominent placement
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-2.5 backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={isLoading || !text.trim()}
          aria-label={isPlaying ? "Pause audio tutor" : "Play audio tutor explanation"}
          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all shadow-xs ${
            isPlaying
              ? "bg-accent text-accent-on scale-102 ring-2 ring-accent/30"
              : "bg-ink text-surface hover:bg-ink/90"
          }`}
        >
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin text-surface" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : isPlaying ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="h-4 w-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink">{title}</span>
            {isPlaying && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                Speaking
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted">
            {isLoading
              ? "Synthesizing voice with Sarvam Bulbul..."
              : isPlaying
              ? `Listening to ${speaker === "aditya" ? "Aditya" : "Ritu"} explaining this doubt`
              : "Listen to this explanation read aloud"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Voice Persona Picker */}
        <div className="flex items-center rounded-lg border border-line bg-surface p-0.5 text-xs">
          <button
            type="button"
            onClick={() => handleSpeakerChange("aditya")}
            className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
              speaker === "aditya"
                ? "bg-ink text-surface shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            Aditya
          </button>
          <button
            type="button"
            onClick={() => handleSpeakerChange("ritu")}
            className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
              speaker === "ritu"
                ? "bg-ink text-surface shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            Ritu
          </button>
        </div>

        {/* Speed button */}
        <button
          type="button"
          onClick={handleSpeedCycle}
          className="cursor-pointer rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-bold text-muted hover:text-ink hover:border-accent transition-colors"
          title="Playback Speed"
        >
          {speed}x
        </button>
      </div>

      {error && (
        <p className="w-full text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}
