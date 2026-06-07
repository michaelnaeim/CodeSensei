"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppHeader({ repoName, backHref }: { repoName?: string; backHref?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { user } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-5 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <Link href="/dashboard" className="font-[family-name:var(--font-jetbrains)] text-[14px] tracking-tight text-[var(--text)]">
            codesensei
          </Link>
          {repoName && (
            <>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[14px] text-[var(--text-secondary)]">
                {repoName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mounted && (session || user) ? (
            <span className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-md px-2 py-1">
              Guest
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-md px-2 py-1">
              Guest
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export function MasteryRing({ value, size = 44 }: { value: number; size?: number }) {
  return (
    <div
      className="mastery-ring rounded-full flex items-center justify-center shrink-0"
      style={{ "--pct": value, width: size, height: size } as React.CSSProperties}
    >
      <div
        className="rounded-full bg-[var(--bg-surface)] flex items-center justify-center font-semibold text-xs text-[var(--text)]"
        style={{ width: size - 8, height: size - 8 }}
      >
        {value}%
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] flex-wrap">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--accent)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text-secondary)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function StepTabs({
  steps,
  active,
  onChange,
  completed,
}: {
  steps: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  completed: Record<string, boolean>;
}) {
  return (
    <div className="flex gap-1 p-1 panel-inset overflow-x-auto">
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => onChange(step.id)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer border border-transparent",
            active === step.id
              ? "step-tab-active"
              : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)]"
          )}
        >
          {step.label}
          {completed[step.id] && <span className="ml-1.5 text-[var(--success)]">✓</span>}
        </button>
      ))}
    </div>
  );
}

export function BottomProgress({ explored, mastered }: { explored: number; mastered: number }) {
  return (
    <div className="progress-bottom">
      <span>PROGRESS</span>
      <span className="ml-3 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[var(--warning)]" />
        {explored} explored
      </span>
      <span className="ml-3 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
        {mastered} mastered
      </span>
      <div className="progress-bottom-bar">
        <div className="progress-bottom-fill" style={{ width: `${mastered * 10}%` }} />
      </div>
    </div>
  );
}
