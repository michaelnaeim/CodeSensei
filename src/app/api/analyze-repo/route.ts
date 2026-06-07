import { NextRequest, NextResponse } from "next/server";
import { DEMO_REPOS } from "@/lib/demo-data";

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const raw = (url ?? "").trim().toLowerCase();

  // Match known demo repos
  for (const repo of DEMO_REPOS) {
    if (
      raw.includes(repo.fullName.toLowerCase()) ||
      raw === repo.id ||
      raw.endsWith(`/${repo.name}`)
    ) {
      return NextResponse.json({ repoId: repo.id, name: repo.fullName });
    }
  }

  // Parse owner/repo from URL
  const match = raw.match(/(?:github\.com\/|^)([\w.-]+)\/([\w.-]+)/);
  if (match) {
    const [, owner, name] = match;
    // Map common public repos to demo content
    const mapped = DEMO_REPOS.find(
      (r) => r.owner === owner && r.name === name.replace(/\.git$/, "")
    );
    if (mapped) return NextResponse.json({ repoId: mapped.id });

    // For unknown public repos, route to chromium demo (simulated analysis)
    return NextResponse.json({
      repoId: "chromium",
      name: `${owner}/${name}`,
      simulated: true,
      message: "Demo mode: showing sample curriculum structure for this repo type",
    });
  }

  return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
}
