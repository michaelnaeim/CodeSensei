from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


class SessionResponse(BaseModel):
    session_id: str


class RepoCreateRequest(BaseModel):
    url: str = Field(..., examples=["https://github.com/fastapi/fastapi"])


class RepoResponse(BaseModel):
    id: str
    url: str
    owner: str
    name: str
    status: Literal["pending", "indexing", "generating", "ready", "failed"]
    error_message: str | None = None
    topic_count: int = 0
    language_mix: dict | None = None
    file_tree: list[str] | None = None
    created_at: datetime
    updated_at: datetime


class TopicSummary(BaseModel):
    id: str
    title: str
    description: str
    order: int
    difficulty: str
    estimated_minutes: int
    file_refs: list[str]
    content_status: str
    challenge_passed: bool = False
    quiz_passed: bool = False
    cleared: bool = False


class TopicListResponse(BaseModel):
    repo_id: str
    topics: list[TopicSummary]


class Flashcard(BaseModel):
    front: str
    back: str


class CodeAnnotation(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    note: str
    code_snippet: str


class AnnotatedFile(BaseModel):
    file_path: str
    language: str
    content: str
    annotations: list[CodeAnnotation]


class ChallengeResponse(BaseModel):
    topic_id: str
    title: str
    prompt: str
    starter_code: str
    supports_pseudocode: bool = True
    examples: list[dict[str, str]] = []


class QuizQuestion(BaseModel):
    id: str
    type: Literal["multiple_choice", "true_false", "short_answer"]
    question: str
    options: list[str] | None = None


class QuizResponse(BaseModel):
    topic_id: str
    title: str
    questions: list[QuizQuestion]


class TopicDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    order: int
    difficulty: str
    estimated_minutes: int
    lesson: str
    flashcards: list[Flashcard]
    file_refs: list[str]
    challenge_passed: bool = False
    quiz_passed: bool = False
    cleared: bool = False


class TopicCodeResponse(BaseModel):
    topic_id: str
    files: list[AnnotatedFile]


class ChallengeSubmitRequest(BaseModel):
    submission: str
    mode: Literal["code", "pseudocode"] = "code"


class ChallengeSubmitResponse(BaseModel):
    passed: bool
    score: int
    feedback: str
    cleared: bool


class QuizSubmitRequest(BaseModel):
    answers: dict[str, str]


class QuizSubmitResponse(BaseModel):
    passed: bool
    score: int
    feedback: str
    results: list[dict[str, Any]]
    cleared: bool


class ProgressEntry(BaseModel):
    topic_id: str
    topic_title: str
    repo_id: str
    challenge_passed: bool
    quiz_passed: bool
    challenge_score: int | None
    quiz_score: int | None
    cleared: bool


class ProgressResponse(BaseModel):
    session_id: str
    entries: list[ProgressEntry]


class ErrorResponse(BaseModel):
    detail: str
