"use client";

import React, { useState } from "react";
import { Sliders, X, Sparkles, Bot, Save, RotateCcw } from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    temperature,
    setTemperature,
    customInstructions,
    setCustomInstructions,
  } = useChat();

  const [temp, setTemp] = useState<number>(temperature ?? 0.7);
  const [instructions, setInstructions] = useState<string>(customInstructions || "");
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setTemperature(temp);
    setCustomInstructions(instructions);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setTemp(0.7);
    setInstructions("");
    setTemperature(0.7);
    setCustomInstructions("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AI Assistant Settings</h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Customize temperature, creativity, and system instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5">
          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <span>Creativity / Temperature</span>
                <span className="font-mono text-sky-500 text-[11px]">({temp.toFixed(2)})</span>
              </label>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {temp <= 0.3 ? "Precise & Deterministic" : temp >= 0.8 ? "Creative & Expansive" : "Balanced"}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-[var(--muted)] rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1">
              <span>0.0 (Precise)</span>
              <span>0.7 (Default)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          {/* Custom System Persona / Instructions */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] mb-1.5 block">
              Custom Persona & Instructions
            </label>
            <p className="text-[11px] text-[var(--muted-foreground)] mb-2">
              Add rules on how My AI should formulate answers (e.g. &ldquo;Always write Python 3 code with type hints&rdquo;)
            </p>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Respond concisely using bullet points, format code with TypeScript interfaces..."
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saved ? "Saved!" : "Save Preferences"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
