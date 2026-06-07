export interface Repo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  isPrivate: boolean;
  owner: string;
}

export interface Specialization {
  id: string;
  title: string;
  description: string;
  icon: string;
  fileCount: number;
  mastery: number;
  status: "not_started" | "in_progress" | "completed";
}

export interface LearningObjective {
  id: string;
  text: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface CodeNote {
  line: number;
  text: string;
}

export interface LessonPlan {
  summary: string;
  objectives: LearningObjective[];
  concepts: { title: string; description: string }[];
  estimatedMinutes: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  input: string;
  expectedOutput: string;
  starterCode: string;
  pseudocodeHint: string;
  hints: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TopicFile {
  id: string;
  path: string;
  title: string;
  language: string;
  sourceCode: string;
  lesson: LessonPlan;
  flashcards: Flashcard[];
  notes: CodeNote[];
  challenge: Challenge;
  quiz: QuizQuestion[];
}

export interface Topic {
  id: string;
  repoId: string;
  title: string;
  description: string;
  files: TopicFile[];
}
