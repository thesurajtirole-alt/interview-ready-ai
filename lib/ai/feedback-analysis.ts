import { geminiGenerateJSON } from "./gemini";
import { parseModelJson } from "./parse-json";
import { z } from "zod";

const FeedbackAnalysisSchema = z.object({
  positives: z.array(z.string()),
  improvementAreas: z.array(z.string()),
  rejectionReason: z.string(), // must be "The company did not provide a specific reason." if none was given
  topicLabels: z.array(
    z.object({
      topic: z.string(),
      status: z.enum(["explicit", "strong_indication", "possible", "not_mentioned"]),
    })
  ),
  summary: z.string(),
});
export type FeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>;

/**
 * Analyzes real HR/interviewer feedback text. The single most important
 * rule in this file: NEVER invent a reason the company didn't give.
 * "We decided to move forward with another candidate" must be reported
 * as exactly that — not expanded into "you lacked technical skills."
 */
export async function analyzeFeedback(input: {
  roleTitle: string;
  companyName: string;
  feedbackText: string;
}): Promise<FeedbackAnalysis> {
  const prompt = `You are analyzing REAL feedback a candidate received from a company after a real interview for ${input.roleTitle} at ${input.companyName}. This is not a mock interview — treat every word as ground truth from the company, and never add anything beyond what's actually written.

FEEDBACK TEXT (paste from the candidate, verbatim):
${input.feedbackText}

Critical rules:
- Extract only what is explicitly stated. Never infer a rejection reason that wasn't given.
- If the feedback is vague ("we decided to move forward with another candidate," "not the right fit at this time"), the rejectionReason field must say exactly: "The company did not provide a specific reason." — do not guess why.
- For each topic that comes up (e.g. "System Design," "Communication," "Leadership"), label it explicit (directly stated), strong_indication (clearly implied by multiple signals in the text), possible (a reasonable but uncertain read), or not_mentioned (only include topics that actually appear or are clearly implied — don't invent topics never referenced).
- List positives and improvement areas only if the text actually supports them.
- Write a short, factual 1-2 sentence summary — no motivational language, no speculation.

Return ONLY JSON matching: {"positives": [string], "improvementAreas": [string], "rejectionReason": string, "topicLabels": [{"topic": string, "status": "explicit"|"strong_indication"|"possible"|"not_mentioned"}], "summary": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return FeedbackAnalysisSchema.parse(parsed);
}
