"use client";

import React, { useState } from "react";
import {
  FileText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Table as TableIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  InspectedDocumentData,
  DocumentAnnotation,
} from "@/lib/document-inspector/types";
import { parseDocumentInspectMarkdown } from "@/lib/document-inspector/engine";

interface DocumentInspectorViewerProps {
  data?: InspectedDocumentData;
  rawMarkdown?: string;
}

export const DocumentInspectorViewer: React.FC<DocumentInspectorViewerProps> = ({
  data,
  rawMarkdown,
}) => {
  const doc =
    data || (rawMarkdown ? parseDocumentInspectMarkdown(rawMarkdown) : null);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    doc?.sections[0]?.id || "sec-1"
  );
  const [activeTab, setActiveTab] = useState<"sections" | "tables">("sections");

  if (!doc) return null;

  const currentSection =
    doc.sections.find((s) => s.id === activeSectionId) || doc.sections[0];

  const getAnnotationIcon = (type: DocumentAnnotation["type"]) => {
    switch (type) {
      case "risk":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case "important":
        return <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />;
      case "insight":
        return <Lightbulb className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="my-4 rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden font-sans text-white">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Document Inspector & Analysis
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {doc.docType.toUpperCase()} • {doc.pageCount} Pages
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">{doc.title}</h3>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab("sections")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "sections"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline mr-1" />
            Sections & Annotations
          </button>
          {doc.extractedTables && doc.extractedTables.length > 0 && (
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === "tables"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 inline mr-1" />
              Extracted Tables ({doc.extractedTables.length})
            </button>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="px-4 py-3 bg-zinc-900/40 border-b border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200">Executive Summary: </span>
          <span>{doc.executiveSummary}</span>
        </div>
      </div>

      {/* Body */}
      {activeTab === "sections" ? (
        <div className="flex flex-col md:flex-row min-h-[320px]">
          {/* Section Navigation List */}
          <div className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800/80 p-2 space-y-1.5 shrink-0">
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Document Breakdown
            </div>
            {doc.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center justify-between ${
                  activeSectionId === section.id
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="truncate">
                  <div className="text-[10px] text-zinc-500 font-mono">Page {section.pageNumber}</div>
                  <div className="truncate">{section.title}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1 text-zinc-500" />
              </button>
            ))}
          </div>

          {/* Section Details & Annotations */}
          {currentSection && (
            <div className="flex-1 p-4 bg-zinc-950/60 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-100">{currentSection.title}</h4>
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                    Page {currentSection.pageNumber}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  {currentSection.content}
                </p>

                {/* Key Takeaways */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Key Highlights & Clauses
                  </span>
                  <div className="space-y-1">
                    {currentSection.keyTakeaways.map((takeaway, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margin Annotations & AI Commentary */}
              {currentSection.annotations && currentSection.annotations.length > 0 && (
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    AI Margin Notes & Clause Analysis
                  </span>
                  <div className="space-y-2">
                    {currentSection.annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-1.5 font-medium text-amber-300">
                          {getAnnotationIcon(ann.type)}
                          <span className="italic font-mono text-[11px]">"{ann.quote}"</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] pl-5">{ann.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Extracted Data Tables */
        <div className="p-4 space-y-4">
          {doc.extractedTables?.map((tbl) => (
            <div
              key={tbl.id}
              className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/60"
            >
              <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-blue-400" />
                {tbl.title}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      {tbl.headers.map((h, i) => (
                        <th key={i} className="p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {tbl.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-800/30 transition">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 text-zinc-300 font-mono">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
