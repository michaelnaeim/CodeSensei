"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FileCode } from "lucide-react";
import { AppHeader, Breadcrumbs, MasteryRing } from "@/components/app-shell";
import { Card, ProgressBar, Badge } from "@/components/ui/card";
import { getRepo, getTopic } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";

export default function TopicPage() {
  const params = useParams();
  const repoId = params.repoId as string;
  const topicId = params.topicId as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, mastery } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !user) router.push("/");
  }, [mounted, status, user, router]);

  const repo = getRepo(repoId);
  const topic = getTopic(topicId);

  if (!repo || !topic) {
    return <div className="min-h-screen flex items-center justify-center">Topic not found</div>;
  }

  const topicMastery = topic.files.reduce((s, f) => {
    const key = `${repoId}:${topicId}:${f.id}`;
    return s + (mastery[key]?.mastery ?? 0);
  }, 0) / topic.files.length;

  return (
    <>
      <AppHeader />
      <main className="max-w-4xl mx-auto px-5 py-8">
        <Breadcrumbs
          items={[
            { label: "Repos", href: "/dashboard" },
            { label: repo.name, href: `/repos/${repoId}` },
            { label: topic.title },
          ]}
        />

        <div className="flex items-start justify-between mt-4 mb-6">
          <div>
            <h1 className="font-[family-name:var(--font-space)] text-2xl font-bold">{topic.title}</h1>
            <p className="text-[var(--text-secondary)] mt-1">{topic.description}</p>
          </div>
          <MasteryRing value={Math.round(topicMastery)} />
        </div>

        <div className="space-y-3">
          {topic.files.map((file) => {
            const key = `${repoId}:${topicId}:${file.id}`;
            const entry = mastery[key];
            return (
              <Link key={file.id} href={`/learn/${repoId}/${topicId}/${file.id}`}>
                <Card className="flex items-center gap-4 hover:border-[var(--accent)]/50 cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm group-hover:text-[var(--accent)]">{file.path}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {file.flashcards.length} cards · {file.lesson.estimatedMinutes} min · challenge + quiz
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <ProgressBar value={entry?.mastery ?? 0} className="flex-1 max-w-[200px]" />
                      {entry?.quizPassed && <Badge variant="success">Cleared</Badge>}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
