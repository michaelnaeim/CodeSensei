const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const SESSION_KEY = "codesensei-session-id";
const RECENT_REPOS_KEY = "codesensei-recent-repos";

export interface BackendRepo {
  id: string;
  url: string;
  owner: string;
  name: string;
  status: "pending" | "indexing" | "generating" | "ready" | "failed";
  error_message: string | null;
  topic_count: number;
  created_at: string;
  updated_at: string;
}

export interface BackendTopic {
  id: string;
  title: string;
  description: string;
  order: number;
  difficulty: string;
  estimated_minutes: number;
  file_refs: string[];
  content_status: string;
  challenge_passed: boolean;
  quiz_passed: boolean;
  cleared: boolean;
}

export interface BackendTopicDetail {
  id: string;
  title: string;
  description: string;
  order: number;
  difficulty: string;
  estimated_minutes: number;
  lesson: string;
  flashcards: { front: string; back: string }[];
  file_refs: string[];
  challenge_passed: boolean;
  quiz_passed: boolean;
  cleared: boolean;
}

export interface BackendAnnotatedFile {
  file_path: string;
  language: string;
  content: string;
  annotations: {
    file_path: string;
    start_line: number;
    end_line: number;
    note: string;
    code_snippet: string;
  }[];
}

export interface BackendChallenge {
  topic_id: string;
  title: string;
  prompt: string;
  starter_code: string;
  supports_pseudocode: boolean;
  examples: { input: string; output: string }[];
}

export interface BackendQuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options: string[] | null;
}

export interface RecentRepo {
  id: string;
  url: string;
  owner: string;
  name: string;
  analyzedAt: string;
}

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const sessionId = getSessionId();
  if (sessionId) h["X-Session-Id"] = sessionId;
  return h;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers(), ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export async function ensureSession(): Promise<string> {
  const existing = getSessionId();
  if (existing) return existing;
  const data = await request<{ session_id: string }>("/session", { method: "POST" });
  setSessionId(data.session_id);
  return data.session_id;
}

export function getRecentRepos(): RecentRepo[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_REPOS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecentRepo(repo: BackendRepo) {
  const recent = getRecentRepos().filter((r) => r.id !== repo.id);
  recent.unshift({
    id: repo.id,
    url: repo.url,
    owner: repo.owner,
    name: repo.name,
    analyzedAt: new Date().toISOString(),
  });
  localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(recent.slice(0, 20)));
}

export async function createRepo(url: string): Promise<BackendRepo> {
  await ensureSession();
  return request<BackendRepo>("/repos", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function getRepo(repoId: string): Promise<BackendRepo> {
  return request<BackendRepo>(`/repos/${repoId}`);
}

export async function pollRepoUntilReady(
  repoId: string,
  onStatus?: (status: string) => void,
  intervalMs = 2000,
  maxAttempts = 90
): Promise<BackendRepo> {
  for (let i = 0; i < maxAttempts; i++) {
    const repo = await getRepo(repoId);
    onStatus?.(repo.status);
    if (repo.status === "ready") return repo;
    if (repo.status === "failed") {
      throw new Error(repo.error_message ?? "Repository indexing failed");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Indexing timed out. Try again in a moment.");
}

export async function getTopics(repoId: string): Promise<BackendTopic[]> {
  const data = await request<{ topics: BackendTopic[] }>(`/repos/${repoId}/topics`);
  return data.topics;
}

export async function getTopicDetail(topicId: string): Promise<BackendTopicDetail> {
  return request<BackendTopicDetail>(`/topics/${topicId}`);
}

export async function getTopicCode(topicId: string): Promise<BackendAnnotatedFile[]> {
  const data = await request<{ files: BackendAnnotatedFile[] }>(`/topics/${topicId}/code`);
  return data.files;
}

export async function getChallenge(topicId: string): Promise<BackendChallenge> {
  return request<BackendChallenge>(`/topics/${topicId}/challenge`);
}

export async function submitChallenge(
  topicId: string,
  submission: string,
  mode: "code" | "pseudocode"
) {
  await ensureSession();
  return request<{
    passed: boolean;
    score: number;
    feedback: string;
    cleared: boolean;
  }>(`/topics/${topicId}/challenge/submit`, {
    method: "POST",
    body: JSON.stringify({ submission, mode }),
  });
}

export async function getQuiz(topicId: string) {
  return request<{ topic_id: string; title: string; questions: BackendQuizQuestion[] }>(
    `/topics/${topicId}/quiz`
  );
}

export async function submitQuiz(topicId: string, answers: Record<string, string>) {
  await ensureSession();
  return request<{
    passed: boolean;
    score: number;
    feedback: string;
    results: {
      question_id: string;
      correct: boolean;
      submitted: string;
      expected: string;
      explanation: string;
    }[];
    cleared: boolean;
  }>(`/topics/${topicId}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
