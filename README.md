# InterviewReady AI

> Your interview isn't a test. It's a skill you can train.

An AI interview coach that researches the company, role, and panel you're
meeting, runs a realistic voice-and-video mock interview with a simulated
panel, and turns your performance into a personalized, evidence-based
training plan. No shame, no judgment — just improvement.

## What's built

- **Auth** — Supabase email/password, session refresh via middleware
- **Database** — 28+ tables, Row Level Security on every table
- **Landing page** — hero, emotional reassurance, FAQ, calm premium design
- **Onboarding** — company/role/panel/resume collection, auto-analyzes the
  resume on submit
- **Research engine** — real web search (Tavily) for company info, role
  research, and panel member research (experience, what the company says
  about them, real public statements) — every claim traceable to a source
- **Interview blueprint** — AI-generated structure (opening, resume deep
  dive, technical, system design, behavioral, etc.) and competency map,
  built from the real resume + JD + research
- **AI interviewer** — real camera/mic, an illustrated AI avatar with a
  live speaking indicator, browser speech-to-text/text-to-speech,
  multi-person panel simulation (the AI introduces and hands off between
  named panel members based on their inferred role), 4 interview tones
  (friendly/professional/challenging/pressure)
- **Interview report** — evidence-based strengths and growth areas,
  Interview DNA score breakdown, all grounded in real per-answer analysis
  collected during the interview
- **Training engine** — personalized drills per growth area, retry
  tracking with before/after improvement, a "Surprise Round" that targets
  an unexplored competency
- **Readiness score** — computed from real interview and training data,
  never a guarantee, tracked over time
- **Resume analysis** — real PDF/DOCX text extraction, structured
  candidate profile, and a "Resume Defense Map" of likely follow-up
  questions for specific claims
- **Final Prep** — a pre-interview summary pulling together everything
  collected: strengths, stories to keep ready, likely themes, questions
  to ask
- **Demo page** — a static walkthrough (`/demo`) for people who haven't
  signed up yet

See `ARCHITECTURE.md`, `DATABASE.md`, `AI_ARCHITECTURE.md`,
`RESEARCH_ENGINE.md`, and `INTERVIEW_ENGINE.md` for how each piece works.

## Stack

| Layer          | Choice                                              |
|----------------|--------------------------------------------------------|
| Frontend       | Next.js (App Router), React, TypeScript, Tailwind      |
| Backend        | Next.js Route Handlers                                 |
| Database       | Supabase PostgreSQL                                    |
| Auth           | Supabase Auth                                          |
| Storage        | Supabase Storage (private buckets)                      |
| AI             | Google Gemini (`gemini-3.5-flash-lite`), free tier      |
| Web research   | Tavily, free tier                                       |
| Email          | Resend (SMTP), free tier                                |
| Deployment     | Vercel                                                  |

## Getting started

See `SETUP.md` for the full step-by-step (Supabase project creation,
running the database migrations, getting free API keys, running locally).

## What's intentionally not built yet

- Automated tests (everything has been manually verified end-to-end, but
  there's no test suite)
- Usage limits / payment gateway (planned for after initial launch)
- Full accessibility audit (some improvements made — icon-button labels,
  reduced-motion support — but not a complete pass)
