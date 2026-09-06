"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  CanvasDiagram,
  CanvasNode,
  CanvasEdge,
  CanvasNodeType,
  CanvasNodeColor,
} from "@/lib/canvas/types";
import {
  parseCanvasDiagram,
  exportCanvasToSvg,
  SAMPLE_ARCHITECTURE_DIAGRAM,
} from "@/lib/canvas/engine";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Plus,
  Trash2,
  Move,
  Sparkles,
  Layers,
  Share2,
  Check,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InfiniteCanvasProps {
  rawContent?: string;
  initialTitle?: string;
  className?: string;
}

const COLOR_CLASSES: Record<CanvasNodeColor, { bg: string; border: string; text: string; glow: string }> = {
  sky: {
    bg: "bg-sky-500/10 dark:bg-sky-950/40",
    border: "border-sky-500/40 dark:border-sky-500/50",
    text: "text-sky-600 dark:text-sky-300",
    glow: "shadow-sky-500/10",
  },
  indigo: {
    bg: "bg-indigo-500/10 dark:bg-indigo-950/40",
    border: "border-indigo-500/40 dark:border-indigo-500/50",
    text: "text-indigo-600 dark:text-indigo-300",
    glow: "shadow-indigo-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
    border: "border-emerald-500/40 dark:border-emerald-500/50",
    text: "text-emerald-600 dark:text-emerald-300",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-950/40",
    border: "border-amber-500/40 dark:border-amber-500/50",
    text: "text-amber-600 dark:text-amber-300",
    glow: "shadow-amber-500/10",
  },
  rose: {
    bg: "bg-rose-500/10 dark:bg-rose-950/40",
    border: "border-rose-500/40 dark:border-rose-500/50",
    text: "text-rose-600 dark:text-rose-300",
    glow: "shadow-rose-500/10",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-950/40",
    border: "border-purple-500/40 dark:border-purple-500/50",
    text: "text-purple-600 dark:text-purple-300",
    glow: "shadow-purple-500/10",
  },
  slate: {
    bg: "bg-slate-500/10 dark:bg-slate-800/40",
    border: "border-slate-400 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    glow: "shadow-slate-500/10",
  },
};

