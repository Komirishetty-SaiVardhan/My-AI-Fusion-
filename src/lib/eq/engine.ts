import { EmotionalProfile, SentimentType } from "./types";

export const SENTIMENT_PROFILES: Record<SentimentType, EmotionalProfile> = {
  urgent: {
    sentiment: "urgent",
    label: "High Priority & Urgent",
    emoji: "⚡",
    toneAdvice: "Direct, concise, zero-fluff, immediate actionable solution.",
    badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  },
  frustrated: {
    sentiment: "frustrated",
    label: "Troubleshooting & Empathetic",
    emoji: "🛡️",
    toneAdvice: "Calm, structured, validating, step-by-step root-cause diagnostics.",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  curious: {
    sentiment: "curious",
    label: "Exploratory & Creative",
    emoji: "💡",
    toneAdvice: "Vibrant, imaginative, inspiring, exploring multiple novel angles.",
    badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  },
  celebratory: {
    sentiment: "celebratory",
    label: "Milestone & High Energy",
    emoji: "🎉",
    toneAdvice: "Warm, enthusiastic, validating success, encouraging forward momentum.",
    badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  },
  analytical: {
    sentiment: "analytical",
    label: "Deep Technical Analysis",
    emoji: "🎯",
    toneAdvice: "Rigorous, data-backed, trade-off oriented, architectural precision.",
    badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  },
  supportive: {
    sentiment: "supportive",
    label: "Thoughtful Co-Pilot",
    emoji: "🤝",
    toneAdvice: "Attentive, proactive, collaborative, supportive partnership.",
    badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },
  neutral: {
    sentiment: "neutral",
    label: "Balanced Assistant",
    emoji: "✨",
    toneAdvice: "Clear, helpful, articulate, professional.",
    badgeColor: "bg-zinc-800/60 text-zinc-300 border-zinc-700/60",
  },
};

export function analyzeMessageSentiment(text: string): EmotionalProfile {
  const lower = text.toLowerCase();

  // Urgent
  if (
    lower.includes("urgent") ||
    lower.includes("asap") ||
    lower.includes("emergency") ||
    lower.includes("down in prod") ||
    lower.includes("outage") ||
    lower.includes("critical bug")
  ) {
    return SENTIMENT_PROFILES.urgent;
  }

  // Frustrated / Debugging
  if (
    lower.includes("not working") ||
    lower.includes("error") ||
    lower.includes("broken") ||
    lower.includes("failed") ||
    lower.includes("crash") ||
    lower.includes("stuck") ||
    lower.includes("help me fix") ||
    lower.includes("why is it failing")
  ) {
    return SENTIMENT_PROFILES.frustrated;
  }

  // Celebratory
  if (
    lower.includes("awesome") ||
    lower.includes("congrats") ||
    lower.includes("great job") ||
    lower.includes("it worked") ||
    lower.includes("fixed it") ||
    lower.includes("perfect") ||
    lower.includes("thank you so much")
  ) {
    return SENTIMENT_PROFILES.celebratory;
  }

  // Curious / Brainstorming
  if (
    lower.includes("what if") ||
    lower.includes("brainstorm") ||
    lower.includes("idea") ||
    lower.includes("suggest some") ||
    lower.includes("imagine") ||
    lower.includes("concept")
  ) {
    return SENTIMENT_PROFILES.curious;
  }

  // Deep Analytical
  if (
    lower.includes("architecture") ||
    lower.includes("trade-off") ||
    lower.includes("benchmark") ||
    lower.includes("complexity") ||
    lower.includes("algorithm") ||
    lower.includes("compare") ||
    lower.includes("evaluate")
  ) {
    return SENTIMENT_PROFILES.analytical;
  }

  return SENTIMENT_PROFILES.supportive;
}
