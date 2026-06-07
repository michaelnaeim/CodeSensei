import asyncio
import base64
import json
import re
from dataclasses import dataclass

import httpx

from app.config import settings

SKIP_DIRS = {
    ".git",
    "node_modules",
    "vendor",
    "dist",
    "build",
    ".next",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "target",
    "coverage",
    ".nyc_output",
    ".idea",
    ".vscode",
    ".github",
    ".husky",
    ".turbo",
    ".cache",
    "out",
    "bin",
    "obj",
    "node",
    "tmp",
    "temp",
    "fixtures",
    "__snapshots__",
    "__mocks__",
    "site-packages",
    "migrations",
    "locales",
    "i18n",
}

# Manifest files used for framework/tech detection (kept out of priority noise filter)
MANIFEST_FILES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "go.mod",
    "cargo.toml",
    "pom.xml",
    "build.gradle",
    "gemfile",
    "composer.json",
}
SKIP_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp4",
    ".mp3",
    ".zip",
    ".tar",
    ".gz",
    ".pdf",
    ".lock",
    ".min.js",
    ".min.css",
    ".map",
}
PRIORITY_DIRS = ("src", "lib", "app", "pkg", "internal", "cmd", "api", "core", "services")
PRIORITY_FILES = ("README.md", "readme.md", "CONTRIBUTING.md", "main.", "index.", "app.")


@dataclass
class ParsedRepoUrl:
    owner: str
    name: str
    full_name: str


@dataclass
class RepoFile:
    path: str
    content: str
    size: int


def parse_github_url(url: str) -> ParsedRepoUrl:
    cleaned = url.strip().rstrip("/")
    cleaned = re.sub(r"\.git$", "", cleaned)
    match = re.search(r"github\.com[:/](?P<owner>[^/]+)/(?P<name>[^/]+)", cleaned)
    if not match:
        raise ValueError("Invalid GitHub repository URL")
    owner = match.group("owner")
    name = match.group("name")
    return ParsedRepoUrl(owner=owner, name=name, full_name=f"{owner}/{name}")


def _headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _should_skip_path(path: str) -> bool:
    parts = path.split("/")
    if any(part in SKIP_DIRS for part in parts):
        return True
    lower = path.lower()
    if any(lower.endswith(ext) for ext in SKIP_EXTENSIONS):
        return True
    return False


def _file_priority(path: str) -> int:
    lower = path.lower()
    score = 0
    if any(lower.startswith(f"{d}/") or lower == d for d in PRIORITY_DIRS):
        score += 50
    if any(name in lower for name in PRIORITY_FILES):
        score += 40
    if lower.endswith((".md", ".rst")):
        score += 30
    if lower.endswith((".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs", ".java", ".rb", ".php", ".cs")):
        score += 20
    if "/test" in lower or lower.startswith("test") or "spec." in lower:
        score -= 10
    depth = path.count("/")
    score -= depth
    return score


