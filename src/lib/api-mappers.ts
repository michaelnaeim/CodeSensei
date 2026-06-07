import type {
  BackendAnnotatedFile,
  BackendChallenge,
  BackendQuizQuestion,
  BackendRepo,
  BackendTopic,
  BackendTopicDetail,
} from "@/lib/api";
import type { Challenge, CodeNote, Flashcard, QuizQuestion, Repo, Specialization, Topic, TopicFile } from "@/types";

const ICONS = ["shield", "layers", "route", "zap", "lock", "key"];

export function mapRepo(repo: BackendRepo): Repo {
  return {
    id: repo.id,
    name: repo.name,
    fullName: `${repo.owner}/${repo.name}`,
    description: `Learn from ${repo.owner}/${repo.name} — ${repo.topic_count} topics`,
    language: "Multi",
    stars: 0,
    isPrivate: false,
    owner: repo.owner,
  };
}

export function mapSpecialization(topic: BackendTopic, index: number): Specialization {
  let status: Specialization["status"] = "not_started";
  if (topic.cleared) status = "completed";
  else if (topic.challenge_passed || topic.quiz_passed) status = "in_progress";

  const mastery = topic.cleared ? 100 : topic.challenge_passed && topic.quiz_passed ? 100 : topic.challenge_passed || topic.quiz_passed ? 50 : 0;

  return {
    id: topic.id,
    title: topic.title,
    description: topic.description,
    icon: ICONS[index % ICONS.length],
    fileCount: topic.file_refs.length || 1,
    mastery,
    status,
  };
}

export function mapFlashcards(cards: { front: string; back: string }[]): Flashcard[] {
  return cards.map((c, i) => ({ id: `fc-${i}`, front: c.front, back: c.back }));
}

export function mapChallenge(challenge: BackendChallenge): Challenge {
  const example = challenge.examples[0];
  return {
    id: challenge.topic_id,
    title: challenge.title,
    description: challenge.prompt,
    input: example?.input ?? "See challenge prompt",
    expectedOutput: example?.output ?? "Correct solution",
    starterCode: challenge.starter_code,
    pseudocodeHint: "Describe your approach step by step in plain English.",
    hints: [],
  };
}

export function mapQuizQuestions(questions: BackendQuizQuestion[]): QuizQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options ?? (q.type === "true_false" ? ["true", "false"] : []),
    correctIndex: -1,
    explanation: "",
  }));
}

export function mapAnnotations(files: BackendAnnotatedFile[]): CodeNote[] {
  const notes: CodeNote[] = [];
  for (const file of files) {
    for (const ann of file.annotations) {
      notes.push({ line: ann.start_line, text: ann.note });
    }
  }
  return notes.sort((a, b) => a.line - b.line);
}

export function buildTopicFile(
  detail: BackendTopicDetail,
  codeFiles: BackendAnnotatedFile[],
  challenge: BackendChallenge,
  quiz: BackendQuizQuestion[]
): TopicFile {
  const primary = codeFiles[0];
  const allCode = codeFiles.map((f) => `// ${f.file_path}\n${f.content}`).join("\n\n");

  const filePath = primary?.file_path ?? detail.file_refs[0] ?? "source";

  return {
    id: detail.id,
    path: filePath,
    title: detail.title,
    language: primary?.language ?? "typescript",
    sourceCode: primary?.content ?? allCode,
    lesson: {
      summary: detail.lesson,
      estimatedMinutes: detail.estimated_minutes,
      objectives: detail.file_refs.slice(0, 4).map((ref, i) => ({
        id: `obj-${i}`,
        text: `Understand how ${ref} implements this concept`,
      })),
      concepts: [],
    },
    flashcards: mapFlashcards(detail.flashcards),
    notes: mapAnnotations(codeFiles),
    challenge: mapChallenge(challenge),
    quiz: mapQuizQuestions(quiz),
  };
}

export function buildTopic(
  detail: BackendTopicDetail,
  codeFiles: BackendAnnotatedFile[],
  challenge: BackendChallenge,
  quiz: BackendQuizQuestion[],
  repoId: string
): Topic {
  return {
    id: detail.id,
    repoId,
    title: detail.title,
    description: detail.description,
    files: [buildTopicFile(detail, codeFiles, challenge, quiz)],
  };
}
