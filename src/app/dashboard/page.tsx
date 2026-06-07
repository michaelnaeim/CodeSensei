"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-shell";
import {
  createRepo,
  getRecentRepos,
  saveRecentRepo,
  type RecentRepo,
} from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, setDemoUser } = useAppStore();
  const [repoInput, setRepoInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted) setRecentRepos(getRecentRepos());
  }, [mounted]);

  const handleAnalyze = async () => {
    const input = repoInput.trim();
    if (!input) return;
    setAnalyzing(true);
    setError("");
    if (!user) setDemoUser();
    try {
      const ghUrl = input.includes("github.com") ? input : `https://github.com/${input}`;
      const repo = await createRepo(ghUrl);
      saveRecentRepo(repo);
      setRecentRepos(getRecentRepos());
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
        <h1 className="font-[family-name:var(--font-jetbrains)] text-2xl tracking-tight mb-2">
          your repos
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          paste any public github URL to generate a curriculum
        </p>

        <div className="panel p-4 mb-6 flex gap-3">
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/owner/repo"
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] font-[family-name:var(--font-jetbrains)]"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "add"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-[var(--error)] mb-4">{error}</p>
        )}

        {recentRepos.length === 0 ? (
          <div className="panel p-12 text-center text-[var(--text-muted)]">
            <p>no repositories yet. paste a github URL above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRepos.map((repo) => (
              <Link key={repo.id} href={`/repos/${repo.id}`}>
                <div className="panel p-4 flex items-center justify-between hover:border-[var(--border-strong)] transition-colors cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)] group-hover:text-white">
                      {repo.owner}/{repo.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      analyzed {new Date(repo.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
