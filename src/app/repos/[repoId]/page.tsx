"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Key, Layers, Lock, Route, Shield, Zap } from "lucide-react";
import { AppHeader, Breadcrumbs, MasteryRing } from "@/components/app-shell";
import { Card, ProgressBar, Badge } from "@/components/ui/card";
import { getRepo, getSpecializations } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";

const ICONS: Record<string, typeof Shield> = {
  shield: Shield, lock: Lock, key: Key, layers: Layers, route: Route, zap: Zap,
};

export default function RepoPage() {
  const params = useParams();
  const repoId = params.repoId as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, getTopicMastery } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && status === "unauthenticated" && !user) router.push("/");
  }, [mounted, status, user, router]);

  const repo = getRepo(repoId);
  const specializations = getSpecializations(repoId);

  if (!repo) {
    return <div className="min-h-screen flex items-center justify-center">Repository not found</div>;
  }

  const repoMastery = Math.round(
    specializations.reduce((s, sp) => s + getTopicMastery(repoId, sp.id), 0) /
      (specializations.length || 1)
  );

  return (
    <>
      <AppHeader />
      <main className="max-w-4xl mx-auto px-5 py-8">
        <Breadcrumbs
          items={[
            { label: "Repos", href: "/dashboard" },
            { label: repo.name },
          ]}
        />

        <div className="flex items-start justify-between mt-4 mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-space)] text-2xl font-bold">{repo.fullName}</h1>
            <p className="text-[var(--text-secondary)] mt-1">{repo.description}</p>
            <div className="flex gap-2 mt-3">
              <Badge variant="info">{repo.language}</Badge>
              {repo.isPrivate && <Badge variant="warning">Private</Badge>}
            </div>
          </div>
          <MasteryRing value={repoMastery} />
        </div>

        <h2 className="font-semibold mb-1">Specializations</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Pick a topic to start learning from real source files in this codebase.
        </p>

        <div className="grid gap-3">
          {specializations.map((spec) => {
            const Icon = ICONS[spec.icon] ?? Shield;
            const mastery = getTopicMastery(repoId, spec.id);
            const hasContent = spec.id === "authentication";

            return (
              <Link
                key={spec.id}
                href={hasContent ? `/repos/${repoId}/${spec.id}` : "#"}
                className={!hasContent ? "pointer-events-none opacity-45" : ""}
              >
                <Card className="flex items-center gap-4 hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{spec.title}</h3>
                      {!hasContent && <Badge>Coming soon</Badge>}
                      {mastery >= 70 && <Badge variant="success">Cleared</Badge>}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{spec.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[var(--text-muted)]">{spec.fileCount} files</span>
                      <ProgressBar value={mastery} className="flex-1 max-w-[180px]" />
                      <span className="text-xs font-medium text-[var(--accent)]">{mastery}%</span>
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
