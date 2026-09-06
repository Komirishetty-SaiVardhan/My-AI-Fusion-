"use client";

import React, { useState, memo } from "react";
import { DebateSession, DebateTurn, DebateAgent } from "@/lib/debate/types";
import { parseDebateSession, SAMPLE_DEBATE_SESSION } from "@/lib/debate/engine";
import {
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DebateViewerProps {
  rawContent?: string;
  initialTopic?: string;
  className?: string;
}

const STANCE_BADGES = {
  pro: { label: "Proponent", bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  con: { label: "Skeptic", bg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  pragmatic: { label: "Pragmatist", bg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
  neutral: { label: "Moderator", bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
};

function DebateViewerComponent({
  rawContent,
  initialTopic,
  className,
}: DebateViewerProps) {
  const session: DebateSession = rawContent
    ? parseDebateSession(rawContent, initialTopic)
    : SAMPLE_DEBATE_SESSION;

  const [activeTab, setActiveTab] = useState<"rounds" | "verdict">("rounds");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const agentMap = new Map<string, DebateAgent>();
  session.agents.forEach((a) => agentMap.set(a.id, a));

  const filteredTurns = selectedAgentId
    ? session.turns.filter((t) => t.agentId === selectedAgentId)
    : session.turns;

  const handleCopyVerdict = async () => {
    try {
      const text = `# ${session.synthesis.consensusTitle}\n\n## Recommendation\n${session.synthesis.recommendation}\n\n### Action Items\n${session.synthesis.actionItems.join("\n")}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xl overflow-hidden [contain:content]",
        className
      )}
    >
      {/* Debate Top Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-sky-950/40 border-b border-[var(--border)] select-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                Multi-Agent Expert Panel Debate
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] leading-tight">
                {session.topic}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--muted)]/60 p-1 rounded-xl border border-[var(--border)] text-xs">
            <button
              onClick={() => setActiveTab("rounds")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                activeTab === "rounds"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Debate Rounds ({session.turns.length})
            </button>
            <button
              onClick={() => setActiveTab("verdict")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1",
                activeTab === "verdict"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Verdict & Consensus</span>
            </button>
          </div>
        </div>

        {/* Participating Agent Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
          <button
            onClick={() => setSelectedAgentId(null)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border cursor-pointer",
              !selectedAgentId
                ? "bg-[var(--foreground)] text-[var(--background)] border-transparent"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            )}
          >
            All Experts
          </button>
          {session.agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(selectedAgentId === agent.id ? null : agent.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer",
                selectedAgentId === agent.id
                  ? "ring-2 ring-indigo-500 bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <span>{agent.avatar}</span>
              <span>{agent.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Round-by-Round Timeline */}
      {activeTab === "rounds" && (
        <div className="p-4 sm:p-5 space-y-4 max-h-[500px] overflow-y-auto">
          {filteredTurns.map((turn, index) => {
            const agent = agentMap.get(turn.agentId) || session.agents[0];
            const badge = STANCE_BADGES[agent.stance] || STANCE_BADGES.neutral;

            return (
              <div
                key={turn.id || index}
                className="relative pl-6 pb-2 border-l-2 border-slate-700/40 last:border-transparent animate-in fade-in duration-150"
              >
                {/* Timeline node icon */}
                <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[var(--card)] border-2 border-indigo-500 flex items-center justify-center text-sm shadow-md">
                  {agent.avatar}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 p-4 shadow-sm hover:border-indigo-500/30 transition-all">
                  {/* Speaker Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--foreground)]">
                        {agent.name}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] hidden sm:inline">
                        • {agent.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold",
                          badge.bg
                        )}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        {turn.confidenceScore}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Stage Label */}
                  <div className="inline-block text-[10px] font-mono text-sky-400 mb-2 font-semibold">
                    Round {turn.roundNumber}: {turn.stageName}
                  </div>

                  {/* Argument Content */}
                  <p className="text-xs leading-relaxed text-[var(--foreground)] mb-3 whitespace-pre-wrap">
                    {turn.content}
                  </p>

                  {/* Key Takeaways */}
                  {turn.keyPoints && turn.keyPoints.length > 0 && (
                    <div className="space-y-1 bg-[var(--card)] p-2.5 rounded-xl border border-[var(--border)] text-xs">
                      <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
                        Core Arguments:
                      </span>
                      {turn.keyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                          <ChevronRight className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Master Verdict & Actionable Consensus */}
      {activeTab === "verdict" && (
        <div className="p-4 sm:p-6 space-y-5 max-h-[500px] overflow-y-auto">
          {/* Executive Recommendation Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-sky-500/10 border border-amber-500/30 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Master Synthesizer Consensus
                </span>
              </div>
              <button
                onClick={handleCopyVerdict}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 hover:text-amber-400 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy Verdict"}</span>
              </button>
            </div>
            <h4 className="font-bold text-sm text-[var(--foreground)] mb-2">
              {session.synthesis.consensusTitle}
            </h4>
            <p className="text-xs text-[var(--foreground)] leading-relaxed">
              {session.synthesis.recommendation}
            </p>
          </div>

          {/* Side-by-Side Pros & Cons Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pros */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
              <span className="font-bold text-emerald-500 flex items-center gap-1.5 mb-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validated Advantages</span>
              </span>
              <ul className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
                {session.synthesis.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons / Tradeoffs */}
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs">
              <span className="font-bold text-rose-500 flex items-center gap-1.5 mb-2 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Identified Risks & Costs</span>
              </span>
              <ul className="space-y-1.5 text-[11px] text-[var(--muted-foreground)]">
                {session.synthesis.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Items Checklist */}
          {session.synthesis.actionItems && session.synthesis.actionItems.length > 0 && (
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 text-xs">
              <span className="font-bold text-[var(--foreground)] flex items-center gap-1.5 mb-2.5 text-xs">
                <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
                <span>Strategic Action Plan</span>
              </span>
              <div className="space-y-1.5">
                {session.synthesis.actionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[11px]">
                    <div className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center text-[9px] flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-[var(--foreground)]">{item.replace(/^[0-9.]+\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const DebateViewer = memo(DebateViewerComponent);
