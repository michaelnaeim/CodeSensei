"use client";

import { ArrowRight } from "lucide-react";
import { RepoUsageBadge } from "@/components/repo-usage";
import type { RepoUsageStats } from "@/lib/api";

interface SummaryTabProps {
  repoName: string;
  description: string;
  techStack: string[];
  topicCount: number;
  usage: RepoUsageStats;
  onSwitchToArchitecture: () => void;
  onSwitchToKnowledgeMap: () => void;
}

export function SummaryTab({
  repoName,
  description,
  techStack,
  topicCount,
  usage,
  onSwitchToArchitecture,
  onSwitchToKnowledgeMap,
}: SummaryTabProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-5 space-y-8">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-jetbrains)] text-2xl mb-2">{repoName}</h2>
        <p className="text-sm text-[var(--text-muted)]">System Overview</p>
        <div className="flex justify-center mt-3">
          <RepoUsageBadge usage={usage} />
        </div>
      </div>

      <div className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">About</p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </div>

      {techStack.length > 0 && (
        <div className="panel p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span key={tech} className="tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      <div className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">Architecture Views</p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { title: "Component Hierarchy", desc: `${topicCount} topics`, onClick: onSwitchToArchitecture },
            { title: "Data Flow", desc: `${topicCount} topics`, onClick: onSwitchToArchitecture },
            { title: "Dependencies", desc: `${topicCount} topics`, onClick: onSwitchToArchitecture },
            { title: "Knowledge Map", desc: `${topicCount} concepts`, onClick: onSwitchToKnowledgeMap },
          ].map((view) => (
            <button
              key={view.title}
              onClick={view.onClick}
              className="text-left p-4 rounded-lg border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors cursor-pointer group bg-[var(--bg)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{view.title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{view.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
