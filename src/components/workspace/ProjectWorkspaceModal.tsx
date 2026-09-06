"use client";

import React, { useState } from "react";
import {
  Code,
  Download,
  Eye,
  FileCode,
  Folder,
  Layers,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Copy,
  Check,
  Smartphone,
  Monitor,
} from "lucide-react";
import { ProjectWorkspaceData, WorkspaceFile } from "@/lib/workspace/types";
import {
  buildWorkspaceBundleSrcDoc,
  parseWorkspaceMarkdown,
} from "@/lib/workspace/engine";

interface ProjectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: ProjectWorkspaceData;
  rawMarkdown?: string;
}

export const ProjectWorkspaceModal: React.FC<ProjectWorkspaceModalProps> = ({
  isOpen,
  onClose,
  data,
  rawMarkdown,
}) => {
  const initialWorkspace =
    data || (rawMarkdown ? parseWorkspaceMarkdown(rawMarkdown) : null);

  const [workspace, setWorkspace] = useState<ProjectWorkspaceData | null>(initialWorkspace);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "split">("split");
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  if (!isOpen || !workspace) return null;

  const currentFile = workspace.files[activeFileIndex] || workspace.files[0];

  const handleCodeChange = (newContent: string) => {
    const updatedFiles = [...workspace.files];
    updatedFiles[activeFileIndex] = {
      ...currentFile,
      content: newContent,
    };
    setWorkspace({
      ...workspace,
      files: updatedFiles,
    });
  };

  const handleCopyCurrentFile = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workspace, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${workspace.title.toLowerCase().replace(/\s+/g, "-")}-project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const srcDoc = buildWorkspaceBundleSrcDoc(workspace);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl h-[88vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white font-sans">
        {/* Top Navigation Bar */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-100">{workspace.title}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Interactive Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-md truncate">{workspace.description}</p>
            </div>
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "code"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Code className="w-3.5 h-3.5 inline mr-1" />
                Code Only
              </button>
              <button
                onClick={() => setActiveTab("split")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "split"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "preview"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                Preview Only
              </button>
            </div>

            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
              title="Download project bundle"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Project</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left File Explorer Tree */}
          <div className="w-56 bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0">
            <div className="p-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              Files ({workspace.files.length})
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1">
              {workspace.files.map((file, idx) => (
                <button
                  key={file.path}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition text-left ${
                    activeFileIndex === idx
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Center Code Editor Area */}
          {(activeTab === "code" || activeTab === "split") && (
            <div className={`flex flex-col bg-zinc-950 border-r border-zinc-800/80 overflow-hidden ${
              activeTab === "split" ? "w-1/2" : "flex-1"
            }`}>
              {/* File Tab Bar */}
              <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  {currentFile.name}
                </span>
                <button
                  onClick={handleCopyCurrentFile}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition px-2 py-1 rounded-lg hover:bg-zinc-800"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Textarea Editor */}
              <div className="flex-1 p-4 overflow-auto font-mono text-xs text-zinc-300 bg-zinc-950">
                <textarea
                  value={currentFile.content}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-full bg-transparent resize-none outline-none font-mono text-xs leading-relaxed text-zinc-200 selection:bg-blue-500/30"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Right Live Runner / Preview Area */}
          {(activeTab === "preview" || activeTab === "split") && (
            <div className={`flex flex-col bg-zinc-900/30 overflow-hidden ${
              activeTab === "split" ? "w-1/2" : "flex-1"
            }`}>
              {/* Preview Bar */}
              <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-300">Live Preview</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewportMode(viewportMode === "desktop" ? "mobile" : "desktop")}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                    title="Toggle mobile/desktop preview"
                  >
                    {viewportMode === "desktop" ? (
                      <Smartphone className="w-3.5 h-3.5" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewKey((prev) => prev + 1)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                    title="Reload sandbox preview"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Live iframe */}
              <div className="flex-1 flex items-center justify-center p-4 bg-zinc-950/80 overflow-auto">
                <div
                  className={`h-full transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950 ${
                    viewportMode === "mobile" ? "w-[375px] max-h-[667px]" : "w-full"
                  }`}
                >
                  <iframe
                    key={previewKey}
                    srcDoc={srcDoc}
                    title="Live Project Sandbox"
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
