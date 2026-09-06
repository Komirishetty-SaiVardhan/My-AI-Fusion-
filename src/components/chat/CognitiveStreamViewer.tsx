"use client";

import React, { useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { CognitiveStreamData, CognitiveStage } from "@/lib/cognitive/types";
import { parseCognitiveStreamMarkdown } from "@/lib/cognitive/engine";

interface CognitiveStreamViewerProps {
  data?: CognitiveStreamData;
  rawMarkdown?: string;
  defaultOpen?: boolean;
}

export const CognitiveStreamViewer: React.FC<CognitiveStreamViewerProps> = ({
  data,
  rawMarkdown,
  defaultOpen = false,
}) => {
  const stream = data || (rawMarkdown ? parseCognitiveStreamMarkdown(rawMarkdown) : null);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!stream) return null;

  const getStageBadge = (stage: CognitiveStage) => {
    switch (stage) {
      case "hypothesis":
        return {
          label: "Hypothesis",
          icon: <Lightbulb className="w-3 h-3 text-blue-400" />,
          color: "bg-blue-500/10 text-blue-300 border-blue-500/30",
        };
      case "analysis":
        return {
          label: "Analysis",
          icon: <Zap className="w-3 h-3 text-cyan-400" />,
          color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
        };
      case "counterpoint":
        return {
          label: "Counterpoint & Risk",
          icon: <ShieldAlert className="w-3 h-3 text-amber-400" />,
          color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        };
      case "refinement":
        return {
          label: "Refinement",
          icon: <Sparkles className="w-3 h-3 text-purple-400" />,
          color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
        };
      case "decision":
        return {
          label: "Decision",
          icon: <Brain className="w-3 h-3 text-emerald-400" />,
          color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
        };
    }
  };

  return (
    <div className="my-3 rounded-xl border border-zinc-800/90 bg-zinc-950/70 overflow-hidden text-zinc-200 font-sans shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-900/90 hover:bg-zinc-800/60 transition text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Cognitive Monologue
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                {stream.thoughts.length} Thought Steps
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate max-w-sm mt-0.5">
              {stream.summary || stream.topic}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stream.totalTimeMs && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>{stream.totalTimeMs}ms</span>
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-zinc-800/80 space-y-2.5 bg-zinc-950/90">
          {stream.thoughts.map((th, index) => {
            const badge = getStageBadge(th.stage);
            return (
              <div
                key={th.id || index}
                className="p-3 rounded-lg border border-zinc-800/70 bg-zinc-900/50 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-xs font-medium text-zinc-200">{th.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {th.confidence}% Confidence
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed pl-1">{th.thought}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
