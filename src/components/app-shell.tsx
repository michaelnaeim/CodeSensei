"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { GitBranch, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();
  const isApp = pathname.startsWith("/dashboard") || pathname.startsWith("/repos") || pathname.startsWith("/learn");
  const { data: session } = useSession();
  const { user, setDemoUser, signOut, isDemo } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLoggedIn = mounted && (!!session || !!user);
  const displayName = session?.user?.name ?? user?.name;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-[family-name:var(--font-space)] font-semibold text-[15px] tracking-tight">
            CodeSensi
          </span>
        </Link>

        {!isApp && (
          <nav className="hidden md:flex gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text)]">Features</a>
            <a href="#flow" className="hover:text-[var(--text)]">How it works</a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {mounted && isLoggedIn ? (
            <>
              {displayName && (
                <span className="hidden sm:block text-sm text-[var(--text-secondary)] mr-1">
                  {displayName.split(" ")[0]}
                  {isDemo && " · demo"}
                </span>
              )}
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">Repos</Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  window.location.href = "/";
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : mounted ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => { setDemoUser(); window.location.href = "/dashboard"; }}>
                Try demo
              </Button>
              <Button variant="primary" size="sm" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
                <GitBranch className="w-4 h-4" />
                Sign in
              </Button>
            </>
          ) : (
            <div className="w-24 h-8" />
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
        className="rounded-full bg-[var(--bg-surface)] flex items-center justify-center font-semibold text-xs"
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
              : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white"
          )}
        >
          {step.label}
          {completed[step.id] && <span className="ml-1.5 text-[var(--success)]">✓</span>}
        </button>
      ))}
    </div>
  );
}
