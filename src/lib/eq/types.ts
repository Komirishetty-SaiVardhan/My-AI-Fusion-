export type SentimentType =
  | "curious"
  | "urgent"
  | "frustrated"
  | "celebratory"
  | "analytical"
  | "supportive"
  | "neutral";

export interface EmotionalProfile {
  sentiment: SentimentType;
  label: string;
  emoji: string;
  toneAdvice: string;
  badgeColor: string;
}
