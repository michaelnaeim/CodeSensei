"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Settings } from "lucide-react";
import { AppHeader, BottomProgress } from "@/components/app-shell";
import { SummaryTab } from "@/components/repo/summary-tab";
import { ArchitectureTab } from "@/components/repo/architecture-tab";
import { KnowledgeMapTab } from "@/components/repo/knowledge-map-tab";
import {
  getRepo,
  getTopics,
  removeRecentRepo,
  saveRecentRepo,
  type BackendRepo,
  type BackendTopic,
} from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "summary", label: "Summary", icon: "📋" },
  { id: "architecture", label: "Architecture", icon: "🏗" },
  { id: "knowledge", label: "Knowledge Map", icon: "🧠" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.repoId as string;
  const { setDemoUser, user } = useAppStore();
  const [repo, setRepo] = useState<BackendRepo | null>(null);
  const [topics, setTopics] = useState<BackendTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("summary");

  useEffect(() => {
    if (!user) setDemoUser();
  }, [user, setDemoUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repoData = await getRepo(repoId);
        if (cancelled) return;
        setRepo(repoData);

        if (repoData.status === "ready") {
          saveRecentRepo(repoData);
          const topicsData = await getTopics(repoId);
          if (!cancelled) setTopics(topicsData);
        } else if (["pending", "indexing", "generating"].includes(repoData.status)) {
          setPolling(true);
        } else if (repoData.status === "failed") {
          setError(repoData.error_message ?? "Indexing failed");
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load";
          if (msg.includes("not found") || msg.includes("404")) {
            removeRecentRepo(repoId);
            setError("Repository not found. It may have been removed — try adding it again.");
          } else {
            setError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoId]);

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const data = await getRepo(repoId);
        if (cancelled) return;
        setRepo(data);
        if (data.status === "ready") {
          setPolling(false);
          saveRecentRepo(data);
          const topicsData = await getTopics(repoId);
          if (!cancelled) setTopics(topicsData);
        } else if (data.status === "failed") {
          setPolling(false);
          setError(data.error_message ?? "Indexing failed");
        }
      } catch { /* retry */ }
    }, 1500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [polling, repoId]);

  const handleStartLesson = useCallback((topicId: string) => {
    router.push(`/repos/${repoId}/${topicId}`);
  }, [router, repoId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] gap-3">
        <p className="text-[var(--error)]">{error}</p>
        <button onClick={() => router.push("/dashboard")} className="text-sm text-[var(--accent)] hover:underline cursor-pointer">
          Back to dashboard
        </button>
      </div>
    );
  }

  const repoName = repo ? `${repo.owner}/${repo.name}` : "";

  const statusMessage =
    repo?.status === "generating"
      ? "Generating lessons…"
      : repo?.status === "indexing"
      ? "Analyzing architecture…"
      : "Preparing knowledge map…";

  if (polling) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <AppHeader repoName={repoName} backHref="/dashboard" />
        <div className="flex flex-col items-center justify-center pt-32 gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          <p className="text-sm text-[var(--text)]">{statusMessage}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {repoName} · {repo?.status}
          </p>
          <p className="text-xs text-[var(--text-muted)]">This may take a minute for large repos</p>
        </div>
      </div>
    );
  }

  const explored = topics.filter((t) => t.challenge_passed || t.quiz_passed).length;
  const mastered = topics.filter((t) => t.cleared).length;
  const fileTree = repo?.file_tree ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <AppHeader repoName={repoName} backHref="/dashboard" />

      <div className="flex items-center justify-center gap-2 py-2 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors border",
              activeTab === tab.id
                ? "bg-[var(--bg-surface)] text-[var(--text)] border-[var(--border)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)] border-transparent"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
        <Link
          href="/settings"
          className="ml-4 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col min-h-0 pb-10">
        {activeTab === "summary" && (
          <SummaryTab
            repoName={repoName}
            description={`Learn from ${repoName} — ${topics.length} topics extracted from the codebase. Explore the architecture, understand data flows, and master each concept through guided lessons.`}
            techStack={repo?.language_mix ? Object.keys(repo.language_mix) : []}
            topicCount={topics.length}
            usage={repo?.usage ?? { unique_visitors: 0, total_views: 0 }}
            onSwitchToArchitecture={() => setActiveTab("architecture")}
            onSwitchToKnowledgeMap={() => setActiveTab("knowledge")}
          />
        )}
        {activeTab === "architecture" && (
          <ArchitectureTab topics={topics} fileTree={fileTree as string[]} />
        )}
        {activeTab === "knowledge" && (
          <KnowledgeMapTab
            topics={topics}
            repoId={repoId}
            techCount={
              repo?.language_mix
                ? Object.keys(repo.language_mix).length
                : new Set(topics.flatMap((t) => t.file_refs.map((f) => f.split(".").pop()))).size
            }
            onStartLesson={handleStartLesson}
          />
        )}
      </div>

      <BottomProgress explored={explored} mastered={mastered} />
    </div>
  );
}
