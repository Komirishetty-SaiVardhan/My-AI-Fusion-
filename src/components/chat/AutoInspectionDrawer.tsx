"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Clock,
  Layers,
  ExternalLink,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { AutoExecutionDetails } from "@/lib/auto/types";

interface AutoInspectionDrawerProps {
  details: AutoExecutionDetails;
}

export function AutoInspectionDrawer({ details }: AutoInspectionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40 transition-colors cursor-pointer select-none font-medium"
      >
        <span className="flex items-center gap-2 text-sky-500">
          <Cpu className="w-3.5 h-3.5" />
          <span>Execution Details & Route Inspection</span>
        </span>
        <span className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
          <span>{details.executionTimeMs}ms</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-[var(--border)] space-y-3 bg-[var(--card)]">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Model Route</span>
              <span className="font-semibold text-[11px] text-[var(--foreground)] truncate block">
                {details.modelRoute}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Total Latency
              </span>
              <span className="font-semibold text-[11px] text-[var(--foreground)] block">
                {details.executionTimeMs}ms
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" /> Tokens Used
              </span>
              <span className="font-semibold text-[11px] text-[var(--foreground)] block">
                {details.tokensUsed || 480}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[var(--muted)]/50 border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block flex items-center gap-1">
                <Coins className="w-2.5 h-2.5" /> Est. Cost
              </span>
              <span className="font-semibold text-[11px] text-[var(--foreground)] block">
                ${(details.estimatedCostUsd || 0.0004).toFixed(5)}
              </span>
            </div>
          </div>

          {/* Tools Used */}
          {details.toolsUsed.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Tools Executed ({details.toolsUsed.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {details.toolsUsed.map((tool, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-mono"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sourced References */}
          {details.sources.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider block mb-1.5">
                Grounded Sources ({details.sources.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                {details.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--muted)]/40 hover:bg-[var(--muted)] transition-colors text-[11px] group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-sky-500 font-bold">[{idx + 1}]</span>
                      <span className="text-[var(--foreground)] font-medium truncate">
                        {src.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 flex-shrink-0 ml-2">
                      {src.domain}
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
