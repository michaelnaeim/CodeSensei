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

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Try demo** to explore without GitHub OAuth.

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
