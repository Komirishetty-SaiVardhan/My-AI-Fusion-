"use client";

import React, { useState, memo } from "react";
import { MeetingSummaryData, MeetingActionItem } from "@/lib/audio-summary/types";
import { parseMeetingSummary, SAMPLE_MEETING_SUMMARY } from "@/lib/audio-summary/engine";
import {
  Headphones,
  Clock,
  CheckCircle2,
  ListTodo,
  FileText,
  Copy,
  Check,
  Play,
  Pause,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioMeetingViewerProps {
  rawContent?: string;
  initialTitle?: string;
  className?: string;
}

function AudioMeetingViewerComponent({
  rawContent,
  initialTitle,
  className,
}: AudioMeetingViewerProps) {
  const [data, setData] = useState<MeetingSummaryData>(() =>
    rawContent ? parseMeetingSummary(rawContent, initialTitle) : SAMPLE_MEETING_SUMMARY
  );

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleActionItem = (id: string) => {
    setData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((act) =>
        act.id === id ? { ...act, completed: !act.completed } : act
      ),
    }));
  };

  const handleCopyMinutes = async () => {
    try {
      let doc = `# ${data.title}\n**Duration:** ${data.audioDuration}\n\n## Executive Summary\n${data.executiveSummary}\n\n## Key Chapters\n`;
      data.chapters.forEach((ch) => {
        doc += `- **[${ch.timestamp}] ${ch.title}**: ${ch.summary} *(Speaker: ${ch.speaker || "General"})*\n`;
      });
      doc += `\n## Key Decisions\n`;
      data.decisions.forEach((d) => {
        doc += `- **${d.topic}**: ${d.decision} ${d.rationale ? `*(Rationale: ${d.rationale})*` : ""}\n`;
      });
      doc += `\n## Action Items\n`;
      data.actionItems.forEach((act) => {
        doc += `- [${act.completed ? "x" : " "}] **${act.task}** ${act.assignee ? `(Assignee: ${act.assignee})` : ""} ${act.dueDate ? `(Due: ${act.dueDate})` : ""}\n`;
      });

      await navigator.clipboard.writeText(doc);
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
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border-b border-[var(--border)] select-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold flex-shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold block">
                Audio Meeting & Lecture Digest
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] leading-tight">
                {data.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)]">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>{data.audioDuration}</span>
            </span>

            <button
              onClick={handleCopyMinutes}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[11px] font-medium transition-colors border border-[var(--border)] cursor-pointer"
              title="Copy formatted meeting minutes"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Minutes"}</span>
            </button>
          </div>
        </div>

        {/* Key Topics Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          {data.keyTopics.map((topic, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--muted)]/80 text-[var(--muted-foreground)] border border-[var(--border)] font-medium"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-h-[520px] overflow-y-auto">
        {/* Executive Summary Box */}
        <div className="p-4 rounded-2xl bg-[var(--muted)]/20 border border-[var(--border)] text-xs leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 text-amber-500 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Takeaway</span>
          </div>
          <p className="text-[var(--foreground)] leading-relaxed">
            {data.executiveSummary}
          </p>
        </div>

        {/* Timestamped Chapters Stepper */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>Timeline Chapters & Highlights ({data.chapters.length})</span>
          </h4>

          <div className="space-y-2">
            {data.chapters.map((ch, idx) => (
              <div
                key={ch.id || idx}
                onClick={() => setActiveChapterIndex(idx)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs",
                  activeChapterIndex === idx
                    ? "bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/20"
                    : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/40"
                )}
              >
                <span className="font-mono text-[11px] font-bold px-2 py-1 rounded-md bg-sky-500/20 text-sky-500 flex-shrink-0">
                  {ch.timestamp}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-[var(--foreground)] truncate">
                      {ch.title}
                    </span>
                    {ch.speaker && (
                      <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 flex-shrink-0">
                        <User className="w-3 h-3 text-indigo-400" />
                        <span>{ch.speaker}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                    {ch.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Decisions Log */}
        {data.decisions && data.decisions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Decisions Log ({data.decisions.length})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {data.decisions.map((d, i) => (
                <div
                  key={d.id || i}
                  className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1"
                >
                  <span className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 block">
                    {d.topic}
                  </span>
                  <p className="text-xs text-[var(--foreground)] font-medium">
                    {d.decision}
                  </p>
                  {d.rationale && (
                    <p className="text-[10px] text-[var(--muted-foreground)] italic pt-0.5">
                      Rationale: {d.rationale}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items Checklist */}
        {data.actionItems && data.actionItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
              <span>Action Items & Ownership ({data.actionItems.length})</span>
            </h4>

            <div className="space-y-2">
              {data.actionItems.map((act) => (
                <div
                  key={act.id}
                  onClick={() => toggleActionItem(act.id)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-xs",
                    act.completed
                      ? "bg-emerald-500/5 border-emerald-500/30 opacity-75 line-through"
                      : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={Boolean(act.completed)}
                      onChange={() => toggleActionItem(act.id)}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-medium text-[var(--foreground)] truncate">
                      {act.task}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                    {act.assignee && (
                      <span className="px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] font-medium">
                        @{act.assignee}
                      </span>
                    )}
                    {act.dueDate && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
                        {act.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const AudioMeetingViewer = memo(AudioMeetingViewerComponent);
