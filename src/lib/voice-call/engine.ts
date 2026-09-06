import { VoiceCallConfig } from "./types";

export class VoiceCallEngine {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onStatusChangeCallback: ((status: string) => void) | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentBufferedTranscript = "";

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusChangeCallback?.("listening");
      };

      this.recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript + " ";
          } else {
            interim += item[0].transcript;
          }
        }

        const combined = (final + " " + interim).trim();

        // Barge-in: If user speaks while AI is speaking, interrupt AI
        if (this.isSpeaking && combined.length > 3) {
          this.interrupt();
        }

        if (combined) {
          this.currentBufferedTranscript = combined;
          this.onTranscriptCallback?.(combined, false);

          // Reset silence timer on every new word detected
          if (this.silenceTimer) clearTimeout(this.silenceTimer);

          // 1200ms of silence triggers automatic end-of-turn
          this.silenceTimer = setTimeout(() => {
            this.commitTranscript();
          }, 1200);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition notice:", event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // If buffered text remains when recognition ends, commit it
        if (this.currentBufferedTranscript.trim() && !this.isSpeaking) {
          this.commitTranscript();
        }
      };
    }
  }

  commitTranscript() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const textToCommit = this.currentBufferedTranscript.trim();
    this.currentBufferedTranscript = "";

    if (textToCommit && !this.isSpeaking) {
      this.stopListening();
      this.onTranscriptCallback?.(textToCommit, true);
    }
  }

  startListening(
    onTranscript: (text: string, isFinal: boolean) => void,
    onStatusChange: (status: string) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onStatusChangeCallback = onStatusChange;
    this.currentBufferedTranscript = "";

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.recognition) {
      try {
        if (!this.isListening) {
          this.recognition.start();
        }
      } catch {
        // Recognition might already be active or restarting
      }
    }
  }

  stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  speak(text: string, config?: Partial<VoiceCallConfig>): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      this.isSpeaking = true;
      this.onStatusChangeCallback?.("speaking");

      const cleanText = text
        .replace(/```[\s\S]*?```/g, "Code omitted.")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[#*_~`]/g, "")
        .replace(/\n+/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = config?.rate || 1.05;
      utterance.pitch = config?.pitch || 1.0;
      utterance.volume = config?.volume || 1.0;

      // Select high quality voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Jenny") ||
            v.name.includes("Aria") ||
            v.name.includes("Guy") ||
            v.name.includes("Samantha"))
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  interrupt() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.onStatusChangeCallback?.("interrupted");
  }

  destroy() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.stopListening();
    this.interrupt();
    this.onTranscriptCallback = null;
    this.onStatusChangeCallback = null;
  }
}
