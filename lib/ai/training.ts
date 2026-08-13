import { geminiGenerateJSON } from "./gemini";
import { z } from "zod";

const TrainingPlanSchema = z.object({
  planTitle: z.string(),
  exercises: z
    .array(
      z.object({
        title: z.string(),
        instructions: z.string(),
      })
    )
    .min(3)
    .max(5),
});
export type GeneratedTrainingPlan = z.infer<typeof TrainingPlanSchema>;

/**
 * Generates a short, focused drill sequence for one growth area, per
 * spec section 36 (e.g. progressively tighter time limits, or a
 * structural reframe like Situation -> Action -> Result). Coach tone,
 * never clinical or shaming (section 37).
 */
export async function generateTrainingPlan(input: {
  growthAreaName: string;
  growthAreaDescription: string;
  roleTitle: string;
}): Promise<GeneratedTrainingPlan> {
  const prompt = `You are a warm, supportive interview coach designing a short practice drill sequence for one specific growth area a candidate showed during a mock interview for a ${input.roleTitle} role.

Growth area: ${input.growthAreaName}
What was observed: ${input.growthAreaDescription}

Design 3-4 short, concrete drills that directly train this one skill. Good patterns to draw from: progressively tighter time constraints (e.g. answer in 90 seconds, then 60, then 30), a structural reframe (e.g. rewrite the same answer using Situation -> Action -> Result, or Answer -> Reason -> Example -> Result), or a specific constraint that forces the skill (e.g. "answer without using any filler words", "lead with the number first"). Each drill should build on the last. Keep instructions short, clear, and encouraging in tone — never clinical.

Return ONLY JSON matching: {"planTitle": string, "exercises": [{"title": string, "instructions": string}]} — 3 to 4 exercises.`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = JSON.parse(stripFence(raw));
  return TrainingPlanSchema.parse(parsed);
}

const AttemptFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string(),
});
export type AttemptFeedback = z.infer<typeof AttemptFeedbackSchema>;

/**
 * Evaluates one practice attempt. Spec section 37: coach language,
 * always on the candidate's side ("Let's try that again," "Nice
 * improvement") — never a cold pass/fail verdict.
 */
export async function evaluateAttempt(input: {
  exerciseInstructions: string;
  response: string;
  attemptNumber: number;
}): Promise<AttemptFeedback> {
  const prompt = `You are a warm, supportive interview coach. The candidate just completed practice attempt #${input.attemptNumber} on this drill:

DRILL INSTRUCTIONS: ${input.exerciseInstructions}

THEIR RESPONSE: ${input.response}

Score how well this attempt followed the drill's specific instructions (0-100) and give one short paragraph of coach-style feedback — encouraging, specific, on their side. If this isn't their first attempt, feel free to note improvement if you see it. Never say "wrong" or "bad" — say things like "let's try that again" or "that's better, now let's tighten it further."

Return ONLY JSON matching: {"score": number, "feedback": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = JSON.parse(stripFence(raw));
  return AttemptFeedbackSchema.parse(parsed);
}

function stripFence(raw: string): string {
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return raw.replace(/^```json\s*|```\s*$/g, "").trim();
  }
}
