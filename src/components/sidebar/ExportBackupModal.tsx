"use client";

import React, { useState, useRef } from "react";
import { Download, Upload, X, Check, FileJson, AlertCircle } from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface ExportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportBackupModal({ isOpen, onClose }: ExportBackupModalProps) {
  const { conversations, exportAllConversations, importConversations } = useChat();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = exportAllConversations();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const success = importConversations(parsed);
        if (success) {
          setIsSuccess(true);
          setImportStatus(`Successfully restored ${parsed.conversations?.length || 0} conversations!`);
          setTimeout(() => {
            onClose();
            setIsSuccess(false);
            setImportStatus(null);
          }, 1500);
        } else {
          setImportStatus("Invalid backup file structure.");
        }
      } catch (err) {
        setImportStatus("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] p-5 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Backup & Restore Chats</h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">Export or restore your conversation archive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {/* Export Section */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold">Export Archive (JSON)</h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                {conversations.length} conversation{conversations.length === 1 ? "" : "s"} ready to export
              </p>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import Section */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold">Restore From Backup</h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">Upload a previously saved JSON file</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--card)] text-xs font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          {/* Status Message */}
          {importStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                isSuccess
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {isSuccess ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
