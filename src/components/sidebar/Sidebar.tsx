"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  SidebarClose,
  SidebarOpen,
  Bot,
  User,
  LogOut,
  X,
  Sliders,
  FileJson,
  Pin,
  Brain,
  Radio,
  Layers,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useChat } from "@/context/ChatContext";
import { ThemeToggle } from "./ThemeToggle";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationItem } from "./ConversationItem";
import { ExportBackupModal } from "./ExportBackupModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { MemoryHubModal } from "@/components/memory/MemoryHubModal";
import { VoiceCallModal } from "@/components/voice/VoiceCallModal";
import { ProjectWorkspaceModal } from "@/components/workspace/ProjectWorkspaceModal";
import { SAMPLE_PROJECT_WORKSPACE } from "@/lib/workspace/engine";
import { WorkspaceSelector } from "@/components/workspaces/WorkspaceSelector";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
}

export function Sidebar({
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
}: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    pinnedConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    togglePinConversation,
    renameConversation,
  } = useChat();

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [searchQuery, setSearchQuery] = useState("");
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const userDisplayName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userAvatar = user?.imageUrl;

  // Handle keyboard shortcut Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        createNewConversation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewConversation]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Split into Pinned and Recent
  const { pinnedList, recentList } = useMemo(() => {
    const pinned: typeof conversations = [];
    const recent: typeof conversations = [];

    for (const conv of filteredConversations) {
      if (pinnedConversations.includes(conv.id)) {
        pinned.push(conv);
      } else {
        recent.push(conv);
      }
    }

    return { pinnedList: pinned, recentList: recent };
  }, [filteredConversations, pinnedConversations]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sidebar)] text-[var(--foreground)] border-r border-[var(--sidebar-border)] select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--sidebar-border)]">
        {!isCollapsedDesktop && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
                My AI
              </span>
              <span className="text-[10px] text-sky-500 font-mono ml-1.5 px-1.5 py-0.2 rounded bg-sky-500/10">
                v1.0
              </span>
            </div>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapseDesktop}
          className="hidden md:flex p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
          title={isCollapsedDesktop ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsedDesktop ? (
            <SidebarOpen className="w-4 h-4" />
          ) : (
            <SidebarClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
          title="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 pb-1.5">
        <button
          onClick={() => {
            createNewConversation();
            onCloseMobile();
          }}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs shadow-sm shadow-sky-500/20 transition-all cursor-pointer active:scale-[0.98]",
            isCollapsedDesktop && "md:px-2 md:justify-center"
          )}
          title="New Chat (Ctrl+K)"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!isCollapsedDesktop && <span>New Chat</span>}
          {!isCollapsedDesktop && (
            <kbd className="hidden lg:inline-block ml-auto text-[10px] bg-sky-600/60 px-1.5 py-0.5 rounded text-sky-100 font-sans">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="px-3 py-1">
        <WorkspaceSelector isCollapsed={isCollapsedDesktop} />
      </div>

      {/* Search Bar */}
      <ConversationSearch
        value={searchQuery}
        onChange={setSearchQuery}
        isCollapsed={isCollapsedDesktop}
      />

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {/* Pinned Conversations */}
        {pinnedList.length > 0 && (
          <div className="mb-2">
            {!isCollapsedDesktop && (
              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold tracking-wider text-sky-500 uppercase">
                <Pin className="w-3 h-3" />
                <span>Pinned</span>
              </div>
            )}
            <div className="space-y-0.5">
              {pinnedList.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  isPinned={true}
                  isCollapsed={isCollapsedDesktop}
                  onSelect={selectConversation}
                  onDelete={deleteConversation}
                  onTogglePin={togglePinConversation}
                  onRename={renameConversation}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        {!isCollapsedDesktop && (
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
            {pinnedList.length > 0 ? "Recent Chats" : "Conversations"}
          </div>
        )}

        {recentList.length === 0 && pinnedList.length === 0 && searchQuery && (
          <div className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">
            No chats match &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        <div className="space-y-0.5">
          {recentList.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              isPinned={false}
              isCollapsed={isCollapsedDesktop}
              onSelect={selectConversation}
              onDelete={deleteConversation}
              onTogglePin={togglePinConversation}
              onRename={renameConversation}
              onCloseMobile={onCloseMobile}
            />
          ))}
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2">
        {/* Quick Tools Bar (Voice Call, Workspace, Memory Hub, Backup & Settings) */}
        {!isCollapsedDesktop && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-xs">
              <button
                onClick={() => setIsVoiceCallOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Real-Time Conversational Voice Call Mode"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Voice Call</span>
              </button>
              <button
                onClick={() => setIsWorkspaceOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30 text-blue-300 text-[11px] font-medium transition-colors cursor-pointer"
                title="Interactive Multi-File Project Workspace"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Workspace</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-1 text-xs">
              <button
                onClick={() => setIsMemoryModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] text-[11px] font-medium transition-colors cursor-pointer"
                title="Personal Memory & Knowledge Hub"
              >
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span>Memory</span>
              </button>
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] text-[11px] font-medium transition-colors cursor-pointer"
                title="Backup / Restore chat archive"
              >
                <FileJson className="w-3.5 h-3.5 text-sky-500" />
                <span>Backup</span>
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] text-[11px] font-medium transition-colors cursor-pointer"
                title="AI Assistant Settings"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        )}

        {!isCollapsedDesktop && <ThemeToggle />}

        {/* User Status Bar with Clerk Profile & Logout */}
        <div
          className={cn(
            "flex items-center justify-between p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] shadow-xs transition-all",
            isCollapsedDesktop && "justify-center p-1.5 bg-transparent border-transparent"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2.5 min-w-0 flex-1",
              isCollapsedDesktop && "justify-center"
            )}
            title={userDisplayName + (userEmail ? ` (${userEmail})` : "")}
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt={userDisplayName}
                className="w-7 h-7 rounded-full object-cover border border-[var(--border)] flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700/20 border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] font-semibold flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}

            {!isCollapsedDesktop && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-[var(--foreground)] truncate text-xs leading-tight">
                  {isLoaded ? userDisplayName : "Loading..."}
                </span>
                {userEmail ? (
                  <span className="text-[10px] text-[var(--muted-foreground)] truncate leading-tight">
                    {userEmail}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 leading-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </span>
                )}
              </div>
            )}
          </div>

          {!isCollapsedDesktop && (
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex-shrink-0 ml-1"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Backup Modal */}
      <ExportBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Memory Hub Modal */}
      <MemoryHubModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />

      {/* Real-Time Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
      />

      {/* Project Workspace Modal */}
      <ProjectWorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        data={SAMPLE_PROJECT_WORKSPACE}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block h-full transition-all duration-300 ease-in-out flex-shrink-0",
          isCollapsedDesktop ? "w-16" : "w-64 lg:w-72"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
