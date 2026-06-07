# CodeSensei API Contract

Base URL: `http://localhost:8000/api`

## Headers

| Header | When | Description |
|--------|------|-------------|
| `X-Session-Id` | Optional on reads, required on submits + progress | Anonymous session UUID from `POST /session` |

## Endpoints

### Health

`GET /health`

```json
{ "status": "ok" }
```

### Create session

`POST /session`

Response `200`:

```json
{ "session_id": "550e8400-e29b-41d4-a716-446655440000" }
```

### Index repository

`POST /repos`

Request:

```json
{ "url": "https://github.com/fastapi/fastapi" }
```

Response `202`:

```json
{
  "id": "repo-uuid",
  "url": "https://github.com/fastapi/fastapi",
  "owner": "fastapi",
  "name": "fastapi",
  "status": "pending",
  "error_message": null,
  "topic_count": 0,
  "created_at": "2026-06-07T12:00:00",
  "updated_at": "2026-06-07T12:00:00"
}
```

Poll `GET /repos/{id}` until `status` is `ready` or `failed`.

Status values: `pending` → `indexing` → `generating` → `ready` | `failed`

### List topics

`GET /repos/{repo_id}/topics`

Response `200`:

```json
{
  "repo_id": "repo-uuid",
  "topics": [
    {
      "id": "topic-uuid",
      "title": "Routing",
      "description": "How HTTP routes are defined and matched",
      "order": 1,
      "difficulty": "beginner",
      "estimated_minutes": 20,
      "file_refs": ["fastapi/routing.py"],
      "content_status": "pending",
      "challenge_passed": false,
      "quiz_passed": false,
      "cleared": false
    }
  ]
}
```

### Topic detail (lesson + flashcards)

`GET /topics/{topic_id}`

Triggers content generation on first request.

### Annotated code

`GET /topics/{topic_id}/code`

```json
{
  "topic_id": "topic-uuid",
  "files": [
    {
      "file_path": "fastapi/routing.py",
      "language": "py",
      "content": "...",
      "annotations": [
        {
          "file_path": "fastapi/routing.py",
          "start_line": 10,
          "end_line": 18,
          "note": "This decorator registers a GET handler.",
          "code_snippet": "..."
        }
      ]
    }
  ]
}
```

### Challenge

`GET /topics/{topic_id}/challenge`

```json
{
  "topic_id": "topic-uuid",
  "title": "Build a route matcher",
  "prompt": "Implement ...",
  "starter_code": "def solve(...):",
  "supports_pseudocode": true,
  "examples": [{ "input": "...", "output": "..." }]
}
```

`POST /topics/{topic_id}/challenge/submit`

Request:

```json
{
  "submission": "def solve(x): return x",
  "mode": "code"
}
```

`mode`: `code` | `pseudocode`

Response:

```json
{
  "passed": true,
  "score": 85,
  "feedback": "Good work...",
  "cleared": false
}
```

`cleared` is true only when quiz is also passed.

### Quiz

`GET /topics/{topic_id}/quiz`

Questions do **not** include answers.

`POST /topics/{topic_id}/quiz/submit`

Request:

```json
{
  "answers": {
    "q1": "option_a",
    "q2": "true"
  }
}
```

Response:

```json
{
  "passed": true,
  "score": 80,
  "feedback": "You answered 4 of 5 questions correctly.",
  "results": [
    {
      "question_id": "q1",
      "correct": true,
      "submitted": "option_a",
      "expected": "option_a",
      "explanation": "..."
    }
  ],
  "cleared": true
}
```

### Progress

`GET /progress` (requires `X-Session-Id`)

```json
{
  "session_id": "session-uuid",
  "entries": [
    {
      "topic_id": "topic-uuid",
      "topic_title": "Routing",
      "repo_id": "repo-uuid",
      "challenge_passed": true,
      "quiz_passed": true,
      "challenge_score": 90,
      "quiz_score": 80,
      "cleared": true
    }
  ]
}
```

## Error codes

| Code | Meaning |
|------|---------|
| 400 | Invalid GitHub URL or private repo |
| 401 | Missing/invalid session |
| 404 | Repo or topic not found |
| 409 | Repo not ready yet |

## Frontend polling pattern

```javascript
const res = await fetch('/api/repos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: repoUrl }),
});
const repo = await res.json();

const poll = async () => {
  const statusRes = await fetch(`/api/repos/${repo.id}`);
  const data = await statusRes.json();
  if (data.status === 'ready') return data;
  if (data.status === 'failed') throw new Error(data.error_message);
  await new Promise((r) => setTimeout(r, 2000));
  return poll();
};
```
