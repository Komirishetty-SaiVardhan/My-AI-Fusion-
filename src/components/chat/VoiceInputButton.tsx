"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { isSpeechRecognitionSupported, startVoiceRecognition } from "@/lib/audio/speech";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const hasTranscribedRef = useRef<boolean>(false);

  // Transcribe recorded audio with server AI fallback
  const transcribeAudioFallback = async (blob: Blob) => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("audio", blob, "dictation.webm");

      const res = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.text) {
        onTranscript(data.text.trim());
        hasTranscribedRef.current = true;
      }
    } catch (err) {
      console.warn("Audio transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleToggleListening = async () => {
    if (disabled) return;

    if (isListening) {
      // User stopped listening
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        setTimeout(() => {
          if (!hasTranscribedRef.current && audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            if (blob.size > 2000) {
              transcribeAudioFallback(blob);
            }
          }
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
        }, 150);
      }
      return;
    }

    // Start Listening & Hardware Capture
    hasTranscribedRef.current = false;
    audioChunksRef.current = [];

    try {
      if (typeof window !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      }
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Microphone permission is blocked. Please allow microphone access in your browser settings to use voice input.");
        return;
      }
    }

    setIsListening(true);

    if (isSpeechRecognitionSupported()) {
      const recognition = startVoiceRecognition({
        onResult: (res) => {
          if (res.isFinal && res.transcript.trim()) {
            onTranscript(res.transcript.trim());
            hasTranscribedRef.current = true;
          }
        },
        onError: () => {
          // If speech recognition errors, MediaRecorder fallback will transcribe automatically on stop
        },
        onEnd: () => {
          // Handled
        },
      });

      recognitionRef.current = recognition;
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      disabled={disabled || isTranscribing}
      title={
        isTranscribing
          ? "Transcribing voice with AI..."
          : isListening
          ? "Listening... (Click to finish speaking)"
          : "Voice input (Click to speak into prompt)"
      }
      className={cn(
        "relative p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer flex-shrink-0 disabled:opacity-40",
        isListening &&
          "text-red-500 bg-red-500/15 hover:bg-red-500/25 hover:text-red-600 ring-1 ring-red-500/40 animate-pulse",
        isTranscribing && "text-amber-500 bg-amber-500/15 animate-pulse"
      )}
    >
      {isTranscribing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
      ) : isListening ? (
        <>
          <MicOff className="w-3.5 h-3.5 text-red-500" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </>
      ) : (
        <Mic className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
