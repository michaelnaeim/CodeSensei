"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/types";

export function FlashcardDeck({ cards, onComplete }: { cards: Flashcard[]; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  const next = () => {
    setFlipped(false);
    if (index < cards.length - 1) setIndex(index + 1);
    else onComplete();
  };

  return (
    <div className="max-w-lg mx-auto">
      <p className="text-sm text-[var(--text-muted)] text-center mb-4">
        Card {index + 1} of {cards.length}
      </p>

      <div className="relative h-56 mb-6" style={{ perspective: "1000px" }}>
        <div
          className={`flashcard-3d relative w-full h-full cursor-pointer ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="flashcard-face absolute inset-0 panel flex items-center justify-center p-8 text-center">
            <p className="text-lg font-medium text-[var(--text)]">{card.front}</p>
            <p className="absolute bottom-4 text-xs text-[var(--text-muted)]">Tap to flip</p>
          </div>
          <div className="flashcard-face flashcard-back absolute inset-0 panel flex items-center justify-center p-8 text-center bg-[var(--accent-soft)] border-[var(--accent)]/30">
            <p className="text-base leading-relaxed text-[var(--text)]">{card.back}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => { setFlipped(false); setIndex(index - 1); }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setFlipped(!flipped)}>
          <RotateCcw className="w-4 h-4" /> Flip
        </Button>
        <Button variant="secondary" size="sm" onClick={next}>
          {index === cards.length - 1 ? "Done" : "Next"} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
