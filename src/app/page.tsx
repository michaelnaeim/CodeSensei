"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Brain, Code2, GitBranch, Layers, Shield } from "lucide-react";
import { AppHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const setDemoUser = useAppStore((s) => s.setDemoUser);

  return (
    <>
      <AppHeader />
      <main>
        <section className="max-w-4xl mx-auto px-5 pt-16 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm font-medium text-[var(--accent)] mb-4">
              Codebase-driven learning
            </p>
            <h1 className="font-[family-name:var(--font-space)] text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              AI makes you <span className="text-[var(--fast)]">fast</span>.
              <br />
              CodeSensi makes you <span className="text-[var(--good)]">good</span>.
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect any GitHub repo — private or public — and get lesson plans, flashcards,
              line-by-line notes, coding challenges, and mastery quizzes built from real source code.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => signIn("github", { callbackUrl: "/dashboard" })}>
                <GitBranch className="w-4 h-4" />
                Sign in with GitHub
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setDemoUser();
                  window.location.href = "/dashboard";
                }}
              >
                Try demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16 panel p-1 text-left max-w-3xl mx-auto shadow-lg"
          >
            <div className="rounded-[10px] overflow-hidden border border-[var(--border)]">
              <div className="px-4 py-2.5 bg-[var(--bg-muted)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] font-mono">
                chromium / authentication / oauth_token_validator.cc
              </div>
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)] mb-3">
                    What you&apos;ll learn
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <li>• OAuth2 token validation flow</li>
                    <li>• Bearer header parsing</li>
                    <li>• Fail-closed security patterns</li>
                  </ul>
                </div>
                <div className="p-5 bg-[var(--bg-code)] text-[var(--bg-muted)] font-mono text-[11px] leading-relaxed">
                  <span className="text-violet-400">bool</span> ValidateToken(
                  <span className="text-sky-300">const</span> Token&amp; t) {"{"}
                  <br />
                  <span className="text-zinc-500">  // L42: expiry check</span>
                  <br />
                  {"  "}<span className="text-violet-400">if</span> (t.IsExpired()) <span className="text-violet-400">return</span> false;
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-16 px-5">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              { icon: GitBranch, title: "Any repo", desc: "Private repos or public giants like Chromium" },
              { icon: Layers, title: "Specializations", desc: "Authentication, OAuth, middleware — auto-mapped" },
              { icon: BookOpen, title: "Per-file lessons", desc: "Objectives + source code side by side" },
              { icon: Code2, title: "Line notes", desc: "Understand code line by line" },
              { icon: Brain, title: "Challenges", desc: "LeetCode-style with pseudocode mode" },
              { icon: Shield, title: "Mastery quiz", desc: "Track comprehension and clear modules" },
            ].map((f) => (
              <div key={f.title} className="panel p-5">
                <f.icon className="w-5 h-5 text-[var(--accent)] mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="flow" className="py-16 px-5 max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-space)] text-2xl font-bold mb-8">
            Learn → Practice → Prove
          </h2>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            {["Flashcards", "Lesson plan", "Source code", "Challenge", "Official quiz"].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span className="panel-inset px-3 py-1.5 font-medium">{s}</span>
                {i < 4 && <span className="text-[var(--text-muted)]">→</span>}
              </span>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
