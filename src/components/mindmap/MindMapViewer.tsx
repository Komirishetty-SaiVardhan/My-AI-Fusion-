"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Sparkles,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/context/ChatContext";

interface MindMapNode {
  id: string;
  label: string;
  level: number;
  children: MindMapNode[];
  color?: string;
}

interface MindMapViewerProps {
  rawContent: string;
  initialTitle?: string;
  className?: string;
}

const BRANCH_COLORS = [
  "#0284c7", // Sky blue
  "#8b5cf6", // Violet
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

export function parseMindMap(rawContent: string): MindMapNode {
  const lines = rawContent.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { id: "root", label: "Mind Map", level: 0, children: [] };
  }

  const root: MindMapNode = {
    id: "root-0",
    label: lines[0].replace(/^[#\-*]\s*/, "").trim(),
    level: 0,
    children: [],
  };

  const stack: { node: MindMapNode; indent: number }[] = [{ node: root, indent: -1 }];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const indent = rawLine.search(/\S/);
    const label = rawLine.replace(/^[\s#\-*>\d.]+\s*/, "").trim();
    if (!label) continue;

    const newNode: MindMapNode = {
      id: `node-${i}`,
      label,
      level: 1,
      children: [],
    };

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].node;
    newNode.level = parent.level + 1;
    if (newNode.level === 1) {
      newNode.color = BRANCH_COLORS[parent.children.length % BRANCH_COLORS.length];
    } else {
      newNode.color = parent.color;
    }

    parent.children.push(newNode);
    stack.push({ node: newNode, indent });
  }

  return root;
}

export function MindMapViewer({
  rawContent,
  initialTitle,
  className,
}: MindMapViewerProps) {
  const { sendMessage } = useChat();
  const [zoom, setZoom] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rootNode = useMemo(() => parseMindMap(rawContent), [rawContent]);

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleAskAboutNode = (nodeText: string) => {
    sendMessage(`Tell me more about "${nodeText}" and explain how it connects to the overall topic in detail.`);
  };

  const handleDownloadSvg = () => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mindmap_${(initialTitle || "ai_map").toLowerCase().replace(/[^a-z0-9]/g, "_")}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden transition-all text-[var(--foreground)]",
        isFullscreen && "fixed inset-4 z-50 overflow-auto",
        className
      )}
    >
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--muted)]/40 border-b border-[var(--border)] text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[var(--foreground)] block truncate text-xs">
              {initialTitle || rootNode.label || "Interactive AI Mind Map"}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Interactive Idea Tree • Click node to deep dive
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[var(--muted)] px-1.5 py-0.5 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:text-sky-500 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1 hover:text-sky-500 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:text-sky-500 cursor-pointer border-l border-[var(--border)] ml-1 pl-1.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleDownloadSvg}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
            title="Download as Vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Tree Area */}
      <div className="p-6 sm:p-10 overflow-x-auto bg-slate-900/5 dark:bg-black/30 flex justify-center items-center min-h-[300px]">
        <div
          className="transition-transform duration-150 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <RenderNodeTree
            node={rootNode}
            collapsedNodes={collapsedNodes}
            onToggleCollapse={toggleCollapse}
            onSelectNode={handleAskAboutNode}
          />
        </div>
      </div>
    </div>
  );
}

function RenderNodeTree({
  node,
  collapsedNodes,
  onToggleCollapse,
  onSelectNode,
}: {
  node: MindMapNode;
  collapsedNodes: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onSelectNode: (text: string) => void;
}) {
  const isCollapsed = collapsedNodes[node.id];
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = node.level === 0;

  return (
    <div className="flex items-center gap-6 my-2">
      {/* Node Pill */}
      <div
        className={cn(
          "group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl shadow-md border transition-all select-none cursor-pointer",
          isRoot
            ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-sky-500/20 border-sky-400/30"
            : "bg-[var(--card)] hover:border-sky-500/50 text-[var(--foreground)] text-xs font-medium border-[var(--border)]"
        )}
      >
        <span
          onClick={() => onSelectNode(node.label)}
          className="truncate max-w-[200px]"
          title={`Click to ask AI about "${node.label}"`}
        >
          {node.label}
        </span>

        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(node.id);
            }}
            className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Children Branches */}
      {hasChildren && !isCollapsed && (
        <div className="relative flex flex-col gap-3 pl-4 border-l-2 border-dashed border-sky-500/30">
          {node.children.map((child) => (
            <RenderNodeTree
              key={child.id}
              node={child}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={onToggleCollapse}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
