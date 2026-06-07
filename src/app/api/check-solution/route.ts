import { NextRequest, NextResponse } from "next/server";

function scoreSolution(code: string, mode: string): { passed: boolean; feedback: string; suggestions?: string[] } {
  const n = code.toLowerCase().replace(/\s+/g, " ").trim();

  if (n.length < 8 || n.includes("hello world")) {
    return {
      passed: false,
      feedback: "That doesn't address the problem. The challenge asks you to check if a token was issued more than 12 hours ago.",
      suggestions: ["Compare decoded.iat against current time", "Use a 12-hour threshold (43200 seconds)"],
    };
  }

  const hasIat = /iat|issued|timestamp|epoch/.test(n);
  const hasThreshold = /12|43200|hour|twelve/.test(n);
  const hasComparison = /[<>]=?|subtract|-/.test(n) || n.includes("age") || n.includes("diff");
  const hasReturn = /return|true|false/.test(n);

  if (mode === "pseudocode") {
    if (hasIat && hasThreshold) {
      return { passed: true, feedback: "Your pseudocode captures the right logic: compare token age to a 12-hour window." };
    }
    return {
      passed: false,
      feedback: "Include the issued-at time (iat) and a 12-hour comparison in your pseudocode.",
      suggestions: ["Get current time", "Subtract iat from now", "Return true if difference > 12 hours"],
    };
  }

  const score = [hasIat, hasThreshold, hasComparison, hasReturn].filter(Boolean).length;

  if (score >= 3) {
    return { passed: true, feedback: "Correct! Your solution properly checks token age against the 12-hour refresh window." };
  }

  if (score === 2) {
    return {
      passed: false,
      feedback: "Close — you're missing a piece of the logic.",
      suggestions: [
        "const now = Math.floor(Date.now() / 1000)",
        "return (now - decoded.iat) > 12 * 60 * 60",
      ],
    };
  }

  return {
    passed: false,
    feedback: "Not quite. You need to compare the token's iat timestamp against a 12-hour threshold.",
    suggestions: ["Access decoded.iat", "Calculate age in seconds", "Return boolean"],
  };
}

export async function POST(req: NextRequest) {
  const { mode, code, challenge } = await req.json();
  const result = scoreSolution(code ?? "", mode ?? "code");
  return NextResponse.json({ ...result, challenge });
}
