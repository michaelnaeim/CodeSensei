"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Code2,
  GitBranch,
  Layers,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "Any repo, any topic",
    description:
      "Connect private or public GitHub repos. CodeSensei maps specializations like authentication, routing, or middleware automatically.",
    color: "var(--accent-fast)",
  },
  {
    icon: BookOpen,
    title: "Lesson plans per file",
    description:
      "Each file becomes a structured lesson teaching the concepts it actually implements — with clear learning objectives.",
    color: "var(--accent-good)",
  },
  {
    icon: Sparkles,
    title: "Flashcards & line notes",
    description:
      "Concept flashcards plus line-by-line annotations explaining how real production code works.",
    color: "var(--accent-fast)",
  },
  {
    icon: Code2,
    title: "LeetCode-style challenges",
    description:
      "Practice with input/output problems derived from what you just learned. Pseudocode mode when syntax isn't the point.",
    color: "var(--accent-good)",
  },
  {
    icon: Brain,
    title: "AI solution checking",
    description:
      "Submit code or pseudocode and get instant feedback on whether your approach matches the intended solution.",
    color: "var(--accent-fast)",
  },
  {
    icon: Target,
    title: "Mastery tracking",
    description:
      "Self-quizzes and official module exams track your comprehension per topic — not just completion.",
    color: "var(--accent-good)",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[var(--accent-good)] text-sm font-semibold uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold mb-4">
            Everything you need to{" "}
            <span className="text-gradient">understand what you ship</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            From flashcards to final exams — a complete learning loop built from
            your actual codebase.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-surface p-6 hover:border-[var(--border-strong)] transition-colors group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `color-mix(in srgb, ${f.color} 15%, transparent)` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] font-semibold text-lg mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { num: "01", title: "Connect GitHub", desc: "Sign in and browse your private repos or explore any public repository.", icon: Shield },
    { num: "02", title: "Pick a specialization", desc: "Navigate topics like authentication, OAuth, or middleware within the repo.", icon: Layers },
    { num: "03", title: "Learn → Practice → Prove", desc: "Flashcards, lessons, code notes, challenges, and quizzes until you clear the module.", icon: Brain },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[var(--accent-fast)] text-sm font-semibold uppercase tracking-wider mb-3">
            How it works
          </p>
          <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-5xl font-bold">
            Real code. Real understanding.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <span className="font-[family-name:var(--font-syne)] text-6xl font-bold text-white/5 absolute -top-4 -left-1">
                {step.num}
              </span>
              <div className="relative pt-8">
                <step.icon className="w-8 h-8 text-[var(--accent-good)] mb-4" />
                <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 border-t border-[var(--border)]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-[family-name:var(--font-syne)] text-3xl md:text-4xl font-bold mb-4">
          Start learning for free
        </h2>
        <p className="text-[var(--text-secondary)] mb-10">
          Public repos are free. Pro unlocks private repos and team mastery dashboards.
        </p>
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div className="card-surface p-8">
            <p className="text-sm text-[var(--text-muted)] mb-1">Free</p>
            <p className="font-[family-name:var(--font-syne)] text-3xl font-bold mb-4">
              $0
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>✓ Public GitHub repos</li>
              <li>✓ Full learning flow</li>
              <li>✓ Mastery tracking</li>
            </ul>
          </div>
          <div className="card-surface p-8 border-[var(--accent-good)]/30 glow-orange">
            <p className="text-sm text-[var(--accent-good)] mb-1">Pro</p>
            <p className="font-[family-name:var(--font-syne)] text-3xl font-bold mb-4">
              $12<span className="text-lg text-[var(--text-muted)]">/mo</span>
            </p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>✓ Private repositories</li>
              <li>✓ AI solution checking</li>
              <li>✓ Team mastery dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-[family-name:var(--font-syne)] font-bold">
          Code<span className="text-[var(--accent-good)]">Sensei</span>
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          AI makes you fast. CodeSensei makes you good.
        </p>
      </div>
    </footer>
  );
}
