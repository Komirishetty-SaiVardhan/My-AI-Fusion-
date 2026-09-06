"use client";

import React, { useState, memo } from "react";
import { Flashcard, FlashcardRating, StudyDeck } from "@/lib/study/types";
import { calculateSm2Metrics, parseStudyDeck, SAMPLE_STUDY_DECK } from "@/lib/study/engine";
import { QuizViewer } from "./QuizViewer";
import {
  Brain,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Award,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardDeckProps {
  rawContent?: string;
  initialTitle?: string;
  className?: string;
}

function FlashcardDeckComponent({
  rawContent,
  initialTitle,
  className,
}: FlashcardDeckProps) {
  const [deck, setDeck] = useState<StudyDeck>(() =>
    rawContent ? parseStudyDeck(rawContent, initialTitle) : SAMPLE_STUDY_DECK
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState<"flashcards" | "quiz">("flashcards");
  const [masteredCount, setMasteredCount] = useState(0);

  const cards = deck.flashcards || [];
  const currentCard = cards[currentIndex] || cards[0];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleRating = (rating: FlashcardRating) => {
    if (!currentCard) return;
    const updatedMetrics = calculateSm2Metrics(currentCard, rating);
    const updatedCard = { ...currentCard, ...updatedMetrics };

    if (rating === "good" || rating === "easy") {
      setMasteredCount((c) => c + 1);
    }

    setDeck((prev) => ({
      ...prev,
      flashcards: prev.flashcards.map((c, i) => (i === currentIndex ? updatedCard : c)),
    }));

    // Advance to next card
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleShuffle = () => {
    setDeck((prev) => ({
      ...prev,
      flashcards: [...prev.flashcards].sort(() => Math.random() - 0.5),
    }));
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  if (cards.length === 0) return null;

  return (
    <div
      className={cn(
        "my-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xl overflow-hidden [contain:content]",
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[var(--muted)]/40 border-b border-[var(--border)] text-xs select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center flex-shrink-0 font-bold">
            <Brain className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs text-[var(--foreground)] block truncate">
              {deck.title}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] block">
              SM-2 Spaced Repetition • {cards.length} Cards • {deck.quizzes.length} Quizzes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-[var(--muted)] p-0.5 rounded-lg border border-[var(--border)] text-[11px]">
            <button
              onClick={() => setViewMode("flashcards")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                viewMode === "flashcards"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Flashcards ({cards.length})
            </button>
            {deck.quizzes.length > 0 && (
              <button
                onClick={() => setViewMode("quiz")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                  viewMode === "quiz"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                Quiz ({deck.quizzes.length})
              </button>
            )}
          </div>

          <button
            onClick={handleShuffle}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            title="Shuffle deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "flashcards" ? (
        <div className="p-4 sm:p-6 flex flex-col items-center">
          {/* Progress Bar & Counter */}
          <div className="w-full max-w-lg flex items-center justify-between mb-3 text-xs text-[var(--muted-foreground)]">
            <span className="font-medium">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-purple-500 font-medium">
              {masteredCount} Mastered
            </span>
          </div>

          <div className="w-full max-w-lg h-1.5 bg-[var(--muted)] rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* 3D Interactive Flip Card */}
          <div
            onClick={handleFlip}
            className="w-full max-w-lg min-h-[220px] rounded-2xl border-2 border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-indigo-500/5 p-6 shadow-md hover:shadow-xl hover:border-purple-500/50 transition-all cursor-pointer flex flex-col justify-between select-none relative group"
          >
            {/* Flip hint chip */}
            <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-mono font-semibold uppercase">
                {isFlipped ? "Answer / Explanation" : "Question / Concept"}
              </span>
              <span className="opacity-60 group-hover:opacity-100 flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                <span>Click card to flip</span>
              </span>
            </div>

            {/* Card Content */}
            <div className="my-auto py-3 text-center">
              <h4 className="text-sm sm:text-base font-semibold text-[var(--foreground)] leading-relaxed">
                {isFlipped ? currentCard?.back : currentCard?.front}
              </h4>
            </div>

            {/* Bottom Hint Action */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 text-xs">
              {currentCard?.hint ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint((h) => !h);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-500 hover:text-amber-400 font-medium cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showHint ? currentCard.hint : "Show Hint"}</span>
                </button>
              ) : (
                <div />
              )}
              <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                Ease: {currentCard?.easeFactor?.toFixed(1) || "2.5"}x
              </span>
            </div>
          </div>

          {/* SM-2 Spaced Repetition Difficulty Buttons */}
          <div className="w-full max-w-lg grid grid-cols-4 gap-2 mt-5 text-xs">
            <button
              onClick={() => handleRating("again")}
              className="py-2 px-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold text-[11px] transition-all cursor-pointer text-center"
            >
              <span className="block font-bold">Again</span>
              <span className="text-[9px] font-normal opacity-80">1 Day</span>
            </button>
            <button
              onClick={() => handleRating("hard")}
              className="py-2 px-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 font-semibold text-[11px] transition-all cursor-pointer text-center"
            >
              <span className="block font-bold">Hard</span>
              <span className="text-[9px] font-normal opacity-80">2 Days</span>
            </button>
            <button
              onClick={() => handleRating("good")}
              className="py-2 px-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 font-semibold text-[11px] transition-all cursor-pointer text-center"
            >
              <span className="block font-bold">Good</span>
              <span className="text-[9px] font-normal opacity-80">6 Days</span>
            </button>
            <button
              onClick={() => handleRating("easy")}
              className="py-2 px-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-semibold text-[11px] transition-all cursor-pointer text-center"
            >
              <span className="block font-bold">Easy</span>
              <span className="text-[9px] font-normal opacity-80">10 Days</span>
            </button>
          </div>

          {/* Bottom Card Navigation */}
          <div className="w-full max-w-lg flex items-center justify-between mt-4 text-xs text-[var(--muted-foreground)]">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((i) => i - 1);
                  setIsFlipped(false);
                  setShowHint(false);
                }
              }}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                if (currentIndex < cards.length - 1) {
                  setCurrentIndex((i) => i + 1);
                  setIsFlipped(false);
                  setShowHint(false);
                }
              }}
              disabled={currentIndex === cards.length - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Mode View */
        <QuizViewer quizzes={deck.quizzes} title={deck.title} />
      )}
    </div>
  );
}

export const FlashcardDeck = memo(FlashcardDeckComponent);
