"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { GitBranch, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const { user, setDemoUser, signOut, isDemo } = useAppStore();
  const isLoggedIn = !!session || !!user;

  const handleSignIn = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

  const handleDemo = () => {
    setDemoUser();
    window.location.href = "/dashboard";
  };

  const handleSignOut = () => {
    signOut();
    if (session) signIn();
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--bg-deep)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-good)] to-[var(--accent-fast)] flex items-center justify-center text-black font-bold text-sm font-[family-name:var(--font-syne)]">
            CS
          </div>
          <span className="font-[family-name:var(--font-syne)] font-bold text-lg tracking-tight">
            Code<span className="text-[var(--accent-good)]">Sensei</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
          <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleDemo}>
                Try demo
              </Button>
              <Button variant="primary" size="sm" onClick={handleSignIn}>
                <GitBranch className="w-4 h-4" />
                Sign in with GitHub
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
