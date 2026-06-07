"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Loader2, Settings } from "lucide-react";
import { AppHeader } from "@/components/app-shell";
import { RepoUsageBadge } from "@/components/repo-usage";
import {
  createRepo,
  listRepos,
  syncRecentRepos,
  type BackendRepo,
} from "@/lib/api";
import { reposForGoals } from "@/lib/recommended-repos";
import { useAppStore } from "@/lib/store";

const LOADING_MESSAGES = [
  "Analyzing architecture…",
  "Mapping specializations…",
  "Generating curriculum…",
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, setDemoUser, learningGoals } = useAppStore();
  const [repoInput, setRepoInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error, setError] = useState("");
  const [repos, setRepos] = useState<BackendRepo[]>([]);
  const [mounted, setMounted] = useState(false);

  const recommended = reposForGoals(learningGoals);

  useEffect(() => setMounted(true), []);
  const loadRepos = async () => {
    await syncRecentRepos();
    const remote = await listRepos();
    setRepos(remote);
  };

  useEffect(() => {
    if (!mounted) return;
    loadRepos().catch(() => {});
  }, [mounted]);

  useEffect(() => {
    if (!analyzing) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 2200);
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleAnalyze = async (url: string) => {
    const input = url.trim();
    if (!input) return;
    setAnalyzing(true);
    setError("");
    if (!user) setDemoUser();
    try {
      const ghUrl = input.includes("github.com") ? input : `https://github.com/${input}`;
      const repo = await createRepo(ghUrl);
      router.push(`/repos/${repo.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze repository");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-5 pt-12 pb-20">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl tracking-tight mb-2">
              your repositories
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              paste any public github URL to generate a curriculum
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/usage"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-2 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              usage
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-2 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              settings
            </Link>
          </div>
        </div>

        <div className="panel p-4 mb-6 flex gap-3">
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze(repoInput)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] font-[family-name:var(--font-jetbrains)]"
          />
          <button
            onClick={() => handleAnalyze(repoInput)}
            disabled={analyzing}
            className="px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "add"}
          </button>
        </div>

        {analyzing && (
          <p className="text-sm text-[var(--accent)] mb-4 loading-shimmer rounded px-3 py-2">
            {loadingMsg}
          </p>
        )}

        {error && <p className="text-sm text-[var(--error)] mb-4">{error}</p>}

        {repos.length > 0 && (
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              your repositories
            </p>
            <div className="space-y-2">
              {repos.map((repo) => (
                <Link key={repo.id} href={`/repos/${repo.id}`}>
                  <div className="panel p-4 flex items-center justify-between hover:border-[var(--border-strong)] transition-colors cursor-pointer group">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)] group-hover:text-white">
                        {repo.owner}/{repo.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {repo.status === "ready"
                          ? `${repo.topic_count} topics · ready`
                          : repo.status === "failed"
                          ? "indexing failed"
                          : `${repo.status}…`}
                      </p>
                      <div className="mt-1">
                        <RepoUsageBadge usage={repo.usage ?? { unique_visitors: 0, total_views: 0 }} compact />
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          recommended for your goals
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {recommended.map((repo) => (
            <button
              key={repo.name}
              onClick={() => handleAnalyze(repo.name)}
              disabled={analyzing}
              className="text-left panel p-4 hover:border-[var(--border-strong)] transition-colors cursor-pointer group disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[var(--text)] group-hover:text-white transition-colors">
                  {repo.name}
                </p>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">
                {repo.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {repo.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {repos.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] mt-6 text-center">
            no repositories yet — pick a recommendation above or paste a URL
          </p>
        )}
      </main>
    </div>
  );
}
