"use client";

import React, { useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Layers,
  Search,
  Sparkles,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCode,
  Copy,
  Check,
} from "lucide-react";
import { AgentTaskData, AgentStepType } from "@/lib/agent/types";
import { parseAgentTaskMarkdown } from "@/lib/agent/engine";

interface AgentTaskViewerProps {
  data?: AgentTaskData;
  rawMarkdown?: string;
}

export const AgentTaskViewer: React.FC<AgentTaskViewerProps> = ({
  data,
  rawMarkdown,
}) => {
  const task = data || (rawMarkdown ? parseAgentTaskMarkdown(rawMarkdown) : null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    "step-1": true,
  });
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    task?.artifacts?.[0]?.id || null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!task) return null;

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyArtifact = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStepIcon = (type: AgentStepType) => {
    switch (type) {
      case "plan":
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case "search":
        return <Search className="w-4 h-4 text-blue-400" />;
      case "code":
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case "verify":
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case "reflect":
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case "finalize":
        return <Sparkles className="w-4 h-4 text-rose-400" />;
    }
  };

  const selectedArtifact = task.artifacts?.find((a) => a.id === selectedArtifactId);

  return (
    <div className="my-4 rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden font-sans text-white">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shadow-md">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Autonomous Task Agent
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {task.status.toUpperCase()}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">{task.goal}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {task.confidenceScore && (
            <div className="flex items-center gap-1 text-emerald-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{task.confidenceScore}% Confidence</span>
            </div>
          )}
          {task.totalTimeMs && (
            <div className="flex items-center gap-1 text-zinc-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{(task.totalTimeMs / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-700"
          style={{ width: `${task.progressPercent}%` }}
        />
      </div>

      {/* Steps Execution Timeline */}
      <div className="p-4 space-y-3">
        {task.steps.map((step) => {
          const isExpanded = !!expandedSteps[step.id];
          return (
            <div
              key={step.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                    {getStepIcon(step.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-200">{step.title}</span>
                      {step.status === "completed" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{step.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {step.durationMs && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {step.durationMs}ms
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 space-y-2.5 text-xs">
                  {/* Step Logs */}
                  {step.logs && step.logs.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        <Terminal className="w-3 h-3 text-zinc-500" />
                        Execution Trace
                      </div>
                      <div className="bg-zinc-900/90 rounded-lg p-2.5 font-mono text-[11px] text-zinc-300 space-y-1 border border-zinc-800">
                        {step.logs.map((log, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-zinc-600">›</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Self-Reflection & Self-Correction Callout */}
                  {step.selfReflection && (
                    <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-purple-200">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px] text-purple-400 mb-1">
                        <Cpu className="w-3 h-3" />
                        Human-Like Self-Reflection & Critique
                      </div>
                      <p className="text-[11px] leading-relaxed">{step.selfReflection}</p>
                    </div>
                  )}

                  {step.output && (
                    <div className="text-emerald-300 font-medium">{step.output}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Artifacts Viewer Section */}
      {task.artifacts && task.artifacts.length > 0 && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Generated Agent Artifacts ({task.artifacts.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {task.artifacts.map((art) => (
              <button
                key={art.id}
                onClick={() => setSelectedArtifactId(art.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                  selectedArtifactId === art.id
                    ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/60"
                    : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200"
                }`}
              >
                {art.name}
              </button>
            ))}
          </div>

          {selectedArtifact && (
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <button
                onClick={() => copyArtifact(selectedArtifact.id, selectedArtifact.content)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Copy artifact content"
              >
                {copiedId === selectedArtifact.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <pre className="text-xs font-mono text-zinc-300 overflow-x-auto pr-8">
                <code>{selectedArtifact.content}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Final Outcome Summary */}
      {task.finalResult && (
        <div className="p-3.5 bg-emerald-950/20 border-t border-emerald-900/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{task.finalResult}</span>
        </div>
      )}
    </div>
  );
};
