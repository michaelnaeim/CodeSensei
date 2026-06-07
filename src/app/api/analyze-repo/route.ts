import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  try {
    const res = await fetch(`${API_BASE}/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? "Failed to analyze repo" }, { status: res.status });
    }

    const repo = await res.json();
    return NextResponse.json({ repoId: repo.id, name: `${repo.owner}/${repo.name}` });
  } catch {
    return NextResponse.json({ error: "Backend unavailable. Is the API running on port 8000?" }, { status: 503 });
  }
}
