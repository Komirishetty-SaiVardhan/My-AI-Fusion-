"use client";

import React, { useState, memo } from "react";
import { DeepResearchReport, ResearchSource } from "@/lib/research/types";
import { parseDeepResearchReport, SAMPLE_RESEARCH_REPORT } from "@/lib/research/engine";
import {
  Globe,
  Search,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  FileText,
  Layers,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeepResearchViewerProps {
  rawContent?: string;
  initialTopic?: string;
  className?: string;
}

function DeepResearchViewerComponent({
  rawContent,
  initialTopic,
  className,
}: DeepResearchViewerProps) {
  const report: DeepResearchReport = rawContent
    ? parseDeepResearchReport(rawContent, initialTopic)
    : SAMPLE_RESEARCH_REPORT;

  const [activeTab, setActiveTab] = useState<"report" | "sources" | "steps">("report");
  const [copied, setCopied] = useState(false);

  const handleCopyReport = async () => {
    try {
      const text = `# ${report.topic}\n\n## Abstract\n${report.abstract}\n\n## Key Findings\n${report.keyFindings.map((k) => `- ${k}`).join("\n")}\n\n${report.contentMarkdown}\n\n## Sources Consulted\n${report.sources.map((s) => `- [${s.title}](${s.url}) (${s.authorOrDomain || "Web"})`).join("\n")}`;
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
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 via-sky-950/40 to-slate-900/40 border-b border-[var(--border)] select-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                Autonomous Deep Web Research
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] leading-tight">
                {report.topic}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
              {report.confidenceScore}% Verified
            </span>
            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--muted)] hover:bg-[var(--foreground)] hover:text-[var(--background)] text-[11px] font-medium transition-colors border border-[var(--border)] cursor-pointer"
              title="Copy complete research report"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Report"}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 mt-3 text-xs">
          <button
            onClick={() => setActiveTab("report")}
            className={cn(
              "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "report"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Synthesized Report</span>
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={cn(
              "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "sources"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Sources ({report.sources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("steps")}
            className={cn(
              "px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "steps"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Research Plan ({report.steps.length})</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-h-[520px] overflow-y-auto">
        {/* Tab 1: Synthesized Report */}
        {activeTab === "report" && (
          <div className="space-y-5">
            {/* Abstract */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs leading-relaxed space-y-1">
              <span className="font-bold text-emerald-500 uppercase tracking-wider text-[10px] block">
                Research Abstract
              </span>
              <p className="text-[var(--foreground)] leading-relaxed">
                {report.abstract}
              </p>
            </div>

            {/* Key Findings List */}
            {report.keyFindings && report.keyFindings.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--muted)]/20 border border-[var(--border)] space-y-2">
                <span className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider block">
                  Core Validated Discoveries
                </span>
                <div className="space-y-1.5">
                  {report.keyFindings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content Sections */}
            <div className="text-xs sm:text-sm text-[var(--foreground)] space-y-3 whitespace-pre-wrap leading-relaxed">
              {report.contentMarkdown}
            </div>

            {/* Open Questions */}
            {report.openQuestions && report.openQuestions.length > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1 text-xs">
                <span className="font-semibold text-amber-500 flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Unresolved Frontiers & Open Questions</span>
                </span>
                <ul className="space-y-1 text-[11px] text-[var(--muted-foreground)] pt-1">
                  {report.openQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Verified Sources & Bibliography */}
        {activeTab === "sources" && (
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cross-Referenced Primary Literature ({report.sources.length})</span>
            </h4>

            <div className="space-y-2.5">
              {report.sources.map((src, i) => (
                <div
                  key={src.id || i}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-emerald-500/30 transition-all space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-xs text-sky-500 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{src.title}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>

                    <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px]">
                      {src.authorOrDomain && (
                        <span className="px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] font-mono">
                          {src.authorOrDomain}
                        </span>
                      )}
                      {src.reliabilityScore && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold font-mono">
                          {src.reliabilityScore}% Score
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                    {src.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Research Stepper Plan */}
        {activeTab === "steps" && (
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-sky-500" />
              <span>Autonomous Search & Verification Pipeline</span>
            </h4>

            <div className="space-y-3">
              {report.steps.map((step, i) => (
                <div
                  key={step.id || i}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {step.query}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                      {step.stage}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed pl-7">
                    {step.findingsSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const DeepResearchViewer = memo(DeepResearchViewerComponent);
