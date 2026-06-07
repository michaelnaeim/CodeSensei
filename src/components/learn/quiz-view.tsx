"use client";

import { useState } from "react";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/card";
import type { QuizQuestion } from "@/types";

export function QuizView({
  questions,
  onComplete,
}: {
  questions: QuizQuestion[];
  onComplete: (score: number, passed: boolean) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const q = questions[current];
  const score = Math.round((answers.filter(Boolean).length / questions.length) * 100);
  const passed = score >= 70;

  if (finished) {
    return (
      <div className="text-center py-10 space-y-4 max-w-sm mx-auto">
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
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex justify-between text-sm text-[var(--text-secondary)]">
        <span>Question {current + 1} / {questions.length}</span>
        <span>{answers.filter(Boolean).length} correct</span>
      </div>
      <ProgressBar value={((current + 1) / questions.length) * 100} />
      <h3 className="font-medium text-lg">{q.question}</h3>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = "panel p-4 text-sm cursor-pointer hover:border-[var(--accent)]/40 transition-colors";
          if (revealed && i === q.correctIndex) cls = "panel p-4 text-sm bg-[var(--success-soft)] border-green-200";
          else if (revealed && i === selected) cls = "panel p-4 text-sm bg-[var(--error-soft)] border-red-200";
          else if (selected === i) cls = "panel p-4 text-sm border-[var(--accent)] bg-[var(--accent-soft)]";

          return (
            <button key={opt} disabled={revealed} onClick={() => setSelected(i)} className={`w-full text-left ${cls}`}>
              <span className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center text-xs shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {revealed && i === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-[var(--success)] ml-auto" />}
                {revealed && i === selected && i !== q.correctIndex && <XCircle className="w-4 h-4 text-[var(--error)] ml-auto" />}
              </span>
            </button>
          );
        })}
      </div>

      {revealed && <p className="text-sm panel-inset p-3 text-[var(--text-secondary)]">{q.explanation}</p>}

      {!revealed ? (
        <Button className="w-full" disabled={selected === null} onClick={() => {
          if (selected === null) return;
          setAnswers([...answers, selected === q.correctIndex]);
          setRevealed(true);
        }}>
          Submit
        </Button>
      ) : (
        <Button className="w-full" onClick={() => {
          if (current < questions.length - 1) {
            setCurrent(current + 1);
            setSelected(null);
            setRevealed(false);
          } else {
            const final = [...answers];
            const s = Math.round((final.filter(Boolean).length / questions.length) * 100);
            setFinished(true);
            onComplete(s, s >= 70);
          }
        }}>
          {current < questions.length - 1 ? "Next" : "See results"}
        </Button>
      )}
    </div>
  );
}
