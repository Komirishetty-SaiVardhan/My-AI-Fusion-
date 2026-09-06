"use client";

import React from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { ProactiveAction } from "@/lib/proactive/types";

interface ProactiveActionChipsProps {
  actions: ProactiveAction[];
  onActionClick: (prompt: string) => void;
}

export const ProactiveActionChips: React.FC<ProactiveActionChipsProps> = ({
  actions,
  onActionClick,
}) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Anticipated Next Steps</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={() => onActionClick(act.prompt)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-indigo-950/40 border border-zinc-800 hover:border-indigo-500/50 text-xs text-zinc-300 hover:text-indigo-200 transition-all shadow-sm hover:shadow-indigo-500/10 active:scale-95"
            title={act.prompt}
          >
            <span>{act.label}</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
