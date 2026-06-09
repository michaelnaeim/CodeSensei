# Deploying CodeSensei

CodeSensei runs as two services:

- **Frontend** (Next.js) → **Vercel**
- **Backend** (FastAPI) → **Railway** (with a Railway Postgres database)

Deploy the backend first so you have its URL for the frontend.

---

## 1. Backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select this repo.
2. In the service **Settings → Source**, set the **Root Directory** to `backend`.
   (This makes Railway use `backend/requirements.txt`, `backend/Procfile`, and `backend/railway.json`.)
3. Add a database: **New → Database → Add PostgreSQL**. Railway creates a `DATABASE_URL` variable.
4. In the backend service **Variables**, add:

   | Variable          | Value                                                        |
   | ----------------- | ------------------------------------------------------------ |
   | `GEMINI_API_KEY`  | your Gemini API key                                          |
   | `GITHUB_TOKEN`    | a GitHub personal access token (raises API limit to 5000/hr)|
   | `DATABASE_URL`    | reference the Postgres var: `${{Postgres.DATABASE_URL}}`     |
   | `ALLOWED_ORIGINS` | your Vercel URL, e.g. `https://your-app.vercel.app` (set after step 2) |

   `GEMINI_MODEL`, thresholds, and `MAX_FILES_TO_INDEX` are optional (sensible defaults baked in).

5. Deploy. The start command (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`) comes from `railway.json`.
6. Under **Settings → Networking**, generate a public domain. Visiting it should return
   `{"status":"ok","service":"CodeSensei API"}`.

> The DB schema is auto-created on startup. `postgres://` URLs are normalized automatically.

---

## 2. Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
2. Vercel auto-detects Next.js. Leave the root directory as the repo root.
3. Add an **Environment Variable**:

   | Variable              | Value                                            |
   | --------------------- | ------------------------------------------------ |
   | `NEXT_PUBLIC_API_URL` | `https://<your-railway-domain>/api`              |

   (Optional GitHub OAuth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`.)

4. Deploy. Copy the resulting Vercel URL.

---

## 3. Connect the two

1. Back in Railway, set `ALLOWED_ORIGINS` to your Vercel URL (no trailing slash), e.g.
   `https://codesensei.vercel.app`. Redeploy the backend if needed.
2. Open the Vercel URL, paste a public GitHub repo, and confirm indexing works end to end.

You can allow any origin with `ALLOWED_ORIGINS=*` (safe here since credentials are disabled), but
pinning to your Vercel domain is recommended.

---

## Notes

- **Free Railway tier**: the backend may sleep when idle; the first request after sleeping wakes it.
- **Long indexing jobs** run in FastAPI background tasks on the single backend instance — fine for a
  hobby deployment. For heavy concurrent use, move indexing to a worker/queue.
- **Local development** still uses SQLite and `http://localhost:8000/api` by default — no changes needed.
