"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FileCode, Loader2 } from "lucide-react";
import { AppHeader, Breadcrumbs, MasteryRing } from "@/components/app-shell";
import { Card, ProgressBar, Badge } from "@/components/ui/card";
import { getRepo, getTopicDetail } from "@/lib/api";
import { mapRepo } from "@/lib/api-mappers";
import { useAppStore } from "@/lib/store";
import type { Repo } from "@/types";

export default function TopicPage() {
  const params = useParams();
  const repoId = params.repoId as string;
  const topicId = params.topicId as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, mastery } = useAppStore();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [fileRefs, setFileRefs] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(20);
  const [cleared, setCleared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !user) router.push("/");
  }, [mounted, status, user, router]);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const [repoData, detail] = await Promise.all([getRepo(repoId), getTopicDetail(topicId)]);
        setRepo(mapRepo(repoData));
        setTopicTitle(detail.title);
        setTopicDescription(detail.description);
        setFileRefs(detail.file_refs);
        setEstimatedMinutes(detail.estimated_minutes);
        setCleared(detail.cleared);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load topic");
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted, repoId, topicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error || !repo) {
    return <div className="min-h-screen flex items-center justify-center">{error || "Topic not found"}</div>;
  }

  const key = `${repoId}:${topicId}:main`;
  const entry = mastery[key];
  const topicMastery = entry?.mastery ?? (cleared ? 100 : 0);

  return (
    <>
      <AppHeader />
      <main className="max-w-4xl mx-auto px-5 py-8">
        <Breadcrumbs
          items={[
            { label: "Repos", href: "/dashboard" },
            { label: repo.name, href: `/repos/${repoId}` },
            { label: topicTitle },
          ]}
        />

        <div className="flex items-start justify-between mt-4 mb-6">
          <div>
            <h1 className="font-[family-name:var(--font-space)] text-2xl font-bold">{topicTitle}</h1>
            <p className="text-[var(--text-secondary)] mt-1">{topicDescription}</p>
          </div>
          <MasteryRing value={Math.round(topicMastery)} />
        </div>

        <div className="space-y-3">
          <Link href={`/learn/${repoId}/${topicId}/main`}>
            <Card className="flex items-center gap-4 hover:border-[var(--accent)]/50 cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
                <FileCode className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold group-hover:text-[var(--accent)]">Start learning</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Flashcards · lesson · code notes · challenge · quiz · {estimatedMinutes} min
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <ProgressBar value={entry?.mastery ?? 0} className="flex-1 max-w-[200px]" />
                  {(entry?.quizPassed && entry?.challengeDone) || cleared ? (
                    <Badge variant="success">Cleared</Badge>
                  ) : null}
                </div>
              </div>
            </Card>
          </Link>

          {fileRefs.length > 0 && (
            <div className="panel p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Source files in this topic
              </p>
              <ul className="space-y-1">
                {fileRefs.map((ref) => (
                  <li key={ref} className="text-sm font-mono text-[var(--text-secondary)]">{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
