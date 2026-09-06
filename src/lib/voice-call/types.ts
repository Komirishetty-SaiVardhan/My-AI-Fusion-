export type VoiceCallStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "ended";

export interface VoiceCallMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export interface VoiceCallConfig {
  voice?: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  autoListen: boolean;
}
