import asyncio
import json
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Repo, Topic, TopicContent
from app.services.github import GitHubService, parse_github_url
from app.services.llm import LLMService


@dataclass
class CachedFile:
    path: str
    content: str


def _coerce_lesson(lesson) -> str:
    """The lesson column stores markdown text, but Gemini sometimes returns
    a structured object instead of a string. Normalize any shape to text."""
    if isinstance(lesson, str):
        return lesson
    if isinstance(lesson, dict):
        title = lesson.get("title")
        body = lesson.get("content") or lesson.get("body") or lesson.get("text")
        if body is not None:
            return f"# {title}\n\n{body}" if title else str(body)
        return json.dumps(lesson, indent=2)
    if isinstance(lesson, list):
        return "\n\n".join(_coerce_lesson(item) for item in lesson)
    return str(lesson)


async def get_topic_files(github: GitHubService, repo: Repo, file_refs: list[str]) -> list[CachedFile]:
    """Return file contents for the given refs, preferring the cache built
    during indexing. Falls back to the GitHub contents API only for files
    that were not indexed (keeps GitHub request count near zero)."""
    cache: dict[str, str] = {}
    for entry in repo.indexed_files or []:
        if isinstance(entry, dict) and "content" in entry:
            cache[entry["path"]] = entry["content"]

    result: list[CachedFile] = []
    missing: list[str] = []
    for ref in file_refs:
        if ref in cache:
            result.append(CachedFile(path=ref, content=cache[ref]))
        else:
            missing.append(ref)

    if missing:
        parsed = parse_github_url(repo.url)
        fetched = await github.fetch_file_contents(parsed, missing)
        for f in fetched:
            result.append(CachedFile(path=f.path, content=f.content))

    return result


_topic_locks: dict[str, asyncio.Lock] = {}


class GeneratorService:
    def __init__(self) -> None:
        self.github = GitHubService()
        self.llm = LLMService()

    async def ensure_topic_content(self, db: Session, topic: Topic) -> TopicContent:
        db.refresh(topic)
        if topic.content:
            return topic.content

        lock = _topic_locks.setdefault(topic.id, asyncio.Lock())
        async with lock:
            db.refresh(topic)
            if topic.content:
                return topic.content

            repo = db.query(Repo).filter(Repo.id == topic.repo_id).one()
            topic.content_status = "generating"
            db.commit()

            file_refs = topic.file_refs[:3]
            files = await get_topic_files(self.github, repo, file_refs)
            file_payload = [{"path": f.path, "content": f.content[:5000]} for f in files]

            system_prompt = (
                "You are CodeSensei. Generate learning content for one topic from a real repository. "
                "Return strict JSON with keys: lesson, flashcards, annotations, challenge, quiz. "
                "lesson: 2-3 short paragraphs. "
                "flashcards: 4-6 items {front, back}. "
                "annotations: 5-8 items {file_path, start_line, end_line, note, code_snippet}. "
                "challenge: {title, prompt, starter_code, supports_pseudocode, examples:[{input, output}], rubric}. "
                "quiz: {title, questions: 4-5 items {id, type, question, options, answer, explanation}}. "
                "Be concise. Use only provided files."
            )
            user_prompt = json.dumps(
                {
                    "repo": f"{repo.owner}/{repo.name}",
                    "topic": {
                        "title": topic.title,
                        "description": topic.description,
                        "difficulty": topic.difficulty,
                        "file_refs": file_refs,
                    },
                    "files": file_payload,
                },
                indent=2,
            )

            try:
                result = await asyncio.to_thread(
                    self.llm.complete_json, system_prompt, user_prompt, 1
                )
            except Exception:
                topic.content_status = "failed"
                db.commit()
                raise

            content = TopicContent(
                topic_id=topic.id,
                lesson=_coerce_lesson(result.get("lesson", "")),
                flashcards=result.get("flashcards", []),
                annotations=result.get("annotations", []),
                challenge=result.get("challenge", {}),
                quiz=result.get("quiz", {}),
            )
            db.add(content)
            topic.content_status = "ready"
            db.commit()
            db.refresh(content)
            return content
