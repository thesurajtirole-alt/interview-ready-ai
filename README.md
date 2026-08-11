# InterviewReady AI

> Your interview isn't a test. It's a skill you can train.

An AI interview coach that researches the company, role, and panel you're
meeting, runs a realistic mock interview, and turns your performance into a
personalized, evidence-based training plan. No shame, no judgment — just
improvement.

## Status: Phase 1 of 21 (project setup)

See `SETUP.md` to install and run locally, and the master build spec for
the full phase list. Current phase includes:

- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn-compatible theme
- Supabase Auth (email/password) — browser client, server client, and
  middleware-based session refresh with protected-route redirects
- Environment configuration (`.env.example`)

## Stack

| Layer          | Choice                          |
|----------------|----------------------------------|
| Frontend       | Next.js, React, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| Backend        | Next.js Route Handlers / Server Actions |
| Database       | Supabase PostgreSQL |
| Auth           | Supabase Auth |
| Storage        | Supabase Storage |
| Deployment     | Vercel |

## Project structure so far

```
app/
  layout.tsx          root layout + metadata
  page.tsx             placeholder home (full landing page: Phase 3)
  login/page.tsx        Supabase sign-in
  signup/page.tsx        Supabase sign-up
  onboarding/page.tsx     placeholder (full flow: Phase 4)
  dashboard/page.tsx      placeholder, auth-protected (full version: Phase 18)
  auth/callback/route.ts   exchanges email-confirmation code for a session
lib/
  supabase/client.ts       browser client
  supabase/server.ts       server client (Server Components/Actions)
  supabase/middleware.ts   session refresh + route protection
  utils.ts                 cn() helper for shadcn components
middleware.ts               wires supabase/middleware into every request
```
