# CodeSensei

**AI makes you fast. CodeSensei makes you good.**

Turn any GitHub repository into a structured, interactive curriculum. Learn from real source code with flashcards, lesson plans, line-by-line notes, coding challenges, and mastery tracking.

## Features

- **GitHub sign-in** — browse private and public repos (demo mode available)
- **Specializations** — topics like Authentication, OAuth, Middleware
- **Learning flow** — Flashcards → Lesson plan → Source code + notes → Challenge → Official quiz
- **Pseudocode mode** — practice logic without syntax
- **AI solution checking** — instant feedback on challenges
- **Mastery tracking** — progress persisted per file and topic

## Quick start

**1. Backend** (terminal 1):
```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

**2. Frontend** (terminal 2):
```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Try demo**, paste a public GitHub URL on the dashboard, and wait for indexing to finish.

## GitHub OAuth setup

1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set callback URL to `http://localhost:3000/api/auth/callback/github`
3. Copy `.env.example` to `.env.local` and fill in credentials

## Demo path

1. Landing page → **Try demo**
2. Dashboard → **chromium** or **auth-service** repo
3. **Authentication** specialization
4. **jwt-middleware.ts** file
5. Complete the full learning loop

## Tech stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS v4
- NextAuth (GitHub)
- Framer Motion
- Monaco Editor
- Zustand (mastery persistence)

## Backend

See [backend/README.md](./backend/README.md) for setup and API docs for frontend integration.

## Built with Perseus

CodeSensei is indexed on [perseus.computer](https://perseus.computer) under **michaelnaeim/CodeSensei**. We used Perseus to navigate our own codebase while building — the same “understand before you ship” loop the product teaches learners.

**Index:** `4702a65e-bb4f-42a2-b4db-3b1239ec81c8` (66 files, 292 chunks) · commit `44163f6`

**Live query traces** (full MCTS tree in the Perseus console):

| Build milestone | Console run |
|-----------------|-------------|
| Knowledge map layout | [qry-936a99f09cdd](https://perseus.computer/console/runs/qry-936a99f09cdd) |
| React Flow blank canvas fix | [qry-c8875478c55d](https://perseus.computer/console/runs/qry-c8875478c55d) |
| `flow-shell.tsx` height + fitView | [qry-46c92143b1eb](https://perseus.computer/console/runs/qry-46c92143b1eb) |
| Indexer performance | [qry-7d0dba9feead](https://perseus.computer/console/runs/qry-7d0dba9feead) |
| Usage tracking | [qry-143b39751400](https://perseus.computer/console/runs/qry-143b39751400) |
| Gemini API key config | [qry-ace8e75010d3](https://perseus.computer/console/runs/qry-ace8e75010d3) |

Full build log: [docs/perseus-build-log.jsonl](./docs/perseus-build-log.jsonl)
