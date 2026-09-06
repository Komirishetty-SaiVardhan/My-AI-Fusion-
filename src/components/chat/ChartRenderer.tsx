"use client";

import React, { useState, memo } from "react";
import { BarChart3, Download, PieChart, LineChart, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

export interface ChartConfig {
  type?: "bar" | "line" | "pie" | "area";
  title?: string;
  description?: string;
  data: ChartDataItem[];
}

interface ChartRendererProps {
  chartData: ChartConfig;
}

const DEFAULT_COLORS = [
  "#0ea5e9", // Sky
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

function ChartRendererComponent({ chartData }: ChartRendererProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "area">(
    chartData.type || "bar"
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = chartData.data || [];
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

  const handleExportSvg = () => {
    const svgEl = document.getElementById(`chart-svg-${chartData.title || "chart"}`);
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(chartData.title || "chart").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="my-4 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--border)]">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-[var(--foreground)]">
            {chartData.title || "Data Visualization"}
          </h4>
          {chartData.description && (
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              {chartData.description}
            </p>
          )}
        </div>

        {/* View Switchers & Export */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 text-xs">
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                chartType === "bar" ? "bg-[var(--card)] text-sky-500 shadow-xs" : "text-[var(--muted-foreground)]"
              )}
              title="Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                chartType === "line" ? "bg-[var(--card)] text-sky-500 shadow-xs" : "text-[var(--muted-foreground)]"
              )}
              title="Line Chart"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                chartType === "pie" ? "bg-[var(--card)] text-sky-500 shadow-xs" : "text-[var(--muted-foreground)]"
              )}
              title="Pie Chart"
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportSvg}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Download SVG Chart"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg
          id={`chart-svg-${chartData.title || "chart"}`}
          className="w-full h-full"
          viewBox="0 0 500 240"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* BAR CHART */}
          {chartType === "bar" && (
            <g>
              {data.map((item, idx) => {
                const barWidth = 400 / data.length - 12;
                const barHeight = (item.value / maxValue) * 160;
                const x = 50 + idx * (400 / data.length) + 6;
                const y = 200 - barHeight;
                const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(barWidth, 8)}
                      height={Math.max(barHeight, 2)}
                      rx="4"
                      fill={color}
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-all duration-200"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 6}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-[var(--foreground)] font-semibold"
                      fontSize="10"
                    >
                      {item.value}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={218}
                      textAnchor="middle"
                      className="text-[10px] fill-[var(--muted-foreground)] truncate"
                      fontSize="9.5"
                    >
                      {item.label.length > 8 ? item.label.slice(0, 7) + ".." : item.label}
                    </text>
                  </g>
                );
              })}
              {/* Baseline */}
              <line x1="40" y1="200" x2="470" y2="200" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
            </g>
          )}

          {/* LINE CHART */}
          {chartType === "line" && (
            <g>
              {/* Grid lines */}
              <line x1="50" y1="40" x2="450" y2="40" stroke="currentColor" strokeOpacity="0.08" />
              <line x1="50" y1="120" x2="450" y2="120" stroke="currentColor" strokeOpacity="0.08" />
              <line x1="50" y1="200" x2="450" y2="200" stroke="currentColor" strokeOpacity="0.15" />

              {/* Connected Line Path */}
              {(() => {
                const points = data.map((item, idx) => {
                  const x = 70 + idx * (360 / Math.max(data.length - 1, 1));
                  const y = 200 - (item.value / maxValue) * 150;
                  return `${x},${y}`;
                });
                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points.join(" ")}
                    />
                    {data.map((item, idx) => {
                      const x = 70 + idx * (360 / Math.max(data.length - 1, 1));
                      const y = 200 - (item.value / maxValue) * 150;
                      const isHovered = hoveredIndex === idx;

                      return (
                        <g
                          key={idx}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? "6" : "4"}
                            fill="#0ea5e9"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                          <text
                            x={x}
                            y={y - 8}
                            textAnchor="middle"
                            fontSize="10"
                            className="font-mono font-semibold fill-[var(--foreground)]"
                          >
                            {item.value}
                          </text>
                          <text
                            x={x}
                            y={218}
                            textAnchor="middle"
                            fontSize="9.5"
                            className="fill-[var(--muted-foreground)]"
                          >
                            {item.label}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </g>
          )}

          {/* PIE CHART */}
          {chartType === "pie" && (
            <g transform="translate(250, 110)">
              {(() => {
                let cumulativeAngle = 0;
                return data.map((item, idx) => {
                  const sliceAngle = (item.value / totalValue) * 360;
                  const startAngle = cumulativeAngle;
                  const endAngle = cumulativeAngle + sliceAngle;
                  cumulativeAngle += sliceAngle;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);
                  const radius = 80;
                  const x1 = radius * Math.cos(startRad);
                  const y1 = radius * Math.sin(startRad);
                  const x2 = radius * Math.cos(endRad);
                  const y2 = radius * Math.sin(endRad);
                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                  const isHovered = hoveredIndex === idx;

                  return (
                    <path
                      key={idx}
                      d={pathData}
                      fill={color}
                      stroke="var(--card)"
                      strokeWidth="2"
                      opacity={isHovered ? 1 : 0.88}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer transition-transform duration-200"
                      transform={isHovered ? "scale(1.05)" : "scale(1)"}
                    />
                  );
                });
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3 mt-1 border-t border-[var(--border)] text-xs">
        {data.map((item, idx) => {
          const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
          const pct = ((item.value / totalValue) * 100).toFixed(1);

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-md cursor-pointer transition-colors",
                hoveredIndex === idx ? "bg-[var(--muted)] font-semibold" : "text-[var(--muted-foreground)]"
              )}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-[var(--foreground)]">{item.label}</span>
              <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                ({item.value} &bull; {pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartRenderer = memo(ChartRendererComponent);

/**
 * Helper to test if a markdown code block contains chart JSON
 */
export function parseChartCodeBlock(code: string): ChartConfig | null {
  try {
    const trimmed = code.trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
    const parsed = JSON.parse(trimmed);
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0 && typeof parsed.data[0].value === "number") {
      return parsed as ChartConfig;
    }
    return null;
  } catch {
    return null;
  }
}

