"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  Check,
  Plus,
  X,
  User,
} from "lucide-react";
import { AIPersona, AI_PERSONA_PRESETS } from "@/lib/personas/presets";
import { cn } from "@/lib/utils";

interface PersonaSelectorProps {
  selectedPersona: AIPersona;
  onSelectPersona: (persona: AIPersona) => void;
  className?: string;
}

export function PersonaSelector({
  selectedPersona,
  onSelectPersona,
  className,
}: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPersonas, setCustomPersonas] = useState<AIPersona[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Custom persona form state
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [customAvatar, setCustomAvatar] = useState("🤖");
  const [customPrompt, setCustomPrompt] = useState("");

  const allPersonas = [...AI_PERSONA_PRESETS, ...customPersonas];

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPrompt.trim()) return;

    const newPersona: AIPersona = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      role: customRole.trim() || "Custom Assistant",
      avatar: customAvatar.trim() || "🤖",
      tagline: customRole.trim() || "Custom tailored AI instructions",
      description: customPrompt.trim().slice(0, 100),
      category: "general",
      systemPromptModifier: customPrompt.trim(),
      suggestedPrompts: [],
      toneColor: "from-blue-500 to-indigo-600",
    };

    setCustomPersonas((prev) => [...prev, newPersona]);
    onSelectPersona(newPersona);
    setShowCustomModal(false);
    setIsOpen(false);
    setCustomName("");
    setCustomRole("");
    setCustomPrompt("");
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Selector Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium transition-all shadow-sm cursor-pointer"
        title="Switch AI Persona & Assistant Style"
      >
        <span className="text-sm">{selectedPersona.avatar}</span>
        <span className="truncate max-w-[110px] sm:max-w-[140px] text-[11px] font-semibold">
          {selectedPersona.name}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="px-2 py-1.5 flex items-center justify-between border-b border-[var(--border)] mb-1">
            <span className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              AI Personas & Specialists
            </span>
            <button
              onClick={() => {
                setShowCustomModal(true);
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:text-sky-600 font-semibold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 py-1">
            {allPersonas.map((persona) => {
              const isSelected = selectedPersona.id === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-sky-500/15 border border-sky-500/30 text-[var(--foreground)]"
                      : "hover:bg-[var(--muted)] text-[var(--foreground)] border border-transparent"
                  )}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{persona.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate block">
                        {persona.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 ml-1" />
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block truncate">
                      {persona.role}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]/80 line-clamp-1 mt-0.5">
                      {persona.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Persona Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm">Create Custom AI Persona</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-4 gap-2.5">
                <div className="col-span-1">
                  <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                    Avatar Emoji
                  </label>
                  <input
                    type="text"
                    value={customAvatar}
                    onChange={(e) => setCustomAvatar(e.target.value)}
                    maxLength={2}
                    className="w-full text-center text-lg px-2 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                    Persona Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Security Auditor"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                  Role / Specialty Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Security & Pentesting Expert"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                  Custom System Instructions
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe how this persona should respond, its tone, rules, and specialized domain expertise..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition-colors cursor-pointer"
                >
                  Create Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
