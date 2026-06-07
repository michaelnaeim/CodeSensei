# CodeSensei Backend

FastAPI backend that turns any public GitHub repo into a student learning platform.

## Quick start

Requires **Python 3.12+**.

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your GEMINI_API_KEY to .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Gemini key for indexing, content generation, challenge grading |
| `GEMINI_MODEL` | No | Default `gemini-2.5-flash` |
| `GITHUB_TOKEN` | No | Raises GitHub API rate limits |
| `DATABASE_URL` | No | Default SQLite `sqlite:///./codesensei.db` |
| `CHALLENGE_PASS_THRESHOLD` | No | Default `80` |
| `QUIZ_PASS_THRESHOLD` | No | Default `70` |
| `MAX_FILES_TO_INDEX` | No | Default `50` |

## Frontend integration

All routes are under `/api`. Send `X-Session-Id` on progress-related requests.

1. `POST /api/session` → get `session_id`
2. `POST /api/repos` with `{ "url": "https://github.com/owner/repo" }` → poll `GET /api/repos/{id}` until `status` is `ready`
3. `GET /api/repos/{id}/topics` → topic map
4. `GET /api/topics/{id}` → lesson + flashcards
5. `GET /api/topics/{id}/code` → annotated source files
6. `GET /api/topics/{id}/challenge` → challenge
7. `POST /api/topics/{id}/challenge/submit` → grade challenge
8. `GET /api/topics/{id}/quiz` → quiz (answers not exposed)
9. `POST /api/topics/{id}/quiz/submit` → grade quiz
10. `GET /api/progress` → all topic progress for session

**Module cleared** when both `challenge_passed` and `quiz_passed` are true.

See [docs/API.md](./docs/API.md) for full request/response examples.

## Architecture

```
API (FastAPI)
  ├── GitHubService      fetch public repo tree + files
  ├── IndexerService     LLM topic extraction
  ├── GeneratorService   LLM lesson/notes/challenge/quiz per topic
  ├── GraderService      quiz scoring + LLM challenge grading
  └── SQLite             repos, topics, content, anonymous sessions
```

Indexing runs as a background job. Topic content is generated lazily on first access and cached in the database.
