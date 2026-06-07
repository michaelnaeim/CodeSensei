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
