# Database

PostgreSQL via Supabase. Every table has Row Level Security enabled —
this is the primary security boundary, not application-layer checks.

## Migration order

Run these, in this exact order, in Supabase's SQL Editor:

1. `0001_core_schema.sql` — all 28 tables, indexes, the `handle_new_user`
   trigger (auto-creates a `profiles` row on signup)
2. `0002_rls_policies.sql` — RLS policies for every table
3. `0003_storage_buckets.sql` — private `resumes` and `recordings` buckets
4. `0004_profile_confidence.sql` — adds the onboarding confidence-check column
5. `0005_fix_grants.sql` — **required**: grants base table access to
   Supabase's `anon`/`authenticated`/`service_role` roles. Without this,
   every insert fails with "permission denied for table X" even though
   RLS policies look correct — RLS only *restricts* access to a table you
   already have base permission on.
6. `0006_fix_stage_constraint.sql` — fixes a mismatch between an early
   schema's stage names and what the blueprint actually generates
7. `0007_report_growth_areas.sql` — adds growth-area storage to reports
8. `0008_growth_areas_insert.sql` — allow-insert policy for the
   `growth_areas` reference table (see RESEARCH_ENGINE.md for why this
   was needed)
9. `0009_interviewer_research_fields.sql` — experience/company
   description/public statements columns
10. `0010_skills_insert.sql` — same allow-insert fix as #8, for `skills`
11. `0011_question_interviewer.sql` — tracks which panel member asked
    each question

If you're setting this up fresh, run all 11 in order. If something
breaks partway through, there are `0000_cleanup.sql`-style patterns used
during development (drop-and-retry) — check chat history for the exact
cleanup script if you need to reset a partial migration.

## Table groups

**Identity**: `profiles` (1:1 with `auth.users`, includes
`confidence_level`)

**Candidate setup**: `candidate_profiles` (resume-derived facts),
`resumes` (file + Resume Defense Map), `skills` / `candidate_skills`

**Company & role**: `companies`, `company_research`, `job_descriptions`,
`role_competencies`

**Panel**: `interviewers`, `interviewer_research`, `interview_panels`,
`interview_participants` (has `panel_persona`)

**Research traceability**: `research_sources` — every research claim
anywhere in the app points back to a row here with a real URL and a
confidence label

**Interview lifecycle**: `interview_plans` (the blueprint),
`interviews` (one session; `status` is `in_progress` / `completed` /
`abandoned`), `interview_questions` (now includes `interviewer_name` and
`panel_persona`), `interview_answers`, `transcripts`, `answer_analysis`,
`interview_reports`

**Growth & training**: `growth_areas` (shared reference table — see the
insert-policy gotcha in RESEARCH_ENGINE.md), `candidate_growth_areas`
(per-user tracking), `training_plans`, `training_exercises`,
`training_attempts`

**Progress**: `progress_snapshots` (unused so far — reserved for future
use), `readiness_scores`

**Cost control**: `usage` — table exists but is not yet wired up to any
enforcement logic (planned before public launch)

## Storage buckets

Both private, folder-scoped by `auth.uid()` — a user can only read/write
files under `resumes/{their-user-id}/...` or `recordings/{their-user-id}/...`.

- `resumes` — actively used (onboarding upload → `/api/resume/analyze`)
- `recordings` — bucket exists, not yet wired to any recording feature
