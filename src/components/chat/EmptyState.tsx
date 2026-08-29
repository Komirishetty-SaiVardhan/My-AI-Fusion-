"use client";

import React from "react";
import {
  Sparkles,
  Globe,
  Scale,
  Brain,
  FileText,
  Code2,
  BarChart3,
  Zap,
} from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface QuickAction {
  icon: React.ElementType;
  title: string;
  category: "Explain" | "Research" | "Summarize" | "Compare" | "Create" | "Analyze";
  prompt: string;
  badge: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Scale,
    category: "Compare",
    title: "Laptop Comparison",
    prompt: "Research the best engineering laptop under ₹70,000 and compare the top 5.",
    badge: "Auto Research",
  },
  {
    icon: Globe,
    category: "Research",
    title: "Next.js 16 Server Actions",
    prompt: "Research the latest architectural patterns for Next.js 16 App Router and server actions.",
    badge: "Web Search",
  },
  {
    icon: Brain,
    category: "Explain",
    title: "Distributed Consensus",
    prompt: "Explain how Raft consensus algorithm handles leader election step-by-step.",
    badge: "Deep Reasoning",
  },
  {
    icon: Code2,
    category: "Create",
    title: "React 19 Custom Hook",
    prompt: "Write a high-performance TypeScript hook with generics, error boundaries, and debounce.",
    badge: "Coding",
  },
  {
    icon: BarChart3,
    category: "Analyze",
    title: "System Architecture",
    prompt: "Analyze the trade-offs between LSM-Trees and B-Trees for write-heavy vector workloads.",
    badge: "Analysis",
  },
  {
    icon: FileText,
    category: "Summarize",
    title: "Security & OWASP Top 10",
    prompt: "Summarize modern mitigation strategies for Prompt Injection and SSRF in AI applications.",
    badge: "Summary",
  },
];

export function EmptyState() {
  const { sendMessage } = useChat();

  const handleSelectPrompt = (item: QuickAction) => {
    sendMessage(item.prompt, { mode: "fast" });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full text-center select-none">
      {/* Brand Icon & Heading */}
      <div className="mb-3 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-sky-500/25 ring-4 ring-sky-500/10">
        <Sparkles className="w-7 h-7" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mb-2">
        What can I help you with?
      </h1>
      <p className="text-sm text-[var(--muted-foreground)] max-w-lg mb-6 leading-relaxed">
        <span className="inline-flex items-center gap-1 font-semibold text-sky-500">
          <Zap className="w-3.5 h-3.5" /> Auto Mode
        </span>{" "}
        intelligently orchestrates web research, deep reasoning, tools, and code synthesis with zero manual configuration.
      </p>

      {/* Quick Action Category Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xl">
        {(["Explain", "Research", "Summarize", "Compare", "Create", "Analyze"] as const).map(
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
