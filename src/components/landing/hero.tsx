"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useAppStore } from "@/lib/store";

export function Hero() {
  const setDemoUser = useAppStore((s) => s.setDemoUser);

  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent-good)]/5 blur-[120px] animate-pulse-glow pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)] mb-8"
        >
          <Sparkles className="w-4 h-4 text-[var(--accent-good)]" />
          Codebase-driven learning for the AI era
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-[family-name:var(--font-syne)] text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
        >
          AI makes you{" "}
          <span className="text-[var(--accent-fast)]">fast</span>.
          <br />
          CodeSensei makes you{" "}
          <span className="text-[var(--accent-good)]">good</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Turn any GitHub repository into a structured, interactive curriculum.
          Learn from real source code — not generic tutorials — and close the
          comprehension gap before technical debt compounds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="min-w-[220px]"
          >
            <Zap className="w-5 h-5" />
            Connect GitHub
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setDemoUser();
              window.location.href = "/dashboard";
            }}
          >
            Explore demo repo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 relative"
        >
          <div className="card-surface glow-orange p-1 max-w-3xl mx-auto">
            <div className="rounded-[12px] overflow-hidden bg-[var(--bg-deep)]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-[var(--text-muted)] ml-2 font-mono">
                  auth-service / authentication / jwt-middleware.ts
                </span>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6 text-left">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--accent-good)] mb-3 font-semibold">
                    Learning objectives
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <li className="flex gap-2">
                      <span className="text-[var(--accent-good)]">→</span>
                      JWT signing with secret keys
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--accent-good)]">→</span>
                      Bearer token extraction
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--accent-good)]">→</span>
                      Fail-closed auth middleware
                    </li>
                  </ul>
                </div>
                <div className="font-mono text-xs leading-relaxed text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
                  <span className="text-purple-400">export function</span>{" "}
                  <span className="text-[var(--accent-fast)]">authMiddleware</span>
                  (req, res, next) {"{"}
                  <br />
                  {"  "}
                  <span className="text-[var(--text-secondary)]">
                    // Line 28: Checks Bearer prefix
                  </span>
                  <br />
                  {"  "}
                  <span className="text-purple-400">if</span> (!header?.startsWith(
                  <span className="text-green-400">&apos;Bearer &apos;</span>)) {"{"}
                  <br />
                  {"    "}
                  <span className="text-purple-400">return</span> res.status(
                  <span className="text-orange-400">401</span>)...
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
