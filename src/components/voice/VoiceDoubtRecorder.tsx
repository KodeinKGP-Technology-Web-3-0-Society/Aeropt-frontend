"use client";

import React, { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/api/voice";

interface VoiceDoubtRecorderProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function VoiceDoubtRecorder({
  onTranscribed,
  disabled = false,
  className = "",
}: VoiceDoubtRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up media streams and timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function startRecording() {
    if (disabled || isRecording || isTranscribing) return;
    setError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Microphone is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Select supported mime type
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (blob.size < 500) {
          // Audio too short or empty
          setIsRecording(false);
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const res = await transcribeAudio(blob);
          if (res.transcript && res.transcript.trim()) {
            onTranscribed(res.transcript.trim());
          } else {
            setError("No speech detected. Please speak clearly into your mic.");
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to transcribe audio.";
          setError(msg);
        } finally {
          setIsTranscribing(false);
          setIsRecording(false);
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 60) {
            // Auto-stop at 60 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : "";
      const errorMsg = err instanceof Error ? err.message : "";
      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError" ||
        errorName === "SecurityError" ||
        errorMsg.toLowerCase().includes("permission") ||
        errorMsg.toLowerCase().includes("policy")
      ) {
        setError("Microphone permission denied. Please allow mic access (or open directly in browser tab).");
      } else {
        setError("Could not access microphone.");
      }
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorderRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function cancelRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setSeconds(0);
  }

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {isRecording ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 animate-in fade-in zoom-in-95">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          <span className="font-mono font-bold tracking-tight">{formatTime(seconds)}</span>
          <span className="hidden sm:inline text-ink/70">Recording doubt...</span>

          {/* Wave animation bars */}
          <div className="flex items-center gap-0.5 px-1 h-3">
            <span className="w-0.5 h-2 bg-red-500 animate-pulse rounded-full" />
            <span className="w-0.5 h-3 bg-red-600 animate-pulse delay-75 rounded-full" />
            <span className="w-0.5 h-1.5 bg-red-500 animate-pulse delay-150 rounded-full" />
          </div>

          {/* Stop / Done button */}
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Finish recording"
            className="cursor-pointer ml-1 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 transition-colors"
          >
            Done
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={cancelRecording}
            aria-label="Cancel recording"
            className="cursor-pointer p-0.5 text-ink/50 hover:text-ink transition-colors"
            title="Cancel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : isTranscribing ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent animate-pulse">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span>Saaras transcribing...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          title="Speak your doubt (Sarvam Saaras STT)"
          aria-label="Speak your doubt with microphone"
          className="group inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:border-accent hover:bg-accent-soft hover:text-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          <svg
            className="h-4 w-4 text-muted group-hover:text-accent transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          <span className="hidden sm:inline">Speak doubt</span>
        </button>
      )}

      {error && (
        <div className="absolute top-full left-0 mt-1.5 z-20 whitespace-nowrap rounded-lg border border-red-500/30 bg-surface px-2.5 py-1 text-[11px] font-medium text-red-600 shadow-md">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 font-bold cursor-pointer hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
