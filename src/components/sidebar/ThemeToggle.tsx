"use client";

import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between p-1 rounded-xl bg-[var(--muted)] border border-[var(--border)] text-xs select-none">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium",
          theme === "light"
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        )}
        title="Light theme"
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px]">Light</span>
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium",
          theme === "dark"
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        )}
        title="Dark theme"
      >
        <Moon className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px]">Dark</span>
      </button>

      <button
        onClick={() => setTheme("system")}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer font-medium",
          theme === "system"
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        )}
        title="Follow system appearance"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="text-[11px]">Auto</span>
      </button>
    </div>
  );
}
