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


class GeneratorService:
    def __init__(self) -> None:
        self.github = GitHubService()
        self.llm = LLMService()

    async def ensure_topic_content(self, db: Session, topic: Topic) -> TopicContent:
        if topic.content:
            return topic.content

        repo = db.query(Repo).filter(Repo.id == topic.repo_id).one()
        topic.content_status = "generating"
        db.commit()

        file_refs = topic.file_refs[:5]
        files = await get_topic_files(self.github, repo, file_refs)
        file_payload = [{"path": f.path, "content": f.content[:9000]} for f in files]

        system_prompt = (
            "You are CodeSensei. Generate complete learning content for one topic from a real repository. "
            "Return strict JSON with keys: lesson, flashcards, annotations, challenge, quiz. "
            "flashcards: array of {front, back}. "
            "annotations: array of {file_path, start_line, end_line, note, code_snippet}. "
            "challenge: {title, prompt, starter_code, supports_pseudocode, examples:[{input, output}], rubric}. "
            "quiz: {title, questions:[{id, type, question, options, answer, explanation}]}. "
            "Use only provided files. Keep content accurate and student-friendly."
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
            result = self.llm.complete_json(system_prompt, user_prompt)
        except Exception:
            topic.content_status = "failed"
            db.commit()
            raise

        content = TopicContent(
            topic_id=topic.id,
            lesson=result.get("lesson", ""),
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
