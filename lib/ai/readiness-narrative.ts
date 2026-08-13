import { geminiGenerateJSON } from "./gemini";
import { parseModelJson } from "./parse-json";
import { z } from "zod";

const ReadinessNarrativeSchema = z.object({
  headline: z.string(),
  explanation: z.string(),
});
export type ReadinessNarrative = z.infer<typeof ReadinessNarrativeSchema>;

/**
 * Spec sections 39-40: never a guarantee, never "you're not ready" —
 * use language like "you're getting there" and name what's still
 * holding them back, or "you're looking ready" for strong signals.
 */
export async function generateReadinessNarrative(input: {
  overallScore: number;
  completedInterviews: number;
  biggestGrowthAreaName: string | null;
  trainingCompletionRate: number;
  averageTrainingImprovement: number | null;
}): Promise<ReadinessNarrative> {
  const prompt = `You are a supportive interview coach summarizing a candidate's readiness based on their actual practice data. Never guarantee an outcome ("you will get the job" is forbidden) and never say "you're not ready" — if the score is low, say something like "you're getting there" and name the one area still holding them back. If the score is strong, say something like "you're looking ready" and note any remaining minor polish areas.

DATA (all real, from their actual sessions):
Overall readiness score: ${input.overallScore}/100
Completed mock interviews: ${input.completedInterviews}
Most frequent growth area: ${input.biggestGrowthAreaName ?? "none identified yet"}
Training completion: ${input.trainingCompletionRate}%
Average improvement shown in retries: ${input.averageTrainingImprovement !== null ? `+${input.averageTrainingImprovement} points` : "not enough retries yet to measure"}

Write a short headline (3-6 words, like "You're getting there." or "You're looking ready.") and a 2-3 sentence explanation grounded in the actual numbers above.

Return ONLY JSON matching: {"headline": string, "explanation": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return ReadinessNarrativeSchema.parse(parsed);
}
