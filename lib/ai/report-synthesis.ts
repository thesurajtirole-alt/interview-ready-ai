import { parseModelJson } from "./parse-json";
import { geminiGenerateJSON } from "./gemini";
import { z } from "zod";

const ReportNarrativeSchema = z.object({
  strengths: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .min(1),
  growthAreas: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        recommendation: z.string(),
      })
    )
    .min(1),
  summary: z.string(),
});
export type ReportNarrative = z.infer<typeof ReportNarrativeSchema>;

/**
 * Turns the raw per-answer evidence (already collected during the
 * interview) into the supportive "here's what we noticed" narrative,
 * per spec sections 26-30. This does NOT invent new evaluation —
 * it only synthesizes what evaluateAnswer already found.
 */
export async function synthesizeReport(input: {
  roleTitle: string;
  companyName: string;
  allEvidence: string[];
  allStrengths: string[];
  allGrowthAreas: string[];
  allRecommendations: string[];
}): Promise<ReportNarrative> {
  const prompt = `You are writing a supportive post-interview summary for a candidate who just completed a mock interview for ${input.roleTitle} at ${input.companyName}. You are NOT evaluating anything new — you're synthesizing the evidence already collected during the interview into a warm, evidence-based narrative. Never use shaming language, never say "failed," never compare to other candidates.

Evidence collected across all answers:
${input.allEvidence.join("\n") || "(none)"}

Strengths noted across all answers:
${input.allStrengths.join("\n") || "(none)"}

Growth areas noted across all answers:
${input.allGrowthAreas.join("\n") || "(none)"}

Recommendations noted across all answers:
${input.allRecommendations.join("\n") || "(none)"}

Group the raw notes above into 2-4 clear STRENGTHS (a short title + a sentence explaining it, grounded in the evidence given) and 1-3 clear GROWTH AREAS (a short title, a sentence describing the pattern observed — never a character judgment — and one concrete, actionable recommendation). Then write a 2-3 sentence overall summary in a warm, encouraging tone.

Return ONLY JSON matching: {"strengths": [{"title": string, "description": string}], "growthAreas": [{"title": string, "description": string, "recommendation": string}], "summary": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return ReportNarrativeSchema.parse(parsed);
}

