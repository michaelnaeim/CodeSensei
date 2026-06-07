"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, GitBranch, Loader2, Search } from "lucide-react";
import { AppHeader, MasteryRing } from "@/components/app-shell";
import { Card, ProgressBar, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  createRepo,
  getRecentRepos,
  pollRepoUntilReady,
  saveRecentRepo,
  type RecentRepo,
} from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user } = useAppStore();
  const [repoInput, setRepoInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [indexStatus, setIndexStatus] = useState("");
  const [error, setError] = useState("");
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted) setRecentRepos(getRecentRepos());
  }, [mounted]);
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !user) router.push("/");
  }, [mounted, status, user, router]);

  const handleAnalyze = async () => {
    if (!repoInput.trim()) return;
    setAnalyzing(true);
    setError("");
    setIndexStatus("Starting analysis…");
    try {
      const repo = await createRepo(repoInput.trim());
      const ready = await pollRepoUntilReady(repo.id, setIndexStatus);
      saveRecentRepo(ready);
      setRecentRepos(getRecentRepos());
      router.push(`/repos/${ready.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze repository");
    } finally {
      setAnalyzing(false);
      setIndexStatus("");
    }
  };

  if (!mounted || (status === "loading" && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!session && !user) return null;

  return (
    <>
      <AppHeader />
      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-space)] text-2xl font-bold">Your repositories</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Paste any public GitHub URL to generate a curriculum
            </p>
          </div>
          <MasteryRing value={0} size={52} />
        </div>

        <div className="panel p-4 mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="https://github.com/fastapi/fastapi or owner/repo"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
            Analyze
          </Button>
        </div>

        {analyzing && indexStatus && (
          <p className="text-sm text-[var(--accent)] mb-4 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {indexStatus}
          </p>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--error-soft)] border border-red-200 flex gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0" />
            {error}
          </div>
        )}

        {recentRepos.length === 0 ? (
          <div className="panel p-10 text-center text-[var(--text-secondary)]">
            <p>No repositories yet. Paste a GitHub URL above to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recentRepos.map((repo) => (
              <Link key={repo.id} href={`/repos/${repo.id}`}>
                <Card className="h-full hover:border-[var(--accent)]/40 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">{repo.owner}/{repo.name}</p>
                      <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors">
                        {repo.name}
                      </h3>
                    </div>
                    <GitBranch className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                    Curriculum generated from real source code
                  </p>
                  <Badge variant="info">Public repo</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
