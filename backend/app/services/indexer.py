import asyncio
import json

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Repo, Topic
from app.services.github import (
    MANIFEST_FILES,
    GitHubService,
    RepoFile,
    detect_frameworks,
    parse_github_url,
)
from app.services.llm import LLMService


class IndexerService:
    def __init__(self) -> None:
        self.github = GitHubService()
        self.llm = LLMService()

    async def index_repo(self, db: Session, repo: Repo) -> None:
        parsed = parse_github_url(repo.url)
        repo.owner = parsed.owner
        repo.name = parsed.name
        repo.status = "indexing"
        db.commit()

        try:
            metadata = await self.github.fetch_repo_metadata(parsed)
            branch = metadata.get("default_branch", "main")
            repo.default_branch = branch

            (files, file_tree, commit_sha), languages = await asyncio.gather(
                self.github.fetch_archive_files(parsed, branch),
                self.github.fetch_languages(parsed),
            )
            repo.commit_sha = commit_sha
            repo.file_tree = file_tree
            repo.indexed_files = [
                {
                    "path": f.path,
                    "size": f.size,
                    "content": f.content[: settings.max_cached_file_chars],
                }
                for f in files[: settings.max_cached_files]
            ]

            repo.language_mix = self._build_tech_stack(metadata, languages, files)
            repo.status = "generating"
            db.commit()

            topics_data = await asyncio.to_thread(self._extract_topics, repo, files)
            db.query(Topic).filter(Topic.repo_id == repo.id).delete()

            for index, topic_data in enumerate(topics_data):
                topic = Topic(
                    repo_id=repo.id,
                    title=topic_data["title"],
                    description=topic_data["description"],
                    order=topic_data.get("order", index + 1),
                    difficulty=topic_data.get("difficulty", "beginner"),
                    estimated_minutes=topic_data.get("estimated_minutes", 20),
                    file_refs=topic_data.get("file_refs", []),
                    content_status="pending",
                )
                db.add(topic)

            repo.status = "ready"
            repo.error_message = None
            db.commit()
        except Exception as exc:
            repo.status = "failed"
            repo.error_message = str(exc)
            db.commit()
            raise

    def _build_tech_stack(
        self, metadata: dict, languages: dict[str, int], files: list[RepoFile]
    ) -> dict:
        if not languages:
            primary = metadata.get("language")
            languages = {primary: 1} if primary else {}

        top_languages = dict(
            sorted(languages.items(), key=lambda kv: kv[1], reverse=True)[:6]
        )

        stack: dict[str, int] = dict(top_languages)
        for framework in detect_frameworks(files):
            stack[framework] = stack.get(framework, 0)

        if not stack:
            stack = {"unknown": 1}
        return stack

    def _build_llm_file_bundle(self, files: list[RepoFile]) -> list[dict]:
        """Small, high-signal bundle for the curriculum LLM — not the full repo."""
        bundle: list[dict] = []
        path_only: list[str] = []
        snippet_budget = settings.max_files_for_llm

        for file in files:
            name = file.path.split("/")[-1].lower()
            is_manifest = name in MANIFEST_FILES
            is_readme = name.endswith(".md") and ("readme" in name or name == "contributing.md")

            if is_manifest or is_readme:
                bundle.append(
                    {
                        "path": file.path,
                        "content": file.content[:6000],
                    }
                )
                continue

            if len(bundle) < snippet_budget:
                bundle.append(
                    {
                        "path": file.path,
                        "content": file.content[: settings.max_snippet_chars],
                    }
                )
            else:
                path_only.append(file.path)

        if path_only:
            bundle.append(
                {
                    "path": "__additional_paths__",
                    "content": "\n".join(path_only[:100]),
                }
            )

        return bundle[: settings.max_files_for_llm + 5]

    def _extract_topics(self, repo: Repo, files: list[RepoFile]) -> list[dict]:
        file_bundle = self._build_llm_file_bundle(files)
        max_topics = settings.max_topics

        system_prompt = (
            "You are CodeSensei, an expert computer science educator. "
            "Analyze a GitHub repository and produce a student-friendly curriculum. "
            "Return strict JSON with shape: "
            '{"topics":[{"title":"","description":"","order":1,"difficulty":"beginner|intermediate|advanced",'
            '"estimated_minutes":20,"file_refs":["path/to/file"]}]}. '
            f"Create {max(4, max_topics - 2)} to {max_topics} focused concepts ordered for learning. "
            "Prefer specific concepts (e.g. 'JWT Validation', 'Route Handlers') over broad umbrellas. "
            "Each concept must reference real paths from the provided files. "
            "Keep descriptions concise."
        )
        user_prompt = json.dumps(
            {
                "repo": f"{repo.owner}/{repo.name}",
                "default_branch": repo.default_branch,
                "files": file_bundle,
            },
            indent=2,
        )

        result = self.llm.complete_json(system_prompt, user_prompt, retries=1)
        topics = result.get("topics", [])
        if not topics:
            raise RuntimeError("LLM did not return any topics")
        return topics[:max_topics]
