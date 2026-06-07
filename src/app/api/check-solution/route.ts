import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function POST(req: NextRequest) {
  const { topicId, mode, code, sessionId } = await req.json();

  if (!topicId) {
    return NextResponse.json({ error: "topicId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/topics/${topicId}/challenge/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId ? { "X-Session-Id": sessionId } : {}),
      },
      body: JSON.stringify({ submission: code ?? "", mode: mode ?? "code" }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail ?? "Grading failed" }, { status: res.status });
    }

    return NextResponse.json({
      passed: data.passed,
      feedback: data.feedback,
      score: data.score,
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
