"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  RotateCw,
  AlertCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import {
  isSpeechRecognitionSupported,
  startVoiceRecognition,
  speakText,
  stopSpeaking,
} from "@/lib/audio/speech";
import { cn } from "@/lib/utils";

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type VoiceState = "idle" | "listening" | "hearing" | "transcribing" | "thinking" | "speaking";

export function VoiceModeModal({ isOpen, onClose }: VoiceModeModalProps) {
  const { sendMessage, messages, isStreaming } = useChat();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [typedInput, setTypedInput] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [liveVolumeLevel, setLiveVolumeLevel] = useState<number>(0);

  // Audio Stream & Hardware Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Recognition & Playback Refs
  const recognitionHandleRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const speechCancelRef = useRef<{ cancel: () => void } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<string>("");
  const voiceStateRef = useRef<VoiceState>("idle");
  const hasSpokenRef = useRef<boolean>(false);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Transcribe recorded audio via server API fallback
  const transcribeAudioBlob = async (blob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice-message.webm");

      const res = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.text) {
        return data.text.trim();
      }
      return "";
    } catch (err) {
      console.warn("Server audio transcription fallback error:", err);
      return "";
    }
  };

  // Handle Sending Transcribed Voice Message
  const handleSendVoiceMessage = useCallback(
    async (overrideText?: string) => {
      let textToSend = (overrideText || transcriptRef.current).trim();

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Stop current recorder to get final audio blob
      let recordedBlob: Blob | null = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        if (audioChunksRef.current.length > 0) {
          recordedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        }
      }

      if (recognitionHandleRef.current) {
        recognitionHandleRef.current.stop();
        recognitionHandleRef.current = null;
      }

      // If client Web Speech didn't transcribe text but user spoke audio, use server AI transcription
      if (!textToSend && recordedBlob && recordedBlob.size > 2000) {
        setVoiceState("transcribing");
        textToSend = await transcribeAudioBlob(recordedBlob);
      }

      if (!textToSend) {
        setVoiceState("idle");
        return;
      }

      setVoiceState("thinking");
      setTranscript("");
      transcriptRef.current = "";
      audioChunksRef.current = [];
      hasSpokenRef.current = false;

      try {
        await sendMessage(textToSend);
      } catch {
        setVoiceState("idle");
      }
    },
    [sendMessage]
  );

  // Stop listening & release stream
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionHandleRef.current) {
      recognitionHandleRef.current.stop();
      recognitionHandleRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setVoiceState("idle");
    setLiveVolumeLevel(0);
  }, []);

  // Speak AI response with TTS
  const speakAssistantResponse = useCallback(
    (text: string) => {
      if (isMuted) {
        setVoiceState("idle");
        return;
      }

      stopListening();
      setVoiceState("speaking");

      speechCancelRef.current = speakText(text, {
        onStart: () => {
          setVoiceState("speaking");
        },
        onEnd: () => {
          setVoiceState("idle");
          // Resume listening loop automatically after speaking
          setTimeout(() => {
            if (isOpen && voiceStateRef.current !== "thinking") {
              startListening();
            }
          }, 400);
        },
        onError: () => {
          setVoiceState("idle");
          setTimeout(() => {
            if (isOpen) startListening();
          }, 300);
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMuted, isOpen, stopListening]
  );

  // Initialize Microphone & Audio Analysis
  const initMicrophoneStream = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasPermission(true);
      return true;
    }

    try {
      if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // Setup Web Audio Analyser for live visualizer
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
        }
      }

      setHasPermission(true);
      setErrorMessage(null);
      return true;
    } catch (err: any) {
      console.warn("getUserMedia hardware access error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError" ||
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setHasPermission(false);
        setErrorMessage(
          err.name === "NotFoundError" || err.name === "DevicesNotFoundError"
            ? "No microphone found. Please connect a microphone or headset."
            : "Microphone permission is blocked. Please allow microphone access in your browser site permissions."
        );
      } else {
        setHasPermission(false);
        setErrorMessage(err.message || "Failed to access audio hardware");
      }
      return false;
    }
  }, []);

  // Start Mic & Dual-Engine Speech Recognition
  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    setErrorMessage(null);
    stopSpeaking();

    const allowed = await initMicrophoneStream();
    if (!allowed || !mediaStreamRef.current) {
      setVoiceState("idle");
      return;
    }

    // Start MediaRecorder chunk recording
    try {
      audioChunksRef.current = [];
      hasSpokenRef.current = false;
      const recorder = new MediaRecorder(mediaStreamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
    } catch (recErr) {
      console.warn("MediaRecorder start warning:", recErr);
    }

    // Start Client Web Speech Recognition if available
    if (isSpeechRecognitionSupported()) {
      if (recognitionHandleRef.current) {
        recognitionHandleRef.current.stop();
        recognitionHandleRef.current = null;
      }

      try {
        const handle = startVoiceRecognition({
          onStart: () => {
            setVoiceState("listening");
            setHasPermission(true);
            setErrorMessage(null);
          },
          onSpeechStart: () => {
            setVoiceState("hearing");
            hasSpokenRef.current = true;
          },
          onSpeechEnd: () => {
            setVoiceState("listening");
          },
          onResult: (res) => {
            setTranscript(res.transcript);
            transcriptRef.current = res.transcript;
            hasSpokenRef.current = true;

            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            if (res.isFinal && res.transcript.trim()) {
              silenceTimerRef.current = setTimeout(() => {
                if (
                  transcriptRef.current.trim() &&
                  (voiceStateRef.current === "listening" || voiceStateRef.current === "hearing")
                ) {
                  handleSendVoiceMessage(transcriptRef.current);
                }
              }, 1400);
            }
          },
          onError: (err) => {
            console.warn("Client speech engine note:", err);
          },
          onEnd: () => {
            if (voiceStateRef.current === "listening" || voiceStateRef.current === "hearing") {
              // Stay active or recover
            }
          },
        });

        recognitionHandleRef.current = handle;
      } catch (err) {
        console.warn("Speech recognition init warning:", err);
      }
    }

    setVoiceState("listening");
  }, [handleSendVoiceMessage, initMicrophoneStream]);

  // Click handler for Grant Permission
  const handleGrantPermissionClick = async () => {
    const granted = await initMicrophoneStream();
    if (granted) {
      startListening();
    }
  };

  // Lifecycle on modal open/close
  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
      stopSpeaking();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setVoiceState("idle");
      setTranscript("");
    }

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [isOpen, startListening, stopListening]);

  // Watch for incoming assistant messages to speak
  useEffect(() => {
    if (!isOpen || isMuted) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      lastMessage.content &&
      lastMessage.id !== lastSpokenMessageIdRef.current &&
      !isStreaming
    ) {
      lastSpokenMessageIdRef.current = lastMessage.id;
      speakAssistantResponse(lastMessage.content);
    } else if (isStreaming) {
      setVoiceState("thinking");
    }
  }, [messages, isStreaming, isOpen, isMuted, speakAssistantResponse]);

  // Animated Visualizer Orb Canvas + Real-time Audio Activity Monitor
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const dataArray = new Uint8Array(128);

    const render = () => {
      time += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 65;

      // Extract real microphone hardware volume
      let liveVolume = 0;
      if (analyserRef.current && (voiceState === "listening" || voiceState === "hearing")) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        liveVolume = sum / dataArray.length; // 0 to 255
        const normalized = Math.min(100, Math.round((liveVolume / 45) * 100));
        setLiveVolumeLevel(normalized);

        // If volume exceeds threshold, mark as hearing
        if (liveVolume > 14 && voiceStateRef.current === "listening") {
          setVoiceState("hearing");
          hasSpokenRef.current = true;
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (liveVolume <= 10 && voiceStateRef.current === "hearing" && hasSpokenRef.current) {
          // Voice pause detected: auto-commit after silence
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (voiceStateRef.current === "hearing" || voiceStateRef.current === "listening") {
                handleSendVoiceMessage();
              }
            }, 1600);
          }
        }
      }

      const isHearing = voiceState === "hearing" || liveVolume > 15;
      const isListeningState = voiceState === "listening";
      const isTranscribing = voiceState === "transcribing";
      const isSpeakingState = voiceState === "speaking";
      const isThinkingState = voiceState === "thinking";

      const pulseSpeed = isHearing
        ? 3.2 + liveVolume / 60
        : isListeningState
        ? 2.0
        : isSpeakingState
        ? 2.5
        : isThinkingState || isTranscribing
        ? 1.5
        : 0.8;

      const dynamicAmp = isHearing
        ? 16 + liveVolume * 0.35
        : isListeningState
        ? 12
        : isSpeakingState
        ? 16
        : isThinkingState || isTranscribing
        ? 8
        : 4;

      // Outer Ambient Glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.3,
        centerX,
        centerY,
        baseRadius * 2.3
      );
      if (isHearing || isListeningState) {
        glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.5)");
        glowGrad.addColorStop(0.6, "rgba(14, 165, 233, 0.15)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (isSpeakingState) {
        glowGrad.addColorStop(0, "rgba(99, 102, 241, 0.5)");
        glowGrad.addColorStop(0.6, "rgba(79, 70, 229, 0.2)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (isThinkingState || isTranscribing) {
        glowGrad.addColorStop(0, "rgba(245, 158, 11, 0.45)");
        glowGrad.addColorStop(0.6, "rgba(217, 119, 6, 0.15)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(148, 163, 184, 0.2)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.3, 0, Math.PI * 2);
      ctx.fill();

      // Fluid Waveform Orb Geometry
      ctx.beginPath();
      const points = 64;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave1 = Math.sin(angle * 4 + time * pulseSpeed) * dynamicAmp;
        const wave2 = Math.cos(angle * 6 - time * pulseSpeed * 0.8) * (dynamicAmp * 0.5);
        const r = baseRadius + wave1 + wave2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Center Orb Gradient
      const orbGrad = ctx.createRadialGradient(
        centerX - 18,
        centerY - 18,
        8,
        centerX,
        centerY,
        baseRadius * 1.2
      );
      if (isHearing || isListeningState) {
        orbGrad.addColorStop(0, "#38bdf8");
        orbGrad.addColorStop(1, "#0284c7");
      } else if (isSpeakingState) {
        orbGrad.addColorStop(0, "#818cf8");
        orbGrad.addColorStop(1, "#4f46e5");
      } else if (isThinkingState || isTranscribing) {
        orbGrad.addColorStop(0, "#fbbf24");
        orbGrad.addColorStop(1, "#d97706");
      } else {
        orbGrad.addColorStop(0, "#94a3b8");
        orbGrad.addColorStop(1, "#475569");
      }

      ctx.fillStyle = orbGrad;
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, voiceState, handleSendVoiceMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">My AI Voice Mode</h2>
            <p className="text-[11px] text-slate-400">Continuous Conversational Audio</p>
          </div>
        </div>

        <button
          onClick={() => {
            stopListening();
            stopSpeaking();
            onClose();
          }}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close Voice Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Interactive Visualizer Orb */}
      <div className="flex flex-col items-center justify-center text-center my-auto w-full max-w-lg">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="cursor-pointer select-none"
            onClick={voiceState === "listening" || voiceState === "hearing" ? () => handleSendVoiceMessage() : startListening}
            title="Tap orb to send or toggle microphone"
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {voiceState === "transcribing" ? (
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            ) : voiceState === "hearing" ? (
              <Sparkles className="w-11 h-11 text-white animate-spin" />
            ) : voiceState === "listening" ? (
              <Mic className="w-10 h-10 text-white animate-pulse" />
            ) : voiceState === "speaking" ? (
              <Volume2 className="w-10 h-10 text-white animate-bounce" />
            ) : voiceState === "thinking" ? (
              <RotateCw className="w-9 h-9 text-white animate-spin" />
            ) : (
              <MicOff className="w-9 h-9 text-white/80" />
            )}
          </div>
        </div>

        {/* State Pill & Volume Meter Indicator */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <span
            className={cn(
              "px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5",
              voiceState === "transcribing" && "bg-amber-400/25 text-amber-300 border border-amber-400/60",
              voiceState === "hearing" && "bg-sky-400/25 text-sky-300 border border-sky-400/60 shadow-lg shadow-sky-500/20",
              voiceState === "listening" && "bg-sky-500/20 text-sky-400 border border-sky-500/40",
              voiceState === "speaking" && "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40",
              voiceState === "thinking" && "bg-amber-500/20 text-amber-400 border border-amber-500/40",
              voiceState === "idle" && "bg-slate-800 text-slate-400 border border-slate-700"
            )}
          >
            {voiceState === "transcribing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {voiceState === "hearing" && <span className="w-2 h-2 rounded-full bg-sky-300 animate-ping" />}
            {voiceState === "listening" && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />}
            {voiceState === "transcribing"
              ? "Transcribing voice with AI..."
              : voiceState === "hearing"
              ? `Hearing voice (${liveVolumeLevel}% volume)...`
              : voiceState === "listening"
              ? "Listening (Speak into mic)..."
              : voiceState === "speaking"
              ? "Assistant Speaking..."
              : voiceState === "thinking"
              ? "Thinking & Answering..."
              : "Tap Orb to Start"}
          </span>

          {/* Live Mic Activity Bar */}
          {(voiceState === "listening" || voiceState === "hearing") && (
            <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-75 rounded-full"
                style={{ width: `${Math.max(6, liveVolumeLevel)}%` }}
              />
            </div>
          )}
        </div>

        {/* Live Transcript Display */}
        {transcript && (
          <div className="mt-4 w-full max-w-md flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 animate-in fade-in">
            <p className="flex-1 text-sm text-white text-left truncate">
              &ldquo;{transcript}&rdquo;
            </p>
            <button
              onClick={() => handleSendVoiceMessage(transcript)}
              className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white cursor-pointer shadow-sm flex-shrink-0"
              title="Send now"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Permission Request Alert */}
        {hasPermission === false && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs max-w-md text-left flex flex-col gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Microphone Access Required</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              {errorMessage || "Click the button below to allow microphone access, or check your browser address bar permissions."}
            </p>
            <button
              onClick={handleGrantPermissionClick}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Grant Microphone Permission
            </button>
          </div>
        )}

        {/* General Error Message */}
        {errorMessage && hasPermission !== false && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 max-w-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls & Fallback Input */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {/* Quick Text Input Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typedInput.trim()) {
              handleSendVoiceMessage(typedInput.trim());
              setTypedInput("");
            }
          }}
          className="w-full flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10"
        >
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Or type a question here..."
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
          />
          {typedInput.trim() && (
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-center gap-3">
          {/* Send / Stop Voice Button */}
          <button
            onClick={voiceState === "listening" || voiceState === "hearing" ? () => handleSendVoiceMessage() : startListening}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium text-xs shadow-lg transition-all cursor-pointer active:scale-95",
              voiceState === "hearing"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                : voiceState === "listening"
                ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/25"
                : "bg-slate-700 hover:bg-slate-600 text-white"
            )}
          >
            {voiceState === "hearing" ? (
              <>
                <Send className="w-4 h-4" />
                <span>Send Spoken Query</span>
              </>
            ) : voiceState === "listening" ? (
              <>
                <Mic className="w-4 h-4" />
                <span>Listening (Tap to Send)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Speaking</span>
              </>
            )}
          </button>

          {/* Toggle Voice Output Mute */}
          <button
            onClick={() => {
              if (!isMuted) stopSpeaking();
              setIsMuted((prev) => !prev);
            }}
            className={cn(
              "p-2.5 rounded-2xl border transition-colors cursor-pointer",
              isMuted
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "bg-white/10 border-white/15 text-white hover:bg-white/20"
            )}
            title={isMuted ? "Unmute Assistant Voice" : "Mute Assistant Voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
