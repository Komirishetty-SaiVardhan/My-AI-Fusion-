export type FlashcardRating = "again" | "hard" | "good" | "easy";

export interface Flashcard {
  id: string;
  front: string; // Term / Question
  back: string; // Definition / Answer / Explanation
  hint?: string;
  tags?: string[];
  // SM-2 Spaced Repetition Metrics
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number; // Default 2.5
  lastReviewedAt?: number;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface StudyDeck {
  id: string;
  title: string;
  description?: string;
  category?: string;
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
}
