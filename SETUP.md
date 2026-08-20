# Setup

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to https://supabase.com and create a new project (free tier).
2. Project Settings → API → copy the Project URL, `anon` public key, and
   `service_role` key.

## 3. Run the database migrations

In Supabase's SQL Editor, run every file in `supabase/migrations/` **in
numeric order** (0001, 0002, 0003, ... 0011). See `DATABASE.md` for what
each one does and why the order matters.

## 4. Get free API keys

- **Gemini** (AI): https://aistudio.google.com → Get API key → Create key
  in a new/default project. Do NOT enable billing — stay on the free
  tier. Confirm on the Rate Limit page it shows "Free tier."
- **Tavily** (web research): https://tavily.com → sign up → API key is
  shown on the dashboard, no card required (1,000 credits/month free).
- **Resend** (email, for auth confirmation emails): https://resend.com →
  sign up → API Keys → Create. Then in Supabase: Authentication → Emails
  / SMTP Settings → enable Custom SMTP with:
  - Host: `smtp.resend.com`, Port: `465`, Username: `resend`
  - Password: your Resend API key
  - Sender: `onboarding@resend.dev` (works without domain verification)

  (Supabase's own built-in email sender works too, but is rate-limited
  to only a few emails/hour — fine for a first quick test, not for
  repeated testing.)

## 5. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all six values (see `.env.example` for the exact variable
names).

## 6. Configure Supabase auth redirect URLs

Authentication → URL Configuration:
- Site URL: `http://localhost:3000` for local dev (change to your real
  domain once deployed — see below)
- Redirect URLs: add `http://localhost:3000/auth/callback` (and your
  production equivalent once deployed)

## 7. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 8. Verify before deploying

```bash
npm run build
```

Must complete with no errors before pushing — this runs the same checks
Vercel's build will run.

## Deploying

See `DEPLOYMENT.md`. Short version: push to GitHub, connect the repo to
a new Vercel project, add the same 6 environment variables in Vercel's
project settings (for both Production and Preview), deploy. Then update
Supabase's Site URL / Redirect URLs to your real `.vercel.app` domain —
this step is easy to forget and causes email confirmation links to
point at `localhost` in production.
