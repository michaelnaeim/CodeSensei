"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Award, Loader2 } from "lucide-react";
import { AppHeader, Breadcrumbs, MasteryRing, StepTabs } from "@/components/app-shell";
import { FlashcardDeck } from "@/components/learn/flashcard-deck";
import { LessonSplitView } from "@/components/learn/lesson-view";
import { CodeWithNotes } from "@/components/learn/code-with-notes";
import { ChallengeView } from "@/components/learn/challenge-view";
import { QuizView } from "@/components/learn/quiz-view";
import {
  getChallenge,
  getQuiz,
  getRepo,
  getTopicCode,
  getTopicDetail,
} from "@/lib/api";
import { buildTopic, mapRepo } from "@/lib/api-mappers";
import { useAppStore } from "@/lib/store";
import type { Repo, Topic, TopicFile } from "@/types";

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
  const { user, mastery, updateMastery, setDemoUser } = useAppStore();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [file, setFile] = useState<TopicFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState("flashcards");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); if (!user) setDemoUser(); }, [user, setDemoUser]);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const [repoData, detail, codeFiles, challenge, quiz] = await Promise.all([
          getRepo(repoId),
          getTopicDetail(topicId),
          getTopicCode(topicId),
          getChallenge(topicId),
          getQuiz(topicId),
        ]);
        const mappedRepo = mapRepo(repoData);
        const mappedTopic = buildTopic(detail, codeFiles, challenge, quiz.questions, repoId);
        const mappedFile = mappedTopic.files.find((f) => f.id === fileId) ?? mappedTopic.files[0];

        setRepo(mappedRepo);
        setTopic(mappedTopic);
        setFile(mappedFile ?? null);

        if (detail.challenge_passed) {
          updateMastery({ repoId, topicId, fileId: mappedFile?.id ?? "main", challengeDone: true });
        }
        if (detail.quiz_passed) {
          updateMastery({ repoId, topicId, fileId: mappedFile?.id ?? "main", quizPassed: true, quizScore: 100 });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, repoId, topicId, fileId]);

  const effectiveFileId = file?.id ?? fileId;
  const key = `${repoId}:${topicId}:${effectiveFileId}`;
  const entry = mastery[key];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error || !repo || !topic || !file) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)]">{error || "Lesson not found"}</div>;
  }

  const completed = {
    flashcards: !!entry?.flashcardsDone,
    lesson: !!entry?.lessonDone,
    code: !!entry?.codeDone,
    challenge: !!entry?.challengeDone,
    quiz: !!entry?.quizPassed,
  };

  const base = { repoId, topicId, fileId: effectiveFileId };
  const moduleCleared = entry?.challengeDone && entry?.quizPassed;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader repoName={repo.fullName} backHref={`/repos/${repoId}/${topicId}`} />
      <main className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <Breadcrumbs
            items={[
              { label: repo.name, href: `/repos/${repoId}` },
              { label: topic.title, href: `/repos/${repoId}/${topicId}` },
              { label: file.path },
            ]}
          />
          <MasteryRing value={entry?.mastery ?? 0} />
        </div>

        <h1 className="font-[family-name:var(--font-jetbrains)] text-xl mb-1">{file.title}</h1>
        <p className="text-xs font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] mb-5">{file.path}</p>

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
              topicId={topicId}
              onComplete={() => updateMastery({ ...base, challengeDone: true })}
            />
          )}
          {step === "quiz" && (
            <QuizView
              topicId={topicId}
              questions={file.quiz}
              onComplete={(score, passed) =>
                updateMastery({ ...base, quizScore: score, quizPassed: passed })
              }
            />
          )}
        </div>

        {moduleCleared && (
          <div className="mt-4 panel p-4 flex items-center gap-3 border-green-800/40">
            <Award className="w-6 h-6 text-[var(--success)]" />
            <div>
              <p className="font-semibold text-[var(--success)]">Module cleared!</p>
              <p className="text-sm text-[var(--text-secondary)]">
                You&apos;ve mastered {topic.title}.{" "}
                <Link href={`/repos/${repoId}/${topicId}`} className="text-[var(--accent)] hover:underline">
                  Back to module
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
