"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  MessageSquare,
  Radio,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { VoiceCallEngine } from "@/lib/voice-call/engine";
import { VoiceCallMessage, VoiceCallStatus } from "@/lib/voice-call/types";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => Promise<string>;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [status, setStatus] = useState<VoiceCallStatus>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [messages, setMessages] = useState<VoiceCallMessage[]>([]);
  const [currentInterim, setCurrentInterim] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const engineRef = useRef<VoiceCallEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  // Send voice query to AI backend
  const fetchAIResponse = async (userText: string, currentHistory: VoiceCallMessage[]): Promise<string> => {
    if (onSendToChat) {
      try {
        const customRes = await onSendToChat(userText);
        if (customRes) return customRes;
      } catch {
        // fallback to direct API
      }
    }

    try {
      const payload = {
        messages: [
          {
            role: "system",
            content: "You are My AI speaking in Live Voice Call Mode. Give concise, natural, articulate, direct answers (1 to 3 sentences maximum). Avoid formatting symbols like asterisks, backticks, or lists because your response is being spoken aloud directly.",
          },
          ...currentHistory.slice(-5).map((m) => ({
            role: m.role,
            content: m.text,
          })),
          {
            role: "user",
            content: userText,
          },
        ],
        mode: "fast",
        model: "gemini-3.6-flash",
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return "I'm having a brief connection issue. Could you please say that again?";
      }

      const reader = res.body?.getReader();
      if (!reader) return "I heard you, let's continue.";

      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text-delta" && data.delta) {
                accumulatedText += data.delta;
              }
            } catch {
              // ignore
            }
          }
        }
      }

      const clean = accumulatedText
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[#*_~`]/g, "")
        .trim();

      return clean || "I'm here. How can I help you next?";
    } catch (err) {
      console.error("Voice AI error:", err);
      return "I couldn't catch that. Please say that again.";
    }
  };

  const handleUserSpeechFinalized = useCallback(async (text: string) => {
    if (isProcessingRef.current || !text.trim()) return;
    isProcessingRef.current = true;

    setCurrentInterim("");
    const userMsg: VoiceCallMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStatus("thinking");

    try {
      const responseText = await fetchAIResponse(text.trim(), messages);
      const aiMsg: VoiceCallMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setStatus("speaking");

      if (!isSpeakerMuted && engineRef.current) {
        await engineRef.current.speak(responseText);
      }

      isProcessingRef.current = false;
      setStatus("listening");
      startListeningLoop();
    } catch (err) {
      isProcessingRef.current = false;
      setStatus("listening");
      startListeningLoop();
    }
  }, [messages, isSpeakerMuted]);

  const startListeningLoop = useCallback(() => {
    if (!engineRef.current || isMuted || isProcessingRef.current) return;

    engineRef.current.startListening(
      (text, isFinal) => {
        if (!isFinal) {
          setCurrentInterim(text);
          return;
        }

        handleUserSpeechFinalized(text);
      },
      (newStatus) => {
        if (newStatus === "listening" || newStatus === "speaking" || newStatus === "interrupted") {
          setStatus(newStatus as VoiceCallStatus);
        }
      }
    );
  }, [isMuted, handleUserSpeechFinalized]);

  // Initialize call session
  useEffect(() => {
    if (!isOpen) {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setCallDuration(0);
      isProcessingRef.current = false;
      return;
    }

    const engine = new VoiceCallEngine();
    engineRef.current = engine;

    // Start timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Initial greeting
    setTimeout(async () => {
      setStatus("speaking");
      const greeting = "Hello! I'm here. How can I help you today?";
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          text: greeting,
          timestamp: Date.now(),
        },
      ]);
      await engine.speak(greeting);
      setStatus("listening");
      startListeningLoop();
    }, 600);

    return () => {
      engine.destroy();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen]);

  // Canvas 3D pulsating wave visualizer animation
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 80;

      const isActivity = status === "speaking" || status === "listening";
      const pulseSpeed = status === "speaking" ? 0.08 : status === "listening" ? 0.04 : 0.01;
      const pulseAmp = status === "speaking" ? 28 : status === "listening" ? 18 : 6;

      angle += pulseSpeed;

      // Draw background glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        baseRadius + 60
      );
      if (status === "speaking") {
        glowGrad.addColorStop(0, "rgba(99, 102, 241, 0.45)");
        glowGrad.addColorStop(0.6, "rgba(168, 85, 247, 0.2)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (status === "listening") {
        glowGrad.addColorStop(0, "rgba(16, 185, 129, 0.45)");
        glowGrad.addColorStop(0.6, "rgba(6, 182, 212, 0.2)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(59, 130, 246, 0.3)");
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + 60, 0, Math.PI * 2);
      ctx.fill();

      // Draw concentric rings
      for (let ring = 3; ring >= 1; ring--) {
        const ringRadius = baseRadius + Math.sin(angle + ring * 0.8) * pulseAmp * (ring * 0.4);
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle =
          status === "speaking"
            ? `rgba(168, 85, 247, ${0.4 / ring})`
            : status === "listening"
            ? `rgba(16, 185, 129, ${0.4 / ring})`
            : `rgba(99, 102, 241, ${0.3 / ring})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Draw core organic wave orb
      ctx.beginPath();
      const numPoints = 60;
      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        const waveOffset = Math.sin(theta * 6 + angle * 3) * (isActivity ? 12 : 3);
        const r = baseRadius + waveOffset + Math.sin(angle) * (pulseAmp * 0.4);
        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const coreGrad = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY + baseRadius
      );
      if (status === "speaking") {
        coreGrad.addColorStop(0, "#8b5cf6");
        coreGrad.addColorStop(1, "#ec4899");
      } else if (status === "listening") {
        coreGrad.addColorStop(0, "#10b981");
        coreGrad.addColorStop(1, "#06b6d4");
      } else {
        coreGrad.addColorStop(0, "#3b82f6");
        coreGrad.addColorStop(1, "#6366f1");
      }

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = status === "speaking" ? "#c084fc" : "#34d399";
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, status]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleMute = () => {
    if (!engineRef.current) return;
    if (isMuted) {
      setIsMuted(false);
      startListeningLoop();
    } else {
      setIsMuted(true);
      engineRef.current.stopListening();
      setStatus("idle");
    }
  };

  const handleOrbClick = () => {
    if (status === "speaking" && engineRef.current) {
      // User clicks orb to interrupt
      engineRef.current.interrupt();
      setStatus("listening");
      startListeningLoop();
    } else if (status === "listening" && engineRef.current && currentInterim.trim()) {
      // User clicks orb to finish speaking immediately
      engineRef.current.commitTranscript();
    }
  };

  const handleManualSendInterim = () => {
    if (engineRef.current && currentInterim.trim()) {
      engineRef.current.commitTranscript();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-zinc-950/90 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 text-white min-h-[580px] justify-between">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Voice Mode • Live
            </span>
          </div>
          <div className="text-sm font-mono text-zinc-400 bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-800">
            {formatTimer(callDuration)}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center 3D Voice Orb Canvas */}
        <div className="relative flex flex-col items-center justify-center my-4">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-72 h-72 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={handleOrbClick}
            title={
              status === "speaking"
                ? "Click orb to interrupt AI"
                : currentInterim.trim()
                ? "Click orb to send speech now"
                : "Live Voice Orb"
            }
          />

          {/* Status Badge */}
          <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800/90 shadow-md">
            {status === "listening" && (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Listening (Speak anytime)</span>
              </>
            )}
            {status === "thinking" && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-blue-300">My AI is thinking...</span>
              </>
            )}
            {status === "speaking" && (
              <>
                <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                <span className="text-purple-300">Speaking (Click orb to interrupt)</span>
              </>
            )}
            {status === "interrupted" && (
              <span className="text-amber-300">Interrupted • Listening</span>
            )}
            {status === "idle" && (
              <span className="text-zinc-400">Mic Paused</span>
            )}
          </div>

          {/* Real-time Interim Voice Feedback + Quick Send */}
          {currentInterim && (
            <div className="mt-3 flex items-center gap-2 max-w-sm px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 animate-in fade-in">
              <p className="text-xs text-zinc-300 italic truncate flex-1">
                "{currentInterim}"
              </p>
              <button
                onClick={handleManualSendInterim}
                className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                title="Send speech now without waiting"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </div>
          )}
        </div>

        {/* Real-time Transcript Drawer (Collapsible) */}
        {showTranscript && (
          <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 max-h-36 overflow-y-auto mb-4 text-xs space-y-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-xl ${
                  m.role === "user"
                    ? "bg-emerald-950/40 text-emerald-200 ml-6 border border-emerald-800/30"
                    : "bg-zinc-800/60 text-zinc-200 mr-6 border border-zinc-700/30"
                }`}
              >
                <div className="font-semibold text-[10px] text-zinc-400 mb-0.5">
                  {m.role === "user" ? "You" : "My AI"}
                </div>
                <div>{m.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Action Controls */}
        <div className="w-full flex items-center justify-center gap-4 z-10 pt-2 border-t border-zinc-800/60">
          <button
            onClick={handleToggleMute}
            className={`p-3.5 rounded-full transition shadow-lg ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`p-3.5 rounded-full transition shadow-lg ${
              isSpeakerMuted
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            }`}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`p-3.5 rounded-full transition shadow-lg ${
              showTranscript
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            }`}
            title="Toggle Live Transcript"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-900/40"
            title="End Voice Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
