"use client";

import React, { useState } from "react";
import { Folder, Plus, Check, ChevronDown, FolderPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceItem {
  id: string;
  name: string;
  description?: string;
  color: string;
}

const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  { id: "default", name: "Personal Workspace", description: "Default private workspace", color: "bg-sky-500" },
  { id: "engineering", name: "Engineering & Code", description: "Architecture, code synthesis & APIs", color: "bg-emerald-500" },
  { id: "research", name: "Study & Research", description: "Calculus, science papers & notes", color: "bg-purple-500" },
];

interface WorkspaceSelectorProps {
  className?: string;
  isCollapsed?: boolean;
}

export function WorkspaceSelector({ className, isCollapsed }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("default");
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    const colors = ["bg-sky-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500"];
    const newWs: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      name: newWorkspaceName.trim(),
      description: "Custom project collection",
      color: colors[workspaces.length % colors.length],
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    setNewWorkspaceName("");
    setShowAddModal(false);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-medium transition-all shadow-sm cursor-pointer",
          isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2"
        )}
        title={`Workspace: ${activeWorkspace.name}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", activeWorkspace.color)} />
          {!isCollapsed && <span className="truncate font-semibold text-xs">{activeWorkspace.name}</span>}
        </div>
        {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5 dark:ring-white/10"
        >
          <div className="px-2 py-1 flex items-center justify-between border-b border-[var(--border)] mb-1">
            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Project Workspaces
            </span>
            <button
              onClick={() => {
                setShowAddModal(true);
                setIsOpen(false);
              }}
              className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:text-sky-600 font-semibold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspaceId;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspaceId(ws.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer text-xs",
                    isSelected
                      ? "bg-sky-500/15 text-[var(--foreground)] font-semibold"
                      : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", ws.color)} />
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* New Workspace Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-sky-500" />
                <h4 className="font-semibold text-xs">Create New Workspace</h4>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Investor Pitch"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-2.5 py-1 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
