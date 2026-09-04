"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { isSpeechRecognitionSupported, startVoiceRecognition } from "@/lib/audio/speech";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const handleToggleListening = () => {
    if (disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const recognition = startVoiceRecognition({
      onResult: (res) => {
        if (res.transcript) {
          onTranscript(res.transcript);
        }
      },
      onError: (err) => {
        console.warn("Voice input error:", err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognitionRef.current = recognition;
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      disabled={disabled}
      title={isListening ? "Listening... (Click to stop)" : "Voice input (Click to speak)"}
      className={cn(
        "relative p-2 rounded-xl text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer flex-shrink-0 disabled:opacity-40",
        isListening &&
          "text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600 ring-2 ring-red-500/40 animate-pulse"
      )}
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4 text-red-500" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
