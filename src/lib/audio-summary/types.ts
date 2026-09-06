export interface AudioChapter {
  id: string;
  timestamp: string; // e.g., "02:15"
  seconds: number;
  title: string;
  summary: string;
  speaker?: string;
}

export interface MeetingActionItem {
  id: string;
  task: string;
  assignee?: string;
  dueDate?: string;
  priority?: "high" | "medium" | "low";
  completed?: boolean;
}

export interface MeetingDecision {
  id: string;
  topic: string;
  decision: string;
  rationale?: string;
}

export interface MeetingSummaryData {
  id: string;
  title: string;
  audioDuration: string; // e.g. "45:20"
  audioUrl?: string;
  executiveSummary: string;
  keyTopics: string[];
  chapters: AudioChapter[];
  decisions: MeetingDecision[];
  actionItems: MeetingActionItem[];
}
