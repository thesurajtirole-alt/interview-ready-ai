# Research Engine

## Provider

**Tavily** (`lib/research/tavily.ts`) — free tier, 1,000 credits/month, no
card required. Used for company research, role research, and interviewer
research. There is no fallback search provider currently.

## Privacy rule this engine follows

Per the product's core privacy principle: research only surfaces
**publicly available professional information**. It never attempts to
find private contact info, personal social media, or anything outside a
professional context. Interviewer research specifically avoids claiming
to know what someone privately thinks — see "Publicly stated approach"
below.

## Company research (`researchCompany`)

Runs three parallel Tavily searches:
1. `{company} {website} company overview industry`
2. `{company} products services business model`
3. `{company} news 2026` (recent developments)

Each search's top results become `ResearchFinding` objects — the raw
Tavily snippet is used directly as the "summary" (never LLM-paraphrased),
so nothing here is invented. Confidence is set from Tavily's own
relevance score (`strong_indication` above a threshold, `possible`
otherwise).

Saved to: `company_research` (one summary row) + `research_sources` (one
row per finding, every one with a real source URL).

## Role research (`researchRole`)

A single search: `{role title} responsibilities skills [{company}]`.
Currently generated but not surfaced anywhere in the UI yet — the
findings exist in the function's return value for future use.

## Interviewer research (`researchInterviewer`)

The most privacy-sensitive part of the app. Runs three parallel searches:

1. **Profile search** — `{name} {company} {linkedin url}` (or a generic
   LinkedIn search if no URL was given)
2. **Company-site search** — `{name} {company} team {website}`, filtered
   to only count as a "company description" if the result's URL actually
   matches the company's own domain (prevents misattributing an
   unrelated page)
3. **Public-statement search** — `"{name}" {company} quote OR interview
   OR article` — **deliberately scoped to include the company name**,
   because searching on a person's name alone risks pulling in a
   different real person who happens to share that name. Results are
   additionally filtered to only keep ones that mention the company
   somewhere in the text.

From the profile search results, a simple keyword match (not an LLM
call) extracts "expertise" terms (AWS, Kubernetes, CRM, etc.) and a
years-of-experience figure — but only if a number is **explicitly stated**
in the text (regex match on "N years experience"); never estimated.

Saved to: `interviewer_research` (summary, expertise, years_experience,
company_description, public_statements) + `research_sources`.

### Known limitation

Free-text web search cannot guarantee 100% person disambiguation for
common names, even with the company-context filtering above. This is a
fundamental constraint of using a general search API rather than a paid,
verified people-data API — worth keeping in mind when evaluating result
quality, especially for common names.

## Database permission gotcha (already fixed, documented so it doesn't
## happen again)

`growth_areas` and `skills` were originally set up as **read-only**
reference tables (only a `select` RLS policy). Since the app needs to
insert new entries into both as it discovers them (a new growth area
name, a new skill from a resume), inserts silently failed — the API
routes didn't check the insert's error, so nothing crashed, but nothing
saved either. Fixed by migrations `0008_growth_areas_insert.sql` and
`0010_skills_insert.sql`, which add an `insert` policy for authenticated
users. If you add another shared reference table later, remember it
needs both a `select` policy (public read) and an `insert` policy (if the
app writes to it), not just one.
