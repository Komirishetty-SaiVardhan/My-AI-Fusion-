"use client";

import React from "react";
import {
  Sparkles,
  Globe,
  Brain,
  FileText,
  Code2,
  Image as ImageIcon,
  FileDown,
  Zap,
  BarChart3,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface QuickAction {
  icon: React.ElementType;
  title: string;
  category: "Image" | "PDF & Docs" | "Research" | "Reasoning" | "Code" | "Charts";
  prompt: string;
  badge: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: ImageIcon,
    category: "Image",
    title: "Generate AI Image",
    prompt: "Generate a photorealistic 8K image of a futuristic cybernetic city at sunset with flying cars and glowing neon reflections.",
    badge: "AI Image",
  },
  {
    icon: FileDown,
    category: "PDF & Docs",
    title: "Create PDF Report",
    prompt: "Create a comprehensive executive project proposal document for a cloud AI migration and prepare it for PDF export with structured sections and budget tables.",
    badge: "PDF Export",
  },
  {
    icon: Globe,
    category: "Research",
    title: "Deep Web Research",
    prompt: "Research the latest architectural breakthroughs in AI agents and Next.js 16 App Router and synthesize a detailed summary.",
    badge: "Web Research",
  },
  {
    icon: Brain,
    category: "Reasoning",
    title: "System Reasoning",
    prompt: "Explain how distributed consensus algorithms like Raft handle split-brain scenarios and leader election step-by-step.",
    badge: "Deep Reasoning",
  },
  {
    icon: Code2,
    category: "Code",
    title: "TypeScript Architecture",
    prompt: "Write a high-performance TypeScript hook with generic types, debounce logic, error boundaries, and abort signals.",
    badge: "Coding",
  },
  {
    icon: BarChart3,
    category: "Charts",
    title: "Interactive Data Chart",
    prompt: "Generate an interactive data comparison chart of the top 5 cloud AI platforms by performance and market adoption with an embedded ```chart JSON block.",
    badge: "Chart Visualizer",
  },
];

export function EmptyState() {
  const { sendMessage } = useChat();

  const handleSelectPrompt = (item: QuickAction) => {
    sendMessage(item.prompt, { mode: "auto" });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center select-none">
      {/* Brand Icon & Heading */}
      <div className="mb-3 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-sky-500/25 ring-4 ring-sky-500/10">
        <Sparkles className="w-7 h-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2">
        What can I create for you today?
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] max-w-lg mb-6 leading-relaxed">
        <span className="inline-flex items-center gap-1 font-semibold text-sky-500">
          <Zap className="w-3.5 h-3.5" /> My AI
        </span>{" "}
        seamlessly generates photorealistic AI images, prepares publication-ready PDF documents, conducts deep web research, and writes production code.
      </p>

      {/* Quick Action Category Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl">
        {(["Image", "PDF & Docs", "Research", "Reasoning", "Code", "Charts"] as const).map(
          (category) => {
            const action = QUICK_ACTIONS.find((a) => a.category === category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => action && handleSelectPrompt(action)}
                className="px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:border-sky-500 hover:text-sky-500 text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                {category}
              </button>
            );
          }
        )}
      </div>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-3xl text-left">
        {QUICK_ACTIONS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleSelectPrompt(item)}
              className="group p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-sky-500/50 hover:shadow-md hover:shadow-sky-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg bg-[var(--muted)] text-sky-500 group-hover:bg-sky-500/10 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:text-sky-500 group-hover:bg-sky-500/10 transition-colors">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-[var(--foreground)] group-hover:text-sky-500 transition-colors mb-1 truncate">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
