import { geminiGenerateJSON } from "./gemini";
import { InterviewBlueprintSchema, type InterviewBlueprint } from "./schemas";

interface BlueprintInput {
  roleTitle: string;
  jobDescriptionText: string;
  companyName: string;
  companyResearchSummary: string | null;
  panelFocusAreas: string[];
}

export async function createInterviewBlueprint(
  input: BlueprintInput
): Promise<InterviewBlueprint> {
  const prompt = `You are helping a candidate prepare for a real job interview. Based ONLY on the information given below, produce a structured interview preparation blueprint as JSON.

Do not invent facts about the company or role that aren't implied by the text below. If research is thin, keep highPriorityAreas and potentialChallengeAreas grounded in what's actually provided.

ROLE: ${input.roleTitle}
COMPANY: ${input.companyName}

JOB DESCRIPTION:
${input.jobDescriptionText || "(not provided)"}

COMPANY RESEARCH SUMMARY:
${input.companyResearchSummary || "(not enough public information available)"}

INTERVIEW PANEL FOCUS AREAS (if known):
${input.panelFocusAreas.length > 0 ? input.panelFocusAreas.join(", ") : "(panel not yet known)"}

Return ONLY valid JSON matching this exact shape, nothing else:
{
  "competencies": [{"name": string, "weight": number (0-100, all weights should sum to ~100), "category": "technical"|"behavioral"|"leadership"|"communication"|"other"}],
  "stages": [{"stage": "opening"|"resume_deep_dive"|"technical"|"system_design"|"behavioral"|"leadership"|"candidate_questions", "percentage": number (0-100, all percentages should sum to ~100)}],
  "highPriorityAreas": [string, ...],
  "potentialChallengeAreas": [string, ...],
  "questionsToPrepare": [string, ...] (5-8 realistic interview questions for this specific role/company),
  "questionsToAsk": [string, ...] (3-5 smart questions the candidate could ask the interviewer)
}`;

  const raw = await geminiGenerateJSON(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI response wasn't valid JSON. Try again.");
  }

  const result = InterviewBlueprintSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI response didn't match the expected format: ${result.error.message}`
    );
  }

  return result.data;
}
