import { Flashcard, FlashcardRating, QuizQuestion, StudyDeck } from "./types";

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 */
export function calculateSm2Metrics(
  card: Flashcard,
  rating: FlashcardRating
): { intervalDays: number; repetitionCount: number; easeFactor: number } {
  let { intervalDays, repetitionCount, easeFactor } = card;

  const scoreMap: Record<FlashcardRating, number> = {
    again: 1,
    hard: 2,
    good: 3,
    easy: 5,
  };
  const q = scoreMap[rating];

  if (q < 3) {
    repetitionCount = 0;
    intervalDays = 1;
  } else {
    if (repetitionCount === 0) {
      intervalDays = 1;
    } else if (repetitionCount === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitionCount++;
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { intervalDays, repetitionCount, easeFactor };
}

export const SAMPLE_STUDY_DECK: StudyDeck = {
  id: "deck-ai-systems",
  title: "Modern AI & Distributed Systems Mastery",
  description: "Core concepts in LLM architecture, vector search, caching, and distributed consistency",
  category: "Computer Science",
  flashcards: [
    {
      id: "card-1",
      front: "What is the primary difference between RAG (Retrieval-Augmented Generation) and Fine-Tuning?",
      back: "RAG retrieves external factual knowledge at query-time without modifying model weights, whereas Fine-Tuning updates model weights to adapt tone, format, or domain-specific style.",
      hint: "Think about weight updates vs dynamic prompt augmentation.",
      intervalDays: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
    },
    {
      id: "card-2",
      front: "What is the CAP Theorem and what does it prove?",
      back: "In a distributed data store, you can only guarantee at most 2 out of 3 properties simultaneously: Consistency (all nodes see the same data at once), Availability (every request receives a non-error response), and Partition Tolerance (system continues to operate despite network drops).",
      hint: "Consistency, Availability, Partition Tolerance.",
      intervalDays: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
    },
    {
      id: "card-3",
      front: "How does HNSW (Hierarchical Navigable Small World) indexing accelerate vector search?",
      back: "HNSW builds a multi-layer graph where upper layers have long-range skip links for fast coarse routing, and lower layers have dense localized connections for precise approximate nearest neighbor (ANN) retrieval in O(log N) time.",
      hint: "Multi-layer skip-list graph structure.",
      intervalDays: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
    },
    {
      id: "card-4",
      front: "What is the Raft Consensus Algorithm used for?",
      back: "Raft manages replicated state machines across distributed clusters using Leader Election, Log Replication, and Safety invariants to ensure fault-tolerant consistency.",
      hint: "Leader-based distributed log consensus.",
      intervalDays: 1,
      repetitionCount: 0,
      easeFactor: 2.5,
    },
  ],
  quizzes: [
    {
      id: "quiz-1",
      question: "Which of the following describes the time complexity of vector search using HNSW indexing?",
      options: [
        { id: "opt-1", text: "O(N) linear scan", isCorrect: false },
        { id: "opt-2", text: "O(log N) approximate nearest neighbors", isCorrect: true },
        { id: "opt-3", text: "O(N^2) pairwise quadratic scan", isCorrect: false },
        { id: "opt-4", text: "O(1) constant time hash lookup", isCorrect: false },
      ],
      explanation:
        "HNSW constructs a hierarchical multi-layer graph structure with logarithmic search complexity O(log N), avoiding expensive exhaustive O(N) scans across high-dimensional vector spaces.",
      difficulty: "medium",
    },
    {
      id: "quiz-2",
      question: "In the CAP theorem, why is Partition Tolerance (P) typically mandatory in distributed cloud environments?",
      options: [
        { id: "opt-1", text: "Network partitions and packet losses are inevitable in physical distributed networks", isCorrect: true },
        { id: "opt-2", text: "It reduces cloud storage costs by half", isCorrect: false },
        { id: "opt-3", text: "It allows bypassing SSL certificates", isCorrect: false },
        { id: "opt-4", text: "It guarantees zero CPU usage on idle nodes", isCorrect: false },
      ],
      explanation:
        "Physical networks, switches, and cross-region cables experience inevitable transient failures, so distributed systems must be partition-tolerant (P) and choose between Consistency (CP) or Availability (AP).",
      difficulty: "easy",
    },
  ],
};

/**
 * Parse markdown study deck blocks (JSON or Q&A format)
 */
export function parseStudyDeck(content: string, defaultTitle = "Interactive Study Deck"): StudyDeck {
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.flashcards) || Array.isArray(parsed.quizzes)) {
        return {
          id: parsed.id || `deck-${Date.now()}`,
          title: parsed.title || defaultTitle,
          description: parsed.description,
          category: parsed.category || "General",
          flashcards: (parsed.flashcards || []).map((fc: any, i: number) => ({
            id: String(fc.id || `card-${i}`),
            front: String(fc.front || fc.question || "Question"),
            back: String(fc.back || fc.answer || "Answer"),
            hint: fc.hint ? String(fc.hint) : undefined,
            intervalDays: 1,
            repetitionCount: 0,
            easeFactor: 2.5,
          })),
          quizzes: (parsed.quizzes || []).map((q: any, i: number) => ({
            id: String(q.id || `quiz-${i}`),
            question: String(q.question || "Question"),
            options: Array.isArray(q.options)
              ? q.options.map((opt: any, oi: number) => ({
                  id: String(opt.id || `opt-${oi}`),
                  text: typeof opt === "string" ? opt : String(opt.text || ""),
                  isCorrect: typeof opt === "object" ? Boolean(opt.isCorrect) : oi === 0,
                }))
              : [],
            explanation: String(q.explanation || "Correct answer evaluated."),
            difficulty: q.difficulty || "medium",
          })),
        };
      }
    }
  } catch {
    // Return sample deck on parse error
  }

  return {
    ...SAMPLE_STUDY_DECK,
    title: defaultTitle,
  };
}
