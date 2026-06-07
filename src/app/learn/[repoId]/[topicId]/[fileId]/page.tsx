"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Award } from "lucide-react";
import { AppHeader, Breadcrumbs, MasteryRing, StepTabs } from "@/components/app-shell";
import { FlashcardDeck } from "@/components/learn/flashcard-deck";
import { LessonSplitView } from "@/components/learn/lesson-view";
import { CodeWithNotes } from "@/components/learn/code-with-notes";
import { ChallengeView } from "@/components/learn/challenge-view";
import { QuizView } from "@/components/learn/quiz-view";
import { getRepo, getTopic } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";

const STEPS = [
  { id: "flashcards", label: "Flashcards" },
  { id: "lesson", label: "Lesson plan" },
  { id: "code", label: "Line notes" },
  { id: "challenge", label: "Challenge" },
  { id: "quiz", label: "Official quiz" },
];

export default function LearnPage() {
  const params = useParams();
  const repoId = params.repoId as string;
  const topicId = params.topicId as string;
  const fileId = params.fileId as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, mastery, updateMastery } = useAppStore();
  const [step, setStep] = useState("flashcards");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !user) router.push("/");
  }, [mounted, status, user, router]);

  const repo = getRepo(repoId);
  const topic = getTopic(topicId);
  const file = topic?.files.find((f) => f.id === fileId);
  const key = `${repoId}:${topicId}:${fileId}`;
  const entry = mastery[key];

  if (!repo || !topic || !file) {
    return <div className="min-h-screen flex items-center justify-center">Lesson not found</div>;
  }

  const completed = {
    flashcards: !!entry?.flashcardsDone,
    lesson: !!entry?.lessonDone,
    code: !!entry?.codeDone,
    challenge: !!entry?.challengeDone,
    quiz: !!entry?.quizPassed,
  };

  const base = { repoId, topicId, fileId };

  return (
    <>
      <AppHeader />
      <main className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumbs
            items={[
              { label: "Repos", href: "/dashboard" },
              { label: repo.name, href: `/repos/${repoId}` },
              { label: topic.title, href: `/repos/${repoId}/${topicId}` },
              { label: file.title },
            ]}
          />
          <MasteryRing value={entry?.mastery ?? 0} />
        </div>

        <h1 className="font-[family-name:var(--font-space)] text-xl font-bold mb-1">{file.title}</h1>
        <p className="text-sm font-mono text-[var(--text-muted)] mb-5">{file.path}</p>

        <StepTabs steps={STEPS} active={step} onChange={setStep} completed={completed} />

        <div className="panel p-6 mt-4 min-h-[420px]">
          {step === "flashcards" && (
            <FlashcardDeck
              cards={file.flashcards}
              onComplete={() => {
                updateMastery({ ...base, flashcardsDone: true });
                setStep("lesson");
              }}
            />
          )}
          {step === "lesson" && (
            <LessonSplitView
              file={file}
              onComplete={() => {
                updateMastery({ ...base, lessonDone: true });
                setStep("code");
              }}
            />
          )}
          {step === "code" && (
            <CodeWithNotes
              sourceCode={file.sourceCode}
              notes={file.notes}
              language={file.language}
              onComplete={() => {
                updateMastery({ ...base, codeDone: true });
                setStep("challenge");
              }}
            />
          )}
          {step === "challenge" && (
            <ChallengeView
              challenge={file.challenge}
              onComplete={() => updateMastery({ ...base, challengeDone: true })}
            />
          )}
          {step === "quiz" && (
            <QuizView
              questions={file.quiz}
              onComplete={(score, passed) =>
                updateMastery({ ...base, quizScore: score, quizPassed: passed })
              }
            />
          )}
        </div>

        {entry?.quizPassed && (
          <div className="mt-4 panel p-4 flex items-center gap-3 bg-[var(--success-soft)] border-green-200">
            <Award className="w-6 h-6 text-[var(--success)]" />
            <div>
              <p className="font-semibold text-[var(--success)]">Module cleared!</p>
              <p className="text-sm text-[var(--text-secondary)]">
                You&apos;ve mastered {topic.title} — {file.title}.{" "}
                <Link href={`/repos/${repoId}/${topicId}`} className="text-[var(--accent)] hover:underline">
                  Back to module
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
