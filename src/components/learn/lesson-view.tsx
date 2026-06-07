"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TopicFile } from "@/types";

export function LessonSplitView({
  file,
  onComplete,
}: {
  file: TopicFile;
  onComplete: () => void;
}) {
  const { lesson, sourceCode } = file;
  const previewLines = sourceCode.split("\n").slice(0, 18);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{lesson.summary}</p>
        <Badge variant="info"><Clock className="w-3 h-3 inline mr-1" />{lesson.estimatedMinutes} min</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
            What you&apos;ll learn
          </p>
          <ul className="space-y-2.5">
            {lesson.objectives.map((obj) => (
              <li key={obj.id} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0 mt-0.5" />
                {obj.text}
              </li>
            ))}
          </ul>
          {lesson.concepts.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[var(--border)] space-y-3">
              {lesson.concepts.map((c) => (
                <div key={c.title}>
                  <p className="text-sm font-semibold text-[var(--text)]">{c.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg overflow-hidden border border-[var(--border)]">
          <div className="px-3 py-2 bg-[var(--bg-muted)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] font-[family-name:var(--font-jetbrains)]">
            {file.path}
          </div>
          <pre className="p-4 bg-[var(--bg-code)] text-[11px] leading-5 font-mono text-zinc-300 overflow-auto max-h-[360px]">
            {previewLines.map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-zinc-600 w-5 text-right select-none">{i + 1}</span>
                <span>{line || " "}</span>
              </div>
            ))}
            {sourceCode.split("\n").length > 18 && (
              <div className="text-zinc-500 mt-2">… {sourceCode.split("\n").length - 18} more lines</div>
            )}
          </pre>
        </div>
      </div>

      <Button variant="secondary" className="w-full" onClick={onComplete}>
        Continue to line-by-line notes
      </Button>
    </div>
  );
}
