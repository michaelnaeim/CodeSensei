"use client";

import { useState } from "react";
import { Award, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/card";
import { submitQuiz } from "@/lib/api";
import type { QuizQuestion } from "@/types";

export function QuizView({
  topicId,
  questions,
  onComplete,
}: {
  topicId: string;
  questions: QuizQuestion[];
  onComplete: (score: number, passed: boolean) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [results, setResults] = useState<
    { question_id: string; correct: boolean; explanation: string }[]
  >([]);

  const q = questions[current];

  const finishQuiz = async (finalAnswers: Record<string, string>) => {
    setSubmitting(true);
    try {
      const data = await submitQuiz(topicId, finalAnswers);
      setScore(data.score);
      setPassed(data.passed);
      setResults(
        data.results.map((r) => ({
          question_id: r.question_id,
          correct: r.correct,
          explanation: r.explanation,
        }))
      );
      setFinished(true);
      onComplete(data.score, data.passed);
    } catch {
      setFinished(true);
      setScore(0);
      setPassed(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (finished) {
    return (
      <div className="text-center py-10 space-y-4 max-w-lg mx-auto">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${passed ? "bg-[var(--success-soft)]" : "bg-[var(--warning-soft)]"}`}>
          <Award className={`w-8 h-8 ${passed ? "text-[var(--success)]" : "text-[var(--warning)]"}`} />
        </div>
        <h3 className="font-[family-name:var(--font-space)] text-xl font-bold">
          {passed ? "Module cleared!" : "Keep studying"}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Score: {score}% — {passed ? "You've proven mastery." : "Need 70% to clear."}
        </p>
        <ProgressBar value={score} className="h-2" />
        {results.length > 0 && (
          <div className="text-left space-y-2 mt-6">
            {results.map((r) => (
              <div
                key={r.question_id}
                className={`panel p-3 text-sm flex gap-2 ${r.correct ? "border-green-200" : "border-red-200"}`}
              >
                {r.correct ? (
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[var(--error)] shrink-0" />
                )}
                <p className="text-[var(--text-secondary)]">{r.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex justify-between text-sm text-[var(--text-secondary)]">
        <span>Question {current + 1} / {questions.length}</span>
      </div>
      <ProgressBar value={((current + 1) / questions.length) * 100} />
      <h3 className="font-medium text-lg">{q.question}</h3>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const cls =
            selected === i
              ? "panel p-4 text-sm border-[var(--accent)] bg-[var(--accent-soft)] cursor-pointer"
              : "panel p-4 text-sm cursor-pointer hover:border-[var(--accent)]/40 transition-colors";

          return (
            <button key={opt} onClick={() => setSelected(i)} className={`w-full text-left ${cls}`}>
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center text-xs shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        className="w-full"
        disabled={selected === null || submitting}
        onClick={() => {
          if (selected === null) return;
          const updated = { ...answers, [q.id]: q.options[selected] };
          setAnswers(updated);

          if (current < questions.length - 1) {
            setCurrent(current + 1);
            setSelected(null);
          } else {
            finishQuiz(updated);
          }
        }}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : current < questions.length - 1 ? (
          "Next"
        ) : (
          "Submit quiz"
        )}
      </Button>
    </div>
  );
}
