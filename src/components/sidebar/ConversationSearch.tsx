"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface ConversationSearchProps {
  value: string;
  onChange: (query: string) => void;
  isCollapsed?: boolean;
}

export function ConversationSearch({ value, onChange, isCollapsed }: ConversationSearchProps) {
  if (isCollapsed) return null;

  return (
    <div className="relative px-3 py-1.5">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search chats..."
          className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--card)]/60 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 p-0.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
