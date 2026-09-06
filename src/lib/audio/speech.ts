/**
 * Speech Recognition and Text-to-Speech (TTS) Engine for My AI
 * Developed by Komirishetty Sai Vardhan
 */

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface VoiceOption {
  name: string;
  lang: string;
  default: boolean;
}

/**
 * Checks if browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

/**
 * Checks if browser supports Speech Synthesis (TTS)
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Starts reliable Speech-to-Text dictation with auto-restart on Windows/Chrome/Edge
 */
export function startVoiceRecognition(options: {
  onResult: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  lang?: string;
}): { stop: () => void; abort: () => void } {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.("Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.");
    return { stop: () => {}, abort: () => {} };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;
  let isStoppedByUser = false;

  const initRecognition = () => {
    try {
      recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = options.lang || (typeof navigator !== "undefined" ? navigator.language : "en-US") || "en-US";

      recognition.onstart = () => {
        options.onStart?.();
      };

      recognition.onspeechstart = () => {
        options.onSpeechStart?.();
      };

      recognition.onspeechend = () => {
        options.onSpeechEnd?.();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (final) {
          options.onResult({ transcript: final, isFinal: true });
        } else if (interim) {
          options.onResult({ transcript: interim, isFinal: false });
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        const error = event.error;
        if (error === "no-speech") {
          // Normal silence, auto-recover
          return;
        }
        if (error === "not-allowed" || error === "service-not-allowed") {
          isStoppedByUser = true;
          options.onError?.("Microphone permission denied. Click the lock icon in your address bar to Allow microphone.");
          return;
        }
        if (error === "network") {
          options.onError?.("Network error: Chrome speech recognition requires an active internet connection.");
          return;
        }
        options.onError?.(error || "Speech recognition error");
      };

      recognition.onend = () => {
        if (!isStoppedByUser) {
          // Restart immediately to keep microphone open
          try {
            recognition.start();
          } catch {
            options.onEnd?.();
          }
        } else {
          options.onEnd?.();
        }
      };

      recognition.start();
    } catch (err: any) {
      if (err.name !== "InvalidStateError") {
        options.onError?.(err instanceof Error ? err.message : "Could not initialize microphone");
      }
    }
  };

  initRecognition();

  return {
    stop: () => {
      isStoppedByUser = true;
      try {
        if (recognition) recognition.stop();
      } catch {}
    },
    abort: () => {
      isStoppedByUser = true;
      try {
        if (recognition) recognition.abort();
      } catch {}
    },
  };
}

/**
 * Speaks text using high-clarity SpeechSynthesis
 */
export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: string) => void;
  }
): { cancel: () => void } {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.("Speech synthesis not supported");
    return { cancel: () => {} };
  }

  window.speechSynthesis.cancel(); // Stop previous speech

  // Strip markdown symbols for natural narration
  const cleanText = text
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, " Code block omitted. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " Image generated. ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options?.rate || 1.05;
  utterance.pitch = options?.pitch || 1.0;
  utterance.volume = options?.volume ?? 1.0;
  utterance.lang = options?.lang || "en-US";

  // Pick natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Neural") || v.name.includes("Jenny")))
  );
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) {
    utterance.onerror = (e) => options.onError?.(e.error);
  }

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => {
      window.speechSynthesis.cancel();
      options?.onEnd?.();
    },
  };
}

/**
 * Stops any active speech playback
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
