import { geminiGenerateJSON } from "./gemini";
import { parseModelJson } from "./parse-json";
import { z } from "zod";

const FinalPrepSchema = z.object({
  strongAreas: z.array(z.string()).min(1).max(3),
  thingsToRemember: z.array(z.string()).min(1).max(3),
  storiesToKeepReady: z.array(z.string()).min(1).max(3),
  likelyThemes: z.array(z.string()).min(1).max(5),
  questionsToAsk: z.array(z.string()).min(1).max(3),
  oneFinalThing: z.string(),
});
export type FinalPrep = z.infer<typeof FinalPrepSchema>;

/**
 * Synthesizes the "Final Prep" summary (spec section 44) from real data
 * already collected — company research, blueprint, resume defense map,
 * and any past interview reports. Never invents new claims; only
 * reorganizes what's already been established as real.
 */
export async function generateFinalPrep(input: {
  companyName: string;
  roleTitle: string;
  companyResearchSummary: string | null;
  highPriorityAreas: string[];
  potentialChallengeAreas: string[];
  questionsToPrepare: string[];
  questionsToAskSuggestions: string[];
  resumeDefenseClaims: string[];
  pastStrengths: string[];
  pastGrowthAreas: string[];
  readinessScore: number | null;
}): Promise<FinalPrep> {
  const prompt = `You are helping a candidate do their FINAL review right before a real interview for ${input.roleTitle} at ${input.companyName}. Everything below is real data already collected about their prep — synthesize it into a tight, confidence-building final summary. Do not invent new facts.

Company research: ${input.companyResearchSummary ?? "(none)"}
High-priority preparation areas: ${input.highPriorityAreas.join("; ") || "(none)"}
Potential challenge areas: ${input.potentialChallengeAreas.join("; ") || "(none)"}
Questions likely to come up: ${input.questionsToPrepare.join("; ") || "(none)"}
Suggested questions to ask them: ${input.questionsToAskSuggestions.join("; ") || "(none)"}
Specific resume claims to be ready to defend: ${input.resumeDefenseClaims.join("; ") || "(none)"}
Strengths observed in past practice: ${input.pastStrengths.join("; ") || "(none)"}
Growth areas observed in past practice: ${input.pastGrowthAreas.join("; ") || "(none)"}
Current readiness score: ${input.readinessScore ?? "(not yet measured)"}

Produce:
- 2-3 things they're genuinely strong at (from the strengths data)
- 2-3 things to remember (practical reminders, e.g. structure/pacing tips from growth areas)
- 2-3 specific stories/examples they should keep ready (from the resume defense claims)
- Up to 5 likely themes for this interview (from high-priority + challenge areas)
- 2-3 good questions to ask the interviewer
- 1 single most important final thing to focus on

Return ONLY JSON matching: {"strongAreas": [string], "thingsToRemember": [string], "storiesToKeepReady": [string], "likelyThemes": [string], "questionsToAsk": [string], "oneFinalThing": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return FinalPrepSchema.parse(parsed);
}
