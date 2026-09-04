"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Cpu, Zap, Brain } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";

export interface ModelOption {
  id: string;
  name: string;
  version: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-3.6-flash",
    name: "My AI Flash",
    version: "3.6 Flash",
    badge: "Ultra Fast",
    description: "Ultra-fast multimodal reasoning, instant answers & tool execution",
    icon: Zap,
  },
  {
    id: "gemini-3.7-flash",
    name: "My AI Pro",
    version: "3.7 Pro",
    badge: "Deep Reasoning",
    description: "Deep problem solving, complex logic, mathematical analysis & coding",
    icon: Brain,
  },
  {
    id: "gemini-3.5-flash",
    name: "My AI Omni",
    version: "3.5 Omni",
    badge: "Vision & Logic",
    description: "High-accuracy vision comprehension, image analysis & creative tasks",
    icon: Sparkles,
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "My AI Lite",
    version: "3.7 Lite",
    badge: "Light & Fast",
    description: "Lightweight, ultra-low latency response engine optimized for speed",
    icon: Cpu,
  },
];

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const Icon = activeModel.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative select-none">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] hover:border-sky-500/30 text-xs font-medium text-[var(--foreground)] transition-all cursor-pointer shadow-xs"
        title="Switch active My AI engine"
      >
        <Icon className="w-3.5 h-3.5 text-sky-500" />
        <span className="font-semibold text-[11px]">{activeModel.name}</span>
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-500 font-semibold">
          {activeModel.version}
        </span>
        <ChevronDown className={cn("w-3 h-3 opacity-60 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-1.5 w-72 rounded-2xl border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-[var(--border)] mb-1">
            <span className="text-[10px] font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
              Select My AI Version
            </span>
            <span className="text-[9px] text-sky-500 font-medium">By Sai Vardhan</span>
          </div>

          <div className="space-y-1">
            {AVAILABLE_MODELS.map((model) => {
              const ModelIcon = model.icon;
              const isSelected = model.id === activeModel.id;

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium ring-1 ring-sky-500/30"
                      : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg bg-[var(--muted)] mt-0.5", isSelected && "bg-sky-500/20 text-sky-500")}>
                    <ModelIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">{model.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--muted)] text-[var(--muted-foreground)] font-medium">
                          {model.version}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-500 font-medium">
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2 mt-0.5 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

