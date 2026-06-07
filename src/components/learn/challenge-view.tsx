"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import type { Challenge } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-48 loading-shimmer rounded-lg" />,
});

export function ChallengeView({ challenge, onComplete }: { challenge: Challenge; onComplete: () => void }) {
  const [mode, setMode] = useState<"code" | "pseudocode">("code");
  const [code, setCode] = useState(challenge.starterCode);
  const [pseudocode, setPseudocode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; feedback: string; suggestions?: string[] } | null>(null);

  const check = async () => {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/check-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: challenge.title,
          mode,
          code: mode === "code" ? code : pseudocode,
          expectedOutput: challenge.expectedOutput,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.passed) onComplete();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{challenge.title}</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{challenge.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="panel-inset p-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Input</p>
            <p className="text-sm font-mono">{challenge.input}</p>
          </div>
          <div className="panel-inset p-3 bg-[var(--success-soft)]">
            <p className="text-xs font-semibold text-[var(--success)] mb-1">Expected output</p>
            <p className="text-sm font-mono">{challenge.expectedOutput}</p>
          </div>
        </div>
        {result && (
          <div className={`p-4 rounded-lg border flex gap-3 ${result.passed ? "bg-[var(--success-soft)] border-green-200" : "bg-[var(--error-soft)] border-red-200"}`}>
            {result.passed ? <CheckCircle2 className="w-5 h-5 text-[var(--success)]" /> : <XCircle className="w-5 h-5 text-[var(--error)]" />}
            <div className="text-sm">
              <p className="font-medium">{result.passed ? "Accepted" : "Not suitable"}</p>
              <p className="text-[var(--text-secondary)] mt-1">{result.feedback}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("code")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer border ${mode === "code" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--border)]"}`}
          >
            Code
          </button>
          <button
            onClick={() => setMode("pseudocode")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium cursor-pointer border ${mode === "pseudocode" ? "bg-[var(--good)] text-white border-[var(--good)]" : "border-[var(--border)]"}`}
          >
            Pseudocode
          </button>
        </div>

        {mode === "code" ? (
          <div className="rounded-lg overflow-hidden border border-[var(--border)]">
            <MonacoEditor
              height="220px"
              language="typescript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 12 } }}
            />
          </div>
        ) : (
          <textarea
            value={pseudocode}
            onChange={(e) => setPseudocode(e.target.value)}
            placeholder={challenge.pseudocodeHint}
            className="w-full h-[220px] panel p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--good)]/30"
          />
        )}

        <Button className="w-full" onClick={check} disabled={checking}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Check solution
        </Button>
      </div>
    </div>
  );
}
