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
 * Starts continuous Speech-to-Text dictation
 */
export function startVoiceRecognition(options: {
  onResult: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string;
}): { stop: () => void } {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.("Speech recognition is not supported in this browser.");
    return { stop: () => {} };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new SpeechRecognitionClass() as any;

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang || "en-US";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
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
    options.onError?.(event.error || "Speech recognition error");
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    options.onError?.(err instanceof Error ? err.message : "Could not start microphone");
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Ignored
      }
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
  utterance.rate = options?.rate || 1.0;
  utterance.pitch = options?.pitch || 1.0;
  utterance.volume = options?.volume ?? 1.0;
  utterance.lang = options?.lang || "en-US";

  // Pick natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) => (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Neural")))
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
