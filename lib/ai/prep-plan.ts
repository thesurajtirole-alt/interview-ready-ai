import { geminiGenerateJSON } from "./gemini";
import { parseModelJson } from "./parse-json";
import { z } from "zod";

const PrepPlanSchema = z.object({
  days: z
    .array(
      z.object({
        day: z.number(),
        focus: z.string(),
        activities: z.array(z.string()).min(1).max(3),
      })
    )
    .min(1),
});
export type PrepPlan = z.infer<typeof PrepPlanSchema>;

/**
 * Generates a realistic, time-aware day-by-day prep plan (spec section
 * 2.4-2.5). Explicitly scales activity count to the daily time budget —
 * a 10-minute day gets 1-2 short activities, a 60-minute day gets a
 * fuller session. Grounded in real high-priority/challenge areas from
 * the blueprint when available, not invented topics.
 */
export async function generatePrepPlan(input: {
  roleTitle: string;
  companyName: string;
  daysUntilInterview: number;
  dailyPracticeMinutes: number;
  highPriorityAreas: string[];
  potentialChallengeAreas: string[];
  currentGrowthAreaNames: string[];
}): Promise<PrepPlan> {
  // Cap the plan length — beyond ~14 days, planning day-by-day stops
  // being useful; group later days into weekly themes instead.
  const planDays = Math.min(input.daysUntilInterview, 14);

  const prompt = `Build a realistic ${planDays}-day interview preparation plan for a candidate interviewing for ${input.roleTitle} at ${input.companyName}. They have exactly ${input.daysUntilInterview} days until the interview and can realistically practice ${input.dailyPracticeMinutes} minutes per day — scale the plan honestly to that time budget. A 10-minute day should have 1 short, focused activity, not a packed schedule. A 60-minute day can have up to 3.

Real high-priority areas from their interview blueprint: ${input.highPriorityAreas.join("; ") || "(none yet)"}
Real potential challenge areas: ${input.potentialChallengeAreas.join("; ") || "(none yet)"}
Their current tracked growth areas from past practice: ${input.currentGrowthAreaNames.join("; ") || "(none yet — first time preparing)"}

Design a sensible progression: early days should cover fundamentals (self-introduction, resume walkthrough, company/role basics), middle days should target the specific high-priority and challenge areas above, and the final 1-2 days should be a full mock interview and light final review — never cram new material the day before.

Return ONLY JSON matching: {"days": [{"day": number, "focus": string, "activities": [string]}]} — exactly ${planDays} entries, day numbers 1 through ${planDays}.`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return PrepPlanSchema.parse(parsed);
}
