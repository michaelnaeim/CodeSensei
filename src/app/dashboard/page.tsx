"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GitBranch, Loader2, Lock, Search, Star } from "lucide-react";
import { AppHeader, MasteryRing } from "@/components/app-shell";
import { Card, ProgressBar, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_REPOS, getSpecializations } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, getTopicMastery } = useAppStore();
  const [repoInput, setRepoInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !user) router.push("/");
  }, [mounted, status, user, router]);

  const handleAnalyze = async () => {
    if (!repoInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoInput }),
      });
      const data = await res.json();
      if (data.repoId) router.push(`/repos/${data.repoId}`);
    } finally {
      setAnalyzing(false);
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

  const totalMastery = Math.round(
    DEMO_REPOS.reduce((acc, repo) => {
      const specs = getSpecializations(repo.id);
      return acc + specs.reduce((s, sp) => s + getTopicMastery(repo.id, sp.id), 0) / (specs.length || 1);
    }, 0) / DEMO_REPOS.length
  );

  return (
    <>
      <AppHeader />
      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-space)] text-2xl font-bold">Your repositories</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Select a repo or paste any public GitHub URL to generate a curriculum
            </p>
          </div>
          <MasteryRing value={totalMastery} size={52} />
        </div>

        <div className="panel p-4 mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="https://github.com/chromium/chromium or owner/repo"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
            Analyze
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {DEMO_REPOS.map((repo) => {
            const specs = getSpecializations(repo.id);
            const mastery = Math.round(
              specs.reduce((s, sp) => s + getTopicMastery(repo.id, sp.id), 0) / (specs.length || 1)
            );

            return (
              <Link key={repo.id} href={`/repos/${repo.id}`}>
                <Card className="h-full hover:border-[var(--accent)]/40 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">{repo.fullName}</p>
                      <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors">
                        {repo.name}
                      </h3>
                    </div>
                    {repo.isPrivate ? (
                      <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                    ) : (
                      <Star className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{repo.description}</p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="info">{repo.language}</Badge>
                    <Badge variant="default">{specs.length} topics</Badge>
                  </div>
                  <ProgressBar value={mastery} />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{mastery}% mastery</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
