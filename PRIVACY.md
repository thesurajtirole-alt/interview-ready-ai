# Privacy

## What this app collects

- Account info (email, via Supabase Auth)
- Company/role/interview details you enter during onboarding
- Your resume (stored privately, analyzed once, never shared)
- Interview transcripts and answers from mock interviews you run
- Panel member names/roles/LinkedIn URLs you choose to enter

## What the research engine does and doesn't do

The research engine (see `RESEARCH_ENGINE.md`) only searches for and
surfaces **publicly available professional information** — things
findable via a normal web search, like a company's own site or a
person's public LinkedIn presence. It does not:

- Search for private contact information
- Search personal (non-professional) social media
- Claim to know what a named panel member privately thinks — see the
  "Publicly stated approach" distinction in `RESEARCH_ENGINE.md`
- Store or resurface anything found for one user's research under
  another user's account (RLS-scoped by `user_id`)

## Data isolation

Every table has Row Level Security scoped to `auth.uid()`. A user's
resume, interviews, transcripts, and research are never visible to any
other user, enforced at the database level — not just hidden by the UI.

## What's stored where

- **Resume files**: Supabase Storage, private bucket, folder-scoped per
  user (`resumes/{user_id}/...`)
- **Interview recordings**: bucket exists (`recordings`) but is not
  currently used — no video/audio is recorded or uploaded anywhere; the
  camera feed is local-only (never leaves the browser)
- **AI processing**: resume text, job descriptions, and interview answers
  are sent to Google's Gemini API to generate responses. Gemini's free
  tier may use submitted prompts to improve their models — this is a
  Google policy, not something this app controls. Users should be told
  this plainly if the app goes to real users (not yet surfaced in the UI
  as of this writing).

## User control (partially implemented)

Per the original product spec, users should be able to delete their
resume, any interview, any research data, or their account entirely.
**Current state**: deletion is possible directly via Supabase (an admin
action), but there's no self-service "Delete my data" UI yet — this is a
gap that should be closed before any real users sign up, both for user
trust and for basic data-protection-law compliance in most jurisdictions.

## Known gaps before real users

- No self-service account/data deletion UI
- No explicit consent screen mentioning that resume/interview content is
  sent to a third-party AI provider (Gemini)
- No terms of service / privacy policy page
