import { MeetingSummaryData } from "./types";

export const SAMPLE_MEETING_SUMMARY: MeetingSummaryData = {
  id: "meeting-q3-roadmap",
  title: "Q3 Product Architecture & AI Capabilities Sync",
  audioDuration: "28:45",
  executiveSummary:
    "The engineering leadership aligned on delivering 8 next-generation multimodal AI capabilities in Q3, migrating core hotspot computations to WebAssembly client-side execution, and enforcing zero-drift continuous benchmark evaluation.",
  keyTopics: [
    "Multimodal AI Feature Rollout & Milestones",
    "In-Browser WebAssembly Pyodide Sandbox Architecture",
    "Infinite Canvas & Visual Whiteboard Integration",
    "Audio Diarization & Transcription Pipeline",
  ],
  chapters: [
    {
      id: "ch-1",
      timestamp: "00:00",
      seconds: 0,
      title: "1. Kickoff & Milestone Review",
      summary: "Elena opened the sync reviewing Q2 deliverables, latency improvements, and user feedback.",
      speaker: "Elena Vance",
    },
    {
      id: "ch-2",
      timestamp: "06:15",
      seconds: 375,
      title: "2. In-Browser Python Sandbox Architecture",
      summary: "Marcus presented the WebAssembly Pyodide integration strategy to eliminate backend cloud compute costs for data analysis.",
      speaker: "Marcus Sterling",
    },
    {
      id: "ch-3",
      timestamp: "14:30",
      seconds: 870,
      title: "3. Infinite AI Canvas & SVG Graph Rendering",
      summary: "Kai demonstrated the 2D interactive canvas for system architecture and flowchart generation with real-time drag/zoom.",
      speaker: "Kai Chen",
    },
    {
      id: "ch-4",
      timestamp: "22:10",
      seconds: 1330,
      title: "4. Consensus & Next Steps",
      summary: "Team confirmed deployment deadlines and QA test verification pipelines.",
      speaker: "Athena Core",
    },
  ],
  decisions: [
    {
      id: "dec-1",
      topic: "Code Sandbox Execution Model",
      decision: "Adopt Pyodide WebAssembly in browser instead of serverless container sandboxes.",
      rationale: "Zero server cost, instant startup time (<50ms), and 100% data privacy for user datasets.",
    },
    {
      id: "dec-2",
      topic: "Audio File Ingestion",
      decision: "Support client-side audio preview with server-side AI diarization extraction.",
      rationale: "Enables instant chapter scrubbing while generating comprehensive structured minutes.",
    },
  ],
  actionItems: [
    {
      id: "act-1",
      task: "Finalize Pyodide Matplotlib vector SVG plot capture hook",
      assignee: "Marcus",
      dueDate: "Friday",
      priority: "high",
      completed: false,
    },
    {
      id: "act-2",
      task: "Implement interactive 3D card flip with SuperMemo SM-2 spaced repetition scoring",
      assignee: "Elena",
      dueDate: "Monday",
      priority: "medium",
      completed: true,
    },
    {
      id: "act-3",
      task: "Run comprehensive 76+ test suite verifying 100% pass rate",
      assignee: "Athena",
      dueDate: "Today",
      priority: "high",
      completed: true,
    },
  ],
};

/**
 * Parse markdown meeting summary blocks
 */
export function parseMeetingSummary(content: string, defaultTitle = "Audio Meeting & Lecture Summary"): MeetingSummaryData {
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.executiveSummary || Array.isArray(parsed.chapters)) {
        return {
          id: parsed.id || `meeting-${Date.now()}`,
          title: parsed.title || defaultTitle,
          audioDuration: parsed.audioDuration || "30:00",
          audioUrl: parsed.audioUrl,
          executiveSummary: String(parsed.executiveSummary || ""),
          keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
          chapters: (parsed.chapters || []).map((ch: any, i: number) => ({
            id: String(ch.id || `ch-${i}`),
            timestamp: String(ch.timestamp || "00:00"),
            seconds: typeof ch.seconds === "number" ? ch.seconds : i * 300,
            title: String(ch.title || `Chapter ${i + 1}`),
            summary: String(ch.summary || ""),
            speaker: ch.speaker ? String(ch.speaker) : undefined,
          })),
          decisions: (parsed.decisions || []).map((d: any, i: number) => ({
            id: String(d.id || `dec-${i}`),
            topic: String(d.topic || "Decision"),
            decision: String(d.decision || ""),
            rationale: d.rationale ? String(d.rationale) : undefined,
          })),
          actionItems: (parsed.actionItems || []).map((act: any, i: number) => ({
            id: String(act.id || `act-${i}`),
            task: String(act.task || act.item || "Action item"),
            assignee: act.assignee ? String(act.assignee) : undefined,
            dueDate: act.dueDate ? String(act.dueDate) : undefined,
            priority: act.priority || "medium",
            completed: Boolean(act.completed),
          })),
        };
      }
    }
  } catch {
    // Fallback on error
  }

  return {
    ...SAMPLE_MEETING_SUMMARY,
    title: defaultTitle,
  };
}
