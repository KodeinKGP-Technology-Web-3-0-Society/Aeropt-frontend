import { getAccessToken, requireAgentApiBase } from "./auth";

export interface VoiceSpeaker {
  id: string;
  name: string;
  gender: "male" | "female";
  description: string;
}

export interface VoiceSpeakersResponse {
  speakers: VoiceSpeaker[];
  default_speaker: string;
}

export interface VoiceTranscribeResponse {
  transcript: string;
  language_code: string;
}

export interface VoiceSynthesisResponse {
  audio_base64: string;
  format: string;
  speaker: string;
  cleaned_text: string;
}

// In-memory cache for synthesized audio to prevent duplicate API requests
const audioCache = new Map<string, string>();

/**
 * Fetch available tutor personas for Sarvam Bulbul TTS.
 */
export async function getVoiceSpeakers(): Promise<VoiceSpeakersResponse> {
  const base = requireAgentApiBase();
  const res = await fetch(`${base}/api/v1/voice/speakers`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load voice speakers (${res.status})`);
  }
  return res.json();
}

/**
 * Transcribe recorded student audio using Sarvam Saaras STT.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  languageCode?: string,
): Promise<VoiceTranscribeResponse> {
  const base = requireAgentApiBase();
  const formData = new FormData();
  // Determine file extension from MIME type
  const mimeType = audioBlob.type || "audio/webm";
  const ext = mimeType.includes("wav") ? "wav" : mimeType.includes("mp4") ? "m4a" : "webm";
  formData.append("file", audioBlob, `doubt_audio.${ext}`);
  if (languageCode) {
    formData.append("language_code", languageCode);
  }

  const token = getAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}/api/v1/voice/transcribe`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || `Voice transcription failed (${res.status})`);
  }

  return res.json();
}

/**
 * Convert tutor explanation text to speech audio using Sarvam Bulbul TTS.
 */
export async function synthesizeSpeech(
  text: string,
  speaker = "aditya",
  languageCode = "en-IN",
): Promise<VoiceSynthesisResponse> {
  const cacheKey = `${speaker}:${languageCode}:${text.trim()}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return {
      audio_base64: cached,
      format: "wav",
      speaker,
      cleaned_text: text,
    };
  }

  const base = requireAgentApiBase();
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}/api/v1/voice/synthesize`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      text,
      speaker,
      language_code: languageCode,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || `Voice synthesis failed (${res.status})`);
  }

  const data: VoiceSynthesisResponse = await res.json();
  if (data.audio_base64) {
    audioCache.set(cacheKey, data.audio_base64);
  }
  return data;
}
