# Deployment

## Current setup

- **Hosting**: Vercel, connected to the GitHub repo, auto-deploys on
  every push to `main`
- **Database**: Supabase (free tier)
- **Region**: Supabase project is in `ap-south-1` (Mumbai) — pick
  whatever's closest to your actual users if you fork this

## Environment variables required in Vercel

Project → Settings → Environment Variables. All of these need to be set
for both **Production** and **Preview**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER          (set to: gemini)
GEMINI_API_KEY
TAVILY_API_KEY
```

## Deploying a change

```bash
git add -A
git commit -m "..."
git push
```

Vercel picks this up automatically. Check the Deployments tab for a
green "Ready" status. If a build fails, the log will show exactly which
step failed (dependency install, `next build` compile, type-check, or
static generation) — read the log from the bottom up, the actual error
is usually the last few lines before "Command failed."

## Known deployment gotchas hit during development

- **`next/font/google` fetch failures**: occasionally the build fails
  trying to fetch the Fraunces font from Google Fonts during the build
  step. This is a transient network issue on Vercel's build infra, not a
  code problem — just retry the deployment (redeploy from the
  Deployments tab, optionally without build cache).
- **`useSearchParams()` needs a Suspense boundary**: any client component
  using `useSearchParams()` must be wrapped in `<Suspense>` or the
  production build fails with "should be wrapped in a suspense boundary"
  even though `next dev` runs it fine. See `app/interview/new/page.tsx`
  for the pattern.
- **Third-party packages without TypeScript types**: `pdf-parse` doesn't
  ship its own `.d.ts` file, which passes locally in some setups but
  fails Vercel's stricter type-check. Fixed with a manual declaration at
  `types/pdf-parse.d.ts`. If you add another untyped package, this same
  pattern applies.
- **New environment variables need a Redeploy, not just a Save**: adding
  or changing an env var in Vercel does not retroactively apply to the
  already-running deployment — you need to explicitly hit Redeploy (or
  push a new commit) after changing env vars.

## What's not set up yet

- No staging environment separate from Preview deployments
- No monitoring/alerting (Vercel's own dashboard is the only visibility)
- No automated CI checks before merge (build success is only verified
  after deploy, not gating the push)
