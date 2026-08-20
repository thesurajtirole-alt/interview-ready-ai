# AI Architecture

## Provider

Currently only **Google Gemini** (`gemini-3.5-flash-lite`) is implemented,
via `lib/ai/gemini.ts`. This model was chosen because it has a genuinely
usable free tier (500 requests/day, 15 requests/minute at time of
writing — check `aistudio.google.com` → Rate Limit for current numbers).

There is no runtime provider-switching (no `openai.ts`/`mock.ts`) — if you
want to add another provider, follow the pattern in `gemini.ts`
(`geminiGenerateJSON(prompt) → string`) and swap the import in whichever
`lib/ai/*.ts` file you want to change.

## Every AI call, in order of the user journey

| File | Called from | What it does |
|------|-------------|---------------|
| `resume-analysis.ts` | `/api/resume/analyze` | Extracts structured experience/skills/projects and builds the Resume Defense Map from real resume text |
| `interview-blueprint.ts` | `/api/blueprint` | Builds the interview structure + competency map from resume + JD + research |
| `interview-question.ts` | `/api/interview/start`, `/api/interview/answer` | Generates the interviewer's next line — one question, references prior answers, handles panel handoffs |
| `answer-evaluation.ts` | `/api/interview/answer` (background) | Scores one answer: relevance, accuracy, structure, specificity + evidence |
| `report-synthesis.ts` | `/api/interview/report` | Turns all the per-answer evidence into the strengths/growth-areas narrative |
| `training.ts` | `/api/training/generate`, `/api/training/attempt`, `/api/training/surprise` | Generates drill sequences and scores practice attempts |
| `readiness-narrative.ts` | `/api/readiness/generate` | Writes the "You're getting there" / "You're looking ready" summary from real computed numbers |
| `final-prep.ts` | `/api/final-prep` | Synthesizes everything collected into a pre-interview cheat sheet |

## Structured output pattern

Every function follows the same shape:

```ts
const raw = await geminiGenerateJSON(prompt); // prompt asks for JSON only
const parsed = parseModelJson(raw);            // repairs common LLM JSON quirks
return SomeZodSchema.parse(parsed);            // throws if the shape is wrong
```

`parseModelJson` (`lib/ai/parse-json.ts`) exists because Gemini
occasionally produces almost-valid JSON — a stray trailing comma, or a
markdown code fence despite `responseMimeType: "application/json"`. It
tries increasingly forgiving repairs before giving up.

## Prompt design principles actually followed here

- **Never invent facts.** Every prompt that touches a candidate's
  background explicitly says not to invent experience/skills/claims not
  present in the input.
- **Never reveal a score mid-interview.** The live interviewer prompt
  explicitly forbids feedback, scores, or "that was good/bad" language.
- **Supportive tone is a hard requirement, not a suggestion.** Report and
  training prompts explicitly ban words like "failed" and require growth
  areas to be framed as patterns, not character judgments.
- **Panel handoffs are explicit, not inferred by the model.** The
  application code (not the AI) decides which panel member speaks next
  (`lib/interview/panel-persona.ts`); the prompt just tells the model who
  it currently is and whether to introduce a handoff.

## Cost control

- Model: `gemini-3.5-flash-lite` — the cheapest text-capable Gemini tier.
- No `temperature`/sampling params are set for 3.x models (deprecated for
  this model family — just left at defaults).
- Free tier is genuinely usable for testing and a small beta (~25-30 full
  interviews/day, shared across all users — see the "Cost & Scaling"
  section of the chat history for the original napkin math, or just
  re-check current numbers at `aistudio.google.com`).
- Per-user usage limits (spec section 63) are **not yet implemented** —
  planned for right before public launch, alongside a real (cheap)
  billing account once traffic exceeds the free tier.
