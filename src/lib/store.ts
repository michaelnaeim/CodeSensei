"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MasteryEntry {
  repoId: string;
  topicId: string;
  fileId: string;
  flashcardsDone: boolean;
  lessonDone: boolean;
  codeDone: boolean;
  challengeDone: boolean;
  quizScore: number;
  quizPassed: boolean;
  mastery: number;
}

interface AppState {
  isDemo: boolean;
  user: { name: string; username: string; avatar: string } | null;
  mastery: Record<string, MasteryEntry>;
  setDemoUser: () => void;
  signOut: () => void;
  updateMastery: (entry: Partial<MasteryEntry> & { repoId: string; topicId: string; fileId: string }) => void;
  getTopicMastery: (repoId: string, topicId: string) => number;
}

function masteryKey(repoId: string, topicId: string, fileId: string) {
  return `${repoId}:${topicId}:${fileId}`;
}

function calcMastery(entry: MasteryEntry): number {
  let score = 0;
  if (entry.flashcardsDone) score += 15;
  if (entry.lessonDone) score += 20;
  if (entry.codeDone) score += 20;
  if (entry.challengeDone) score += 25;
  if (entry.quizPassed) score += 20;
  else score += Math.round(entry.quizScore * 0.2);
  return Math.min(100, score);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isDemo: false,
      user: null,
      mastery: {},

      setDemoUser: () =>
        set({
          isDemo: true,
          user: {
            name: "Alex Chen",
            username: "alexchen",
            avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=alexchen",
          },
        }),

      signOut: () => set({ isDemo: false, user: null }),

      updateMastery: (partial) => {
        const key = masteryKey(partial.repoId, partial.topicId, partial.fileId);
        const existing = get().mastery[key] ?? {
          repoId: partial.repoId,
          topicId: partial.topicId,
          fileId: partial.fileId,
          flashcardsDone: false,
          lessonDone: false,
          codeDone: false,
          challengeDone: false,
          quizScore: 0,
          quizPassed: false,
          mastery: 0,
        };
        const merged = { ...existing, ...partial };
        merged.mastery = calcMastery(merged);
        set((state) => ({
          mastery: { ...state.mastery, [key]: merged },
        }));
      },

      getTopicMastery: (repoId, topicId) => {
        const entries = Object.values(get().mastery).filter(
          (e) => e.repoId === repoId && e.topicId === topicId
        );
        if (entries.length === 0) return 0;
        return Math.round(entries.reduce((s, e) => s + e.mastery, 0) / entries.length);
      },
    }),
    { name: "codesensi-storage" }
  )
);
