# Setup — Phase 1

This scaffold was hand-written in a sandbox with no internet access, so it
has **not** been through `npm install` / `npm run build` yet. Run these
steps locally to verify it (this matches the check required in section 72
of the build spec: lint, typecheck, build must pass before moving to Phase 2).

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to https://supabase.com and create a new project (free tier).
2. In Project Settings → API, copy the Project URL and the `anon` public key.
3. In Project Settings → API, copy the `service_role` key (server-only — keep secret).

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Leave `AI_PROVIDER=mock` for now — the real provider integrations land in
Phase 9 (AI interviewer).

## 4. Enable email auth in Supabase

Authentication → Providers → Email should be enabled by default. For local
dev, Authentication → URL Configuration → Site URL should be
`http://localhost:3000`, and Redirect URLs should include
`http://localhost:3000/auth/callback`.

## 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Try:
- `/signup` → creates a Supabase auth user, sends a confirmation email
- confirming the email → redirects to `/auth/callback` → `/onboarding`
- `/login` → signs in → redirects to `/dashboard`
- visiting `/dashboard` while logged out → redirected to `/login` (middleware working)

## 6. Verify before moving to Phase 2

```bash
npm run lint
npm run typecheck
npm run build
```

All three must pass cleanly.

## What's intentionally NOT in Phase 1

Per the phased plan, these are explicitly later phases, not missing bugs:
- Database schema / migrations / RLS → Phase 2
- Full landing page & design system → Phase 3
- Resume/JD upload & onboarding conversation → Phase 4
- Company/panel research engine → Phase 5
- Everything AI-provider-related (`/lib/ai`) → Phase 9+
