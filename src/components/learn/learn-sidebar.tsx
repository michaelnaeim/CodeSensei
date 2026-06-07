"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  Brain,
  Code2,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";

export type LearnStep = "flashcards" | "lesson" | "code" | "challenge" | "quiz";

const STEPS: { id: LearnStep; label: string; icon: typeof BookOpen }[] = [
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "lesson", label: "Lesson plan", icon: BookOpen },
  { id: "code", label: "Source code", icon: Code2 },
  { id: "challenge", label: "Challenge", icon: Brain },
  { id: "quiz", label: "Official quiz", icon: Target },
];

interface Props {
  active: LearnStep;
  onChange: (step: LearnStep) => void;
  completed: Partial<Record<LearnStep, boolean>>;
  mastery: number;
}

export function LearnSidebar({ active, onChange, completed, mastery }: Props) {
  return (
    <aside className="w-64 shrink-0 space-y-6">
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Mastery
          </span>
          <span className="text-sm font-bold text-[var(--accent-good)]">{mastery}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-good)] to-[var(--accent-fast)] transition-all"
            style={{ width: `${mastery}%` }}
          />
        </div>
      </div>

      <nav className="space-y-1">
        {STEPS.map((step) => {
          const isActive = active === step.id;
          const isDone = completed[step.id];
          return (
            <button
              key={step.id}
              onClick={() => onChange(step.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer",
                isActive
                  ? "bg-[var(--accent-good)]/15 text-[var(--accent-good)] border border-[var(--accent-good)]/30"
                  : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
              )}
            >
              <step.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{step.label}</span>
              {isDone && (
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-good)]" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
