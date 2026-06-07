import json

from sqlalchemy.orm import Session

from app.models import Repo, Topic
from app.services.github import GitHubService, ParsedRepoUrl, RepoFile, parse_github_url
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

            tree, commit_sha = await self.github.fetch_tree(parsed, branch)
            repo.commit_sha = commit_sha
            repo.file_tree = [item["path"] for item in tree]
            repo.language_mix = {metadata.get("language") or "unknown": 1}

            selected_paths = self.github.select_files_for_indexing(tree)
            files = await self.github.fetch_file_contents(parsed, selected_paths)
            repo.indexed_files = [{"path": f.path, "size": f.size} for f in files]
            repo.status = "generating"
            db.commit()

            topics_data = self._extract_topics(repo, files)
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

    def _extract_topics(self, repo: Repo, files: list[RepoFile]) -> list[dict]:
        file_bundle = []
        for file in files[:30]:
            snippet = file.content[:4000]
            file_bundle.append({"path": file.path, "content": snippet})

        system_prompt = (
            "You are CodeSensei, an expert computer science educator. "
            "Analyze a GitHub repository and produce a student-friendly curriculum. "
            "Return strict JSON with shape: "
            '{"topics":[{"title":"","description":"","order":1,"difficulty":"beginner|intermediate|advanced",'
            '"estimated_minutes":20,"file_refs":["path/to/file"]}]}. '
            "Create 12 to 18 fine-grained concepts ordered for learning. "
            "Prefer specific, focused concepts (e.g. 'JWT Validation', 'Zod Schemas', "
            "'Error Handling', 'URL Building') over broad umbrella topics. "
            "Order them so foundational prerequisites come first and dependent concepts later. "
            "Each concept must map to real files from the provided bundle. "
            "Focus on concepts students can learn from this codebase."
        )
        user_prompt = json.dumps(
            {
                "repo": f"{repo.owner}/{repo.name}",
                "default_branch": repo.default_branch,
                "files": file_bundle,
            },
            indent=2,
        )

        result = self.llm.complete_json(system_prompt, user_prompt)
        topics = result.get("topics", [])
        if not topics:
            raise RuntimeError("LLM did not return any topics")
        return topics
