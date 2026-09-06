"use client";

import React, { useState, useEffect } from "react";
import { UserMemoryItem, MemoryCategory } from "@/lib/memory/types";
import {
  getStoredMemories,
  addMemory,
  deleteMemory,
  togglePinMemory,
  updateMemory,
  DEFAULT_INITIAL_MEMORIES,
  saveStoredMemories,
} from "@/lib/memory/store";
import {
  Brain,
  Plus,
  Trash2,
  Pin,
  Search,
  X,
  Sparkles,
  Check,
  Copy,
  Tag,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<MemoryCategory, { label: string; color: string; badge: string }> = {
  bio: { label: "Bio & Identity", color: "text-purple-500", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  "tech-stack": { label: "Tech Stack", color: "text-sky-500", badge: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
  preference: { label: "Preference", color: "text-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  rule: { label: "Rule & Invariant", color: "text-rose-500", badge: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  project: { label: "Project Context", color: "text-indigo-500", badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  fact: { label: "General Fact", color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

export function MemoryHubModal({ isOpen, onClose }: MemoryHubModalProps) {
  const [memories, setMemories] = useState<UserMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("preference");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMemories(getStoredMemories());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const created = addMemory({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });

    setMemories((prev) => [created, ...prev]);
    setNewTitle("");
    setNewContent("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleTogglePin = (id: string) => {
    togglePinMemory(id);
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const handleResetDefaults = () => {
    saveStoredMemories(DEFAULT_INITIAL_MEMORIES);
    setMemories(DEFAULT_INITIAL_MEMORIES);
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] p-5 sm:p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">
                Personal Memory & Knowledge Hub
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Facts, preferences, and guidelines My AI recalls automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddForm((f) => !f)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add Memory Form Accordion */}
        {showAddForm && (
          <form
            onSubmit={handleCreateMemory}
            className="p-4 my-3 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3 text-xs animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-400">
                New Knowledge or Rule Entry
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-[var(--muted-foreground)] block mb-1">
                  Title / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coding Preference, Project Rule"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-[var(--muted-foreground)] block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs focus:outline-none focus:border-purple-500"
                >
                  {Object.entries(CATEGORY_COLORS).map(([cat, info]) => (
                    <option key={cat} value={cat}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-[var(--muted-foreground)] block mb-1">
                Context / Detail
              </label>
              <textarea
                rows={2}
                placeholder="What should My AI remember about this?"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-xs focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-xs"
              >
                Save Memory
              </button>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] select-none">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--muted)]/40 border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                selectedCategory === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              All ({memories.length})
            </button>
            {Object.entries(CATEGORY_COLORS).map(([cat, info]) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as MemoryCategory)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                  selectedCategory === cat
                    ? "bg-purple-600 text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                {info.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {filteredMemories.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No memory items found.</p>
            </div>
          ) : (
            filteredMemories.map((item) => {
              const catInfo = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.fact;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs bg-[var(--card)] hover:border-purple-500/30",
                    item.pinned ? "border-purple-500/40 bg-purple-500/5" : "border-[var(--border)]"
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold",
                          catInfo.badge
                        )}
                      >
                        {catInfo.label}
                      </span>
                      {item.pinned && (
                        <span className="text-[10px] text-purple-500 font-mono flex items-center gap-0.5">
                          <Pin className="w-3 h-3 fill-current" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 text-slate-400">
                    <button
                      onClick={() => handleTogglePin(item.id)}
                      className={cn(
                        "p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors cursor-pointer",
                        item.pinned ? "text-purple-500" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      )}
                      title={item.pinned ? "Unpin memory" : "Pin memory to prioritize"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer text-[var(--muted-foreground)]"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)] select-none">
          <span>{memories.length} Active Memories Injected into Context</span>
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
}
