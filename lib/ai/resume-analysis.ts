import { geminiGenerateJSON } from "./gemini";
import { parseModelJson } from "./parse-json";
import { z } from "zod";

const ResumeAnalysisSchema = z.object({
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string(),
      highlights: z.array(z.string()),
    })
  ),
  skills: z.array(z.string()),
  projects: z.array(z.string()),
  achievements: z.array(z.string()),
  education: z.array(z.string()),
  certifications: z.array(z.string()),
  defenseMap: z.array(
    z.object({
      claim: z.string(), // a specific, quantified or notable claim from the resume
      possibleFollowUps: z.array(z.string()), // realistic interviewer follow-up questions
    })
  ),
});
export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

/**
 * Analyzes real resume text (never invents content not in the resume).
 * Spec section 12: extract structured facts, then build a "Resume
 * Defense Map" — the follow-up questions an interviewer would realistically
 * ask about specific claims, so the candidate can practice defending them.
 */
export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const prompt = `You are analyzing a real resume for an interview-prep tool. Extract ONLY what is actually written in the resume below — never invent experience, skills, or claims that aren't there.

RESUME TEXT:
${resumeText}

1. Extract structured facts: work experience (title, company, duration, 1-3 highlight bullets each), skills, projects, achievements, education, certifications.

2. Build a "Resume Defense Map": find 3-6 specific, notable, or quantified claims in the resume (e.g. "reduced costs by 30%", "led a team of 5", "built a system handling 10k requests/sec") and for each, list 2-3 realistic follow-up questions a real interviewer would ask to probe that claim (e.g. "What was the baseline before the 30% reduction?", "How was that measured?", "What was your individual contribution vs the team's?").

Return ONLY JSON matching: {"experience": [{"title": string, "company": string, "duration": string, "highlights": [string]}], "skills": [string], "projects": [string], "achievements": [string], "education": [string], "certifications": [string], "defenseMap": [{"claim": string, "possibleFollowUps": [string]}]}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return ResumeAnalysisSchema.parse(parsed);
}
