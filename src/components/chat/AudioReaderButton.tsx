"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { speakText, stopSpeaking, isSpeechSynthesisSupported } from "@/lib/audio/speech";
import { cn } from "@/lib/utils";

interface AudioReaderButtonProps {
  text: string;
}

export function AudioReaderButton({ text }: AudioReaderButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);
  const speakHandlerRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    setSupported(isSpeechSynthesisSupported());
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      speakHandlerRef.current?.cancel();
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const handler = speakText(text, {
      rate: 1.05,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });

    speakHandlerRef.current = handler;
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]",
        isPlaying
          ? "bg-sky-500/15 text-sky-500 font-medium hover:bg-sky-500/20"
          : "hover:bg-[var(--muted)] hover:text-[var(--foreground)] text-[var(--muted-foreground)]"
      )}
      title={isPlaying ? "Stop audio narration" : "Read aloud (Text-to-Speech)"}
      aria-label="Read response aloud"
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3 h-3 text-sky-500 animate-pulse" />
          <span className="text-[11px] text-sky-500">Speaking...</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3 h-3" />
          <span className="text-[11px]">Listen</span>
        </>
      )}
    </button>
  );
}