class GitHubService:
    def __init__(self) -> None:
        self.base_url = "https://api.github.com"

    async def fetch_repo_metadata(self, parsed: ParsedRepoUrl) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/repos/{parsed.full_name}",
                headers=_headers(),
            )
            if response.status_code == 404:
                raise ValueError("Repository not found or is private")
            response.raise_for_status()
            data = response.json()
            if data.get("private"):
                raise ValueError("Private repositories are not supported")
            return data

    async def fetch_tree(self, parsed: ParsedRepoUrl, branch: str) -> list[dict]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            ref_response = await client.get(
                f"{self.base_url}/repos/{parsed.full_name}/git/ref/heads/{branch}",
                headers=_headers(),
            )
            if ref_response.status_code == 404:
                repo = await self.fetch_repo_metadata(parsed)
                branch = repo["default_branch"]
                ref_response = await client.get(
                    f"{self.base_url}/repos/{parsed.full_name}/git/ref/heads/{branch}",
                    headers=_headers(),
                )
            ref_response.raise_for_status()
            commit_sha = ref_response.json()["object"]["sha"]

            tree_response = await client.get(
                f"{self.base_url}/repos/{parsed.full_name}/git/trees/{commit_sha}",
                params={"recursive": "1"},
                headers=_headers(),
            )
            tree_response.raise_for_status()
            tree = tree_response.json()["tree"]
            return [item for item in tree if item["type"] == "blob" and not _should_skip_path(item["path"])], commit_sha

    async def fetch_languages(self, parsed: ParsedRepoUrl) -> dict[str, int]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/repos/{parsed.full_name}/languages",
                headers=_headers(),
            )
            if response.status_code != 200:
                return {}
            return response.json()

    async def fetch_file_contents(self, parsed: ParsedRepoUrl, paths: list[str]) -> list[RepoFile]:
        semaphore = asyncio.Semaphore(10)

        async def fetch_one(client: httpx.AsyncClient, path: str) -> RepoFile | None:
            async with semaphore:
                try:
                    response = await client.get(
                        f"{self.base_url}/repos/{parsed.full_name}/contents/{path}",
                        headers=_headers(),
                    )
                except httpx.HTTPError:
                    return None
                if response.status_code != 200:
                    return None
                payload = response.json()
                if not isinstance(payload, dict):
                    return None
                if payload.get("size", 0) > settings.max_file_size_bytes:
                    return None
                content = payload.get("content", "")
                if payload.get("encoding") == "base64" and content:
                    decoded = base64.b64decode(content).decode("utf-8", errors="replace")
                else:
                    decoded = content or ""
                return RepoFile(path=path, content=decoded, size=len(decoded))

        async with httpx.AsyncClient(timeout=60.0) as client:
            results = await asyncio.gather(*(fetch_one(client, p) for p in paths))
        return [f for f in results if f is not None]

    def select_files_for_indexing(self, tree: list[dict]) -> list[str]:
        candidates = []
        for item in tree:
            size = item.get("size", 0)
            if size > settings.max_file_size_bytes:
                continue
            candidates.append(item["path"])
        ranked = sorted(candidates, key=_file_priority, reverse=True)
        return ranked[: settings.max_files_to_index]


# Well-known frameworks/libraries to surface as tech-stack tags
KNOWN_FRAMEWORKS = {
    "react", "next", "vue", "nuxt", "svelte", "angular", "express", "fastify",
    "nestjs", "@nestjs/core", "fastapi", "flask", "django", "starlette",
    "pydantic", "sqlalchemy", "tailwindcss", "prisma", "drizzle-orm", "zod",
    "graphql", "redux", "zustand", "vite", "webpack", "jest", "vitest",
    "playwright", "puppeteer", "pytest", "gin", "echo", "actix-web", "tokio",
    "spring-boot", "rails", "laravel", "tensorflow", "torch", "pandas", "numpy",
}


def detect_frameworks(files: list[RepoFile]) -> list[str]:
    found: set[str] = set()
    for file in files:
        name = file.path.split("/")[-1].lower()
        content = file.content
        try:
            if name == "package.json":
                data = json.loads(content)
                deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                for dep in deps:
                    base = dep.lower()
                    if base in KNOWN_FRAMEWORKS:
                        found.add(dep.replace("@nestjs/core", "nestjs"))
            elif name in ("requirements.txt",):
                for line in content.splitlines():
                    pkg = re.split(r"[=<>!~\s]", line.strip(), maxsplit=1)[0].lower()
                    if pkg in KNOWN_FRAMEWORKS:
                        found.add(pkg)
            elif name == "pyproject.toml":
                for fw in KNOWN_FRAMEWORKS:
                    if re.search(rf'["\']?{re.escape(fw)}["\']?\s*[=>~]', content, re.IGNORECASE):
                        found.add(fw)
            elif name == "go.mod":
                for fw in ("gin", "echo"):
                    if fw in content:
                        found.add(fw)
            elif name in ("cargo.toml",):
                for fw in ("actix-web", "tokio"):
                    if fw in content:
                        found.add(fw)
        except (json.JSONDecodeError, ValueError):
            continue
    return sorted(found)
