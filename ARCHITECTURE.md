# Architecture

## High level

```
Browser
  │
  ├─ Next.js App Router pages (server components fetch via Supabase server client)
  ├─ Client components (forms, interview chat, training) talk to:
  │
  ├─ Next.js Route Handlers (app/api/**)
  │     │
  │     ├─ Supabase (auth, database, storage) — server client, respects RLS
  │     ├─ Gemini API (lib/ai/*) — question generation, evaluation, synthesis
  │     └─ Tavily API (lib/research/*) — real web search
  │
  └─ Middleware (middleware.ts) — refreshes Supabase session, protects routes
```

## Directory structure

```
app/
  page.tsx                     landing page
  login/, signup/                auth pages
  auth/callback/                 exchanges email-confirmation code for a session
  onboarding/                    5-screen onboarding, saves company/JD/panel/resume
  dashboard/                     "what should I do next" hub
  research/[id]/                 company brief, panel research, blueprint trigger
  interview/new/                 pick interview tone, calls /api/interview/start
  interview/[id]/                the live interview UI (camera, avatar, chat)
  interview/[id]/report/         post-interview report
  training/                      growth-area list, Surprise Round trigger
  training/[id]/                 drill exercises with retry tracking
  progress/                      readiness score + history
  profile/                       resume analysis + Resume Defense Map
  final-prep/[companyId]/        pre-interview summary
  demo/                          static walkthrough, no login required
  api/                           all server-side logic — see below

lib/
  ai/                           every Gemini call lives here, one file per concern
    gemini.ts                    thin fetch wrapper around the Gemini API
    parse-json.ts                 resilient JSON parsing (repairs common LLM quirks)
    interview-blueprint.ts         blueprint generation
    interview-question.ts          live interviewer question generation
    answer-evaluation.ts           per-answer scoring
    report-synthesis.ts            post-interview report narrative
    training.ts                    training plan + attempt feedback
    readiness-narrative.ts         "You're getting there" / "You're looking ready" text
    resume-analysis.ts             resume parsing → structured profile + defense map
    final-prep.ts                  pre-interview summary synthesis
  research/
    tavily.ts                     Tavily search wrapper
    company-research.ts            company, role, and interviewer research functions
  interview/
    stage-plan.ts                  converts blueprint percentages into a question plan
    panel-persona.ts               infers panel personas, picks who asks what
  readiness/
    compute.ts                     pure computation of readiness signals from real data
  resume/
    extract-text.ts                PDF/DOCX/TXT → plain text
  supabase/
    client.ts, server.ts, middleware.ts   the three Supabase client variants
  validation.ts                   shared Zod schemas + validateBody() helper

components/
  header.tsx                     persistent nav header (auth-aware)
  sign-out-button.tsx             client sign-out

supabase/migrations/              every SQL migration, run in order in Supabase's SQL Editor
```

## Request flow example: starting an interview

1. `/interview/new` (client) — picks a tone, POSTs to `/api/interview/start`
2. Route handler fetches the job description + interview plan (blueprint) + panel members
3. Builds a stage plan from the blueprint's percentages (`lib/interview/stage-plan.ts`)
4. Picks the opening panel member for the first stage (`lib/interview/panel-persona.ts`)
5. Calls Gemini (`lib/ai/interview-question.ts`) for the opening question
6. Saves the interview + question + transcript entry
7. Returns the question; client redirects to `/interview/[id]` and shows it

Every subsequent answer goes through `/api/interview/answer`, which:
saves the answer, kicks off background evaluation (not awaited by the
response), decides the next stage, picks the next panel member, and
generates the next question — with natural handoff language if the
panel member changed.

## Why some things are structured the way they are

- **AI calls are all thin wrapper functions in `lib/ai/`**, each with its
  own Zod schema for the expected response shape. Nothing trusts raw
  model JSON — every response is validated before use.
- **Independent database queries are parallelized with `Promise.all`**
  where they don't depend on each other (see `app/research/[id]/page.tsx`
  and `app/api/interview/answer/route.ts` for examples) — this was a real
  performance fix, not premature optimization.
- **RLS is the primary security boundary**, not application code — every
  table's policies assume a malicious client could call the API directly.
