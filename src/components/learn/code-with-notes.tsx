"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CodeNote } from "@/types";

export function CodeWithNotes({
  sourceCode,
  notes,
  language,
  onComplete,
}: {
  sourceCode: string;
  notes: CodeNote[];
  language: string;
  onComplete: () => void;
}) {
  const lines = sourceCode.split("\n");
  const [activeLine, setActiveLine] = useState<number | null>(notes[0]?.line ?? null);
  const noteMap = Object.fromEntries(notes.map((n) => [n.line, n.text]));

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 rounded-lg overflow-hidden border border-[var(--border)]">
        <div className="px-3 py-2 bg-[var(--bg-muted)] border-b border-[var(--border)] flex justify-between text-xs text-[var(--text-muted)]">
          <span className="font-[family-name:var(--font-jetbrains)]">{language}</span>
          <span>Click highlighted lines</span>
        </div>
        <div className="overflow-auto max-h-[440px] font-mono text-[12px] leading-6 bg-[var(--bg-code)]">
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const hasNote = noteMap[lineNum];
            return (
              <div
                key={lineNum}
                onClick={() => hasNote && setActiveLine(lineNum)}
                className={cn(
                  "flex gap-3 px-3 py-px",
                  hasNote && "cursor-pointer hover:bg-blue-500/10",
                  activeLine === lineNum && "code-line-highlight",
                  hasNote && activeLine !== lineNum && "border-l-2 border-blue-400/40"
                )}
              >
                <span className="text-zinc-600 w-6 text-right select-none shrink-0">{lineNum}</span>
                <span className="text-zinc-200 whitespace-pre">{line || " "}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2 panel p-4 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-3">
          Line notes
        </p>
        {activeLine && noteMap[activeLine] ? (
          <>
            <p className="text-xs font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] mb-2">Line {activeLine}</p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{noteMap[activeLine]}</p>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Select an annotated line.</p>
        )}
        <div className="mt-auto pt-4 space-y-1 max-h-48 overflow-auto">
          {notes.map((n) => (
            <button
              key={n.line}
              onClick={() => setActiveLine(n.line)}
              className={cn(
                "w-full text-left text-xs p-2 rounded-md cursor-pointer transition-colors",
                activeLine === n.line ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg-elevated)]"
              )}
            >
              <span className="font-[family-name:var(--font-jetbrains)] text-[var(--accent)]">L{n.line}</span>
              <span className="text-[var(--text-muted)] ml-2">{n.text}</span>
            </button>
          ))}
        </div>
        <Button variant="secondary" className="w-full mt-4" onClick={onComplete}>
          Continue to challenge
        </Button>
      </div>
    </div>
  );
}
