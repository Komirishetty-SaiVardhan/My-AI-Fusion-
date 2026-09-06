"use client";

import React, { useState, memo } from "react";
import { QuizQuestion } from "@/lib/study/types";
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizViewerProps {
  quizzes: QuizQuestion[];
  title?: string;
}

function QuizViewerComponent({ quizzes, title = "Interactive Quiz" }: QuizViewerProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (questionIndex: number, optionId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionId,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    quizzes.forEach((q, i) => {
      const selectedOptionId = selectedAnswers[i];
      const correctOption = q.options.find((opt) => opt.isCorrect);
      if (correctOption && selectedOptionId === correctOption.id) {
        score++;
      }
    });
    return score;
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const score = calculateScore();
  const percentage = Math.round((score / Math.max(1, quizzes.length)) * 100);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-h-[500px] overflow-y-auto">
      {/* Quiz Progress & Score Header */}
      {submitted && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-sky-500/10 border border-purple-500/30 text-center animate-in zoom-in-95 duration-150">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center mx-auto mb-2 font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-[var(--foreground)] mb-1">
            Quiz Completed! Score: {score} / {quizzes.length} ({percentage}%)
          </h4>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            {percentage >= 80
              ? "🎉 Outstanding comprehension! You have mastered these concepts."
              : percentage >= 50
              ? "👍 Good attempt! Review the explanations below to refine your understanding."
              : "📚 Review the flashcards and try again to reinforce key points."}
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {quizzes.map((quiz, qIndex) => {
          const selectedOptId = selectedAnswers[qIndex];
          const hasSelected = Boolean(selectedOptId);

          return (
            <div
              key={quiz.id || qIndex}
              className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)]/20 space-y-3"
            >
              {/* Question Title */}
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-500 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  {qIndex + 1}
                </span>
                <h5 className="font-semibold text-xs sm:text-sm text-[var(--foreground)] leading-snug">
                  {quiz.question}
                </h5>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                {quiz.options.map((opt) => {
                  const isChosen = selectedOptId === opt.id;
                  let optStyle = "border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)]";

                  if (submitted) {
                    if (opt.isCorrect) {
                      optStyle = "bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-semibold";
                    } else if (isChosen && !opt.isCorrect) {
                      optStyle = "bg-red-500/15 border-red-500/50 text-red-600 dark:text-red-400";
                    }
                  } else if (isChosen) {
                    optStyle = "bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-400 font-medium";
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(qIndex, opt.id)}
                      disabled={submitted}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer",
                        optStyle
                      )}
                    >
                      <span>{opt.text}</span>
                      {submitted && opt.isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
                      )}
                      {submitted && isChosen && !opt.isCorrect && (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submit */}
              {submitted && (
                <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] leading-relaxed flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[var(--foreground)] block mb-0.5">
                      Explanation:
                    </span>
                    <span>{quiz.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Quiz Action Bar */}
      {!submitted && (
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(selectedAnswers).length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
          >
            <span>Submit Quiz</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export const QuizViewer = memo(QuizViewerComponent);
