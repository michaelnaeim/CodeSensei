"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-shell";
import { createRepo, pollRepoUntilReady, saveRecentRepo } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const SUGGESTED_REPOS = [
  {
    name: "alan2207/bulletproof-react",
    description: "The definitive React architecture reference. Learn how to structure a large-scale app the...",
    tags: ["clean-architecture", "state-management", "testing"],
    language: "TypeScript",
    langColor: "#3178c6",
  },
  {
    name: "tiangolo/fastapi",
    description: "The FastAPI framework source. Clean Python with dependency injection, type annotations...",
    tags: ["api-design", "async", "type-safety"],
    language: "Python",
    langColor: "#3572a5",
  },
  {
    name: "openai/openai-python",
    description: "The official OpenAI Python client. Clean, modern SDK architecture with async suppor...",
    tags: ["api-design", "async", "type-safety"],
    language: "Python",
    langColor: "#3572a5",
  },
  {
    name: "fastapi/full-stack-fastapi-template",
    description: "The canonical FastAPI production template by the framework's creator. Auth, Docker,...",
    tags: ["auth", "docker", "database"],
    language: "Python",
    langColor: "#3572a5",
  },
  {
    name: "TheAlgorithms/Python",
    description: "The broadest open-source algorithms library. Organized by topic, 180k stars.",
    tags: ["algorithms", "data-structures"],
    language: "Python",
    langColor: "#3572a5",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { setDemoUser } = useAppStore();
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async (url: string) => {
    const input = url.trim();
    if (!input) return;
    setLoading(true);
    setError("");
    setDemoUser();
    try {
      const ghUrl = input.includes("github.com") ? input : `https://github.com/${input}`;
      const repo = await createRepo(ghUrl);
      saveRecentRepo(repo);
      router.push(`/repos/${repo.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-32">
        <h1 className="font-[family-name:var(--font-jetbrains)] text-3xl md:text-4xl tracking-tight mb-3">
          explore a repo
        </h1>
        <p className="text-[var(--text-muted)] text-base mb-10">
          paste a public github repo link to browse its structure and summaries
        </p>

        <div className="panel p-6 mb-12">
          <p className="text-xs text-[var(--text-muted)] mb-2">explore any public github repo</p>
          <div className="flex gap-3">
            <input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze(repoInput)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] font-[family-name:var(--font-jetbrains)]"
            />
            <button
              onClick={() => analyze(repoInput)}
              disabled={loading}
              className="px-4 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "add"}
            </button>
          </div>
          {error && <p className="text-sm text-[var(--error)] mt-2">{error}</p>}
        </div>

        <p className="text-[var(--text-muted)] text-sm mb-5">not sure where to start? try one of these</p>

        <div className="grid md:grid-cols-3 gap-3">
          {SUGGESTED_REPOS.map((repo) => (
            <button
              key={repo.name}
              onClick={() => analyze(repo.name)}
              className="text-left panel p-4 hover:border-[var(--border-strong)] transition-colors cursor-pointer group"
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
              <div className="flex flex-wrap gap-1.5 mb-3">
                {repo.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              <div className="flex items-center text-xs text-[var(--text-muted)]">
                <span className="lang-dot" style={{ backgroundColor: repo.langColor }} />
                {repo.language}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
