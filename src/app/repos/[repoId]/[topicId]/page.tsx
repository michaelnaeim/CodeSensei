"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, FileCode, Loader2 } from "lucide-react";
import { AppHeader, Breadcrumbs } from "@/components/app-shell";
import { Badge, ProgressBar } from "@/components/ui/card";
import { getRepo, getTopicDetail } from "@/lib/api";
import { mapRepo } from "@/lib/api-mappers";
import { useAppStore } from "@/lib/store";
import type { Repo } from "@/types";

export default function TopicPage() {
  const params = useParams();
  const repoId = params.repoId as string;
  const topicId = params.topicId as string;
  const router = useRouter();
  const { user, mastery, setDemoUser } = useAppStore();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [fileRefs, setFileRefs] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(20);
  const [cleared, setCleared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); if (!user) setDemoUser(); }, [user, setDemoUser]);

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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error || !repo) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)]">{error || "Topic not found"}</div>;
  }

  const key = `${repoId}:${topicId}:main`;
  const entry = mastery[key];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader repoName={repo.fullName} backHref={`/repos/${repoId}`} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <Breadcrumbs
          items={[
            { label: "Repos", href: "/dashboard" },
            { label: repo.name, href: `/repos/${repoId}` },
            { label: topicTitle },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl mb-2">{topicTitle}</h1>
          <p className="text-sm text-[var(--text-muted)]">{topicDescription}</p>
        </div>

        <Link href={`/learn/${repoId}/${topicId}/main`}>
          <div className="panel p-5 flex items-center gap-4 hover:border-[var(--border-strong)] cursor-pointer group transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center">
              <FileCode className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--text)] group-hover:text-white">Start learning</p>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Flashcards · lesson · code notes · challenge · quiz · {estimatedMinutes} min
              </p>
              <div className="flex items-center gap-2 mt-2">
                <ProgressBar value={entry?.mastery ?? 0} className="flex-1 max-w-[200px]" />
                {(entry?.quizPassed && entry?.challengeDone) || cleared ? (
                  <Badge variant="success">Cleared</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </Link>

        {fileRefs.length > 0 && (
          <div className="mt-4 panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Source files
            </p>
            <ul className="space-y-1">
              {fileRefs.map((ref) => (
                <li key={ref} className="text-xs font-[family-name:var(--font-jetbrains)] text-[var(--text-secondary)]">{ref}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