function InfiniteCanvasComponent({
  rawContent,
  initialTitle = "Interactive AI Canvas",
  className,
}: InfiniteCanvasProps) {
  const [diagram, setDiagram] = useState<CanvasDiagram>(() =>
    rawContent ? parseCanvasDiagram(rawContent, initialTitle) : SAMPLE_ARCHITECTURE_DIAGRAM
  );

  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync when rawContent updates
  useEffect(() => {
    if (rawContent) {
      setDiagram(parseCanvasDiagram(rawContent, initialTitle));
    }
  }, [rawContent, initialTitle]);

  // Handle canvas pan start
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== "svg") return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Handle dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (draggingNodeId) {
        setDiagram((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => {
            if (n.id === draggingNodeId) {
              const newX = Math.round((e.clientX - pan.x - nodeOffset.x) / zoom);
              const newY = Math.round((e.clientY - pan.y - nodeOffset.y) / zoom);
              return { ...n, x: Math.max(0, newX), y: Math.max(0, newY) };
            }
            return n;
          }),
        }));
      }
    },
    [isPanning, draggingNodeId, dragStart, pan, nodeOffset, zoom]
  );

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Handle node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setNodeOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Add a new node to the canvas
  const handleAddNode = (type: CanvasNodeType = "process", color: CanvasNodeColor = "sky") => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: "Click to edit node description",
      x: Math.round((-pan.x + 200) / zoom),
      y: Math.round((-pan.y + 150) / zoom),
      color,
      shape: type === "database" ? "cylinder" : type === "cloud" ? "cloud" : "rounded",
    };
    setDiagram((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setSelectedNodeId(newNode.id);
  };

  // Delete selected node
  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setDiagram((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== selectedNodeId),
      edges: prev.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
    }));
    setSelectedNodeId(null);
  };

  // Export vector SVG
  const handleExportSvg = () => {
    const svgStr = exportCanvasToSvg(diagram);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    const safeTitle = (diagram.title || "ai_canvas").toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.download = `${safeTitle}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Copy diagram JSON
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagram, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-slate-950 text-slate-100 shadow-xl overflow-hidden flex flex-col [contain:content]",
        isFullscreen ? "fixed inset-3 z-50 max-h-[calc(100vh-1.5rem)]" : "h-[500px]",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs select-none z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-white block truncate">
              {diagram.title}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Infinite Visual Canvas • {diagram.nodes.length} Nodes • {diagram.edges.length} Edges
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Add Node Menu */}
          <button
            onClick={() => handleAddNode("process", "sky")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
            title="Add new process node"
          >
            <Plus className="w-3 h-3" />
            <span>Add Node</span>
          </button>

          <button
            onClick={() => handleAddNode("database", "rose")}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
            title="Add database node"
          >
            <Plus className="w-3 h-3 text-rose-400" />
            <span>Database</span>
          </button>

          <button
            onClick={() => handleAddNode("cloud", "indigo")}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
            title="Add cloud service node"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>Cloud</span>
          </button>

          {selectedNodeId && (
            <button
              onClick={handleDeleteSelected}
              className="p-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors cursor-pointer"
              title="Delete selected node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

          {/* Export SVG */}
          <button
            onClick={handleExportSvg}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
            title="Export vector SVG diagram"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">SVG</span>
          </button>

          {/* Copy JSON */}
          <button
            onClick={handleCopyJson}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Copy diagram JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Canvas"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Viewport Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#080d1a]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(56, 189, 248, 0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transformable Canvas Layer */}
        <div
          className="absolute origin-top-left transition-transform duration-75 select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG Connecting Edges Layer */}
          <svg className="absolute inset-0 pointer-events-none overflow-visible w-[4000px] h-[4000px]">
            {diagram.edges.map((edge) => {
              const src = diagram.nodes.find((n) => n.id === edge.source);
              const tgt = diagram.nodes.find((n) => n.id === edge.target);
              if (!src || !tgt) return null;

              const srcW = src.width || 180;
              const srcH = src.height || 84;
              const tgtW = tgt.width || 180;
              const tgtH = tgt.height || 84;

              const x1 = src.x + srcW / 2;
              const y1 = src.y + srcH / 2;
              const x2 = tgt.x + tgtW / 2;
              const y2 = tgt.y + tgtH / 2;

              const dx = x2 - x1;
              const dy = y2 - y1;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              // Cubic bezier curved connection line
              const pathData = `M ${x1} ${y1} C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;

              return (
                <g key={edge.id} className="transition-all">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={edge.color || "#38bdf8"}
                    strokeWidth="2"
                    strokeDasharray={edge.animated ? "6,6" : edge.style === "dashed" ? "6,6" : "none"}
                    className={cn(edge.animated && "animate-pulse")}
                  />
                  <circle cx={x2} cy={y2} r="4" fill={edge.color || "#38bdf8"} />
                  {edge.label && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                        stroke="#334155"
                      />
                      <text
                        x="0"
                        y="4"
                        fontSize="10"
                        fill="#94a3b8"
                        textAnchor="middle"
                        className="font-mono font-medium"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes Layer */}
          {diagram.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const colorClass = COLOR_CLASSES[node.color || "sky"];
            const w = node.width || 190;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                className={cn(
                  "absolute p-3 rounded-2xl border backdrop-blur-md shadow-lg cursor-grab active:cursor-grabbing transition-all select-none",
                  colorClass.bg,
                  colorClass.border,
                  isSelected
                    ? "ring-2 ring-sky-400 shadow-2xl scale-[1.02]"
                    : "hover:scale-[1.01] hover:shadow-xl"
                )}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: `${w}px`,
                }}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs text-white truncate block">
                    {node.label}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold",
                      colorClass.text,
                      "bg-white/5"
                    )}
                  >
                    {node.type}
                  </span>
                </div>

                {node.description && (
                  <p className="text-[10px] text-slate-300/80 leading-snug line-clamp-2 mt-0.5">
                    {node.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Canvas Floating Zoom Controls */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-lg z-20 text-xs">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] px-1 font-mono text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(0.85);
              setPan({ x: 20, y: 20 });
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
            title="Reset View"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Selected Node Inspector Drawer if selected */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-2xl z-20 text-xs animate-in fade-in duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
              <span className="font-semibold text-white">Node Properties</span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiagram((prev) => ({
                      ...prev,
                      nodes: prev.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, label: val } : n
                      ),
                    }));
                  }}
                  className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={selectedNode.description || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiagram((prev) => ({
                      ...prev,
                      nodes: prev.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, description: val } : n
                      ),
                    }));
                  }}
                  className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">
                  Color Theme
                </label>
                <div className="flex gap-1.5">
                  {(["sky", "indigo", "emerald", "amber", "rose", "purple"] as CanvasNodeColor[]).map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setDiagram((prev) => ({
                            ...prev,
                            nodes: prev.nodes.map((n) =>
                              n.id === selectedNode.id ? { ...n, color: c } : n
                            ),
                          }));
                        }}
                        className={cn(
                          "w-5 h-5 rounded-full border transition-transform",
                          c === "sky" && "bg-sky-500",
                          c === "indigo" && "bg-indigo-500",
                          c === "emerald" && "bg-emerald-500",
                          c === "amber" && "bg-amber-500",
                          c === "rose" && "bg-rose-500",
                          c === "purple" && "bg-purple-500",
                          selectedNode.color === c ? "scale-125 border-white" : "border-transparent"
                        )}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const InfiniteCanvas = memo(InfiniteCanvasComponent);
