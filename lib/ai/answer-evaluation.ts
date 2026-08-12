import { geminiGenerateJSON } from "./gemini";
import { AnswerAnalysisSchema, type AnswerAnalysis } from "./schemas";

/**
 * Evaluates a single answer. Per spec sections 25 and 29: evidence-based,
 * never shaming, no hidden "score you have to defend" language — growth
 * areas are described as patterns to work on, not character flaws.
 */
export async function evaluateAnswer(input: {
  question: string;
  answer: string;
}): Promise<AnswerAnalysis> {
  const prompt = `You evaluate one interview answer. Be evidence-based and supportive — never shaming, never harsh. Score relevance, accuracy, structure, and specificity from 0-100 based only on what's observably true in the answer (don't guess at intent). List concrete evidence you noticed (specific patterns or phrases, not vague impressions), genuine strengths, and growth areas described as patterns to work on — never as character flaws or a verdict on the person. End with one supportive, actionable recommendation.

QUESTION: ${input.question}

CANDIDATE'S ANSWER: ${input.answer}

Return ONLY JSON matching: {"relevance": number, "accuracy": number, "structure": number, "specificity": number, "evidence": [string, ...], "strengths": [string, ...], "growthAreas": [string, ...], "recommendation": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = JSON.parse(stripFence(raw));
  return AnswerAnalysisSchema.parse(parsed);
}

function stripFence(raw: string): string {
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return raw.replace(/^```json\s*|```\s*$/g, "").trim();
  }
}
