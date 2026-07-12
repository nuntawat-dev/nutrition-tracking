# 🥗 Nutrition Tracker

A personal, AI-powered nutrition & macro tracker. It uses **Claude Sonnet 5** to turn your
TDEE into daily targets, read food photos / text descriptions into calories and macros, log
exercise, summarise your day, and suggest your next meal. Built with **Next.js + TypeScript**
with a frosted-glass ("Liquid Glass") UI, protected by a single password, and deployable so you
can snap food photos on your phone.

## Features

1. **Profile & targets** — enter your TDEE + stats, let AI compute optimal calories and a
   protein/carb/fat split; manually adjust the macros (calories recompute automatically).
2. **Logging** — food via **photo and/or text** (AI estimates kcal + macros), exercise via text
   (AI estimates calories burned if you don't state them).
3. **Summary** — a per-item table with totals and how much you have **remaining** for the day.
4. **Next-meal suggestions** — 1–3 ideas sized to the macros you have left.

## Prerequisites

- **Node.js 18+**
- An **Anthropic API key** with billing enabled — <https://console.anthropic.com>

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.local.example .env.local
```

Edit `.env.local` and set:

- `ANTHROPIC_API_KEY` — your key
- `APP_PASSWORD` — the password you'll log in with
- `SESSION_SECRET` — a random 32+ char string. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Then run it:

```bash
npm run dev
# open http://localhost:3000 and log in with APP_PASSWORD
```

Data is stored locally in `local.db` (SQLite, created automatically, git-ignored).

## Deploy for phone use (Vercel + Turso)

The app is one deployable unit. Use a hosted SQLite database (Turso) so your data persists on
serverless.

1. **Create a Turso database** (free tier): <https://turso.tech> → create a DB → copy its
   **URL** and an **auth token**.
2. **Push this project to GitHub**, then **import it into Vercel** (<https://vercel.com>).
3. In Vercel → Project → **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY`
   - `APP_PASSWORD`
   - `SESSION_SECRET`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy. Open the URL on your phone, log in, and use the camera/photo picker to log food.

## How it works (architecture)

- **UI + server in one Next.js app.** The browser only talks to `/api/*` route handlers; your
  Anthropic API key lives **only server-side** and is never sent to the browser.
- **AI calls** use Claude Sonnet 5 with **structured outputs** (`output_config.format`) so macros
  come back as validated JSON. Food photos are sent as base64 image blocks (vision).
- **Auth**: a single password sets an encrypted `iron-session` cookie; `proxy.ts` gates every page
  and API route.
- **Database**: `@libsql/client` — a local `file:` DB in development, Turso in production (same code).

### Key files

```
app/                  pages + /api route handlers (targets, food, exercise, suggest, day, auth)
components/           GlassCard, Targets, Logger, SummaryTable, Suggestions, RemainingRing, ...
lib/                  anthropic, db, data, schemas (JSON + zod), prompts, session, client helpers
proxy.ts             auth gate (Next.js 16 "proxy" convention)
```

## Notes

- All calorie/macro figures are **AI estimates** and approximate.
- Units are metric (kg, cm, g).
- The "add exercise calories back to budget" toggle controls whether logged exercise increases
  your remaining calories for the day.
