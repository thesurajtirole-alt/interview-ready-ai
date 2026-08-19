import { parseModelJson } from "./parse-json";
import { geminiGenerateJSON } from "./gemini";
import { NextQuestionSchema, type NextQuestion } from "./schemas";

interface NextQuestionInput {
  companyName: string;
  roleTitle: string;
  stage: string;
  stageFocus: string[];
  resumeSummary: string;
  transcriptSoFar: string; // formatted "Interviewer: ...\nCandidate: ..." history
  lastAnswer: string | null;
  mode: "friendly" | "professional" | "challenging" | "pressure";
  currentInterviewerName: string | null; // e.g. "Priya" — null if no named panel
  currentInterviewerPersona: string | null; // e.g. "Engineering Manager"
  isPersonaChange: boolean; // true if this question switches to a new panel member
}

/**
 * Generates the interviewer's next line, per spec sections 16-18:
 * one question at a time, references prior answers, follows up
 * naturally, never gives feedback or reveals a score mid-interview.
 * When a real named panel exists, this also handles natural handoffs
 * between panel members (spec section 18).
 */
export async function generateNextQuestion(
  input: NextQuestionInput
): Promise<NextQuestion> {
  const toneGuidance: Record<string, string> = {
    friendly: "warm, supportive, gives the candidate room to think",
    professional: "neutral, realistic, businesslike",
    challenging: "probing, asks deeper follow-ups than usual",
    pressure:
      "brisk and time-pressured. Introduce mild ambiguity (an underspecified scenario, a shifted constraint mid-question) and don't let vague answers slide — push for specifics quickly. You may briefly acknowledge an answer is taking long and redirect ('Let's move faster — in one sentence, what was the outcome?'). Never rude, never hostile, never personally critical — the pressure is about pace and precision, not tone.",
  };

  const speakerLine = input.currentInterviewerName
    ? `You are currently speaking as ${input.currentInterviewerName}, the ${input.currentInterviewerPersona}, on the interview panel.`
    : `You are the interviewer (no specific panel member identified for this question).`;

  const handoffLine = input.isPersonaChange && input.currentInterviewerName
    ? `\nThis question marks a handoff to a new panel member. Briefly and naturally introduce yourself by name and role before asking your question (e.g. "Thanks — I'll hand it over to ${input.currentInterviewerName}, our ${input.currentInterviewerPersona}, to dig into that." — but written as ${input.currentInterviewerName} speaking in first person). Keep the introduction to one short sentence, then ask your question.`
    : "";

  const prompt = `You are conducting a realistic mock job interview. You are interviewing for the role of ${input.roleTitle} at ${input.companyName}. Your tone right now: ${toneGuidance[input.mode]}.

${speakerLine}${handoffLine}

Current interview stage: ${input.stage}
This stage should focus on: ${input.stageFocus.join(", ") || "general fit for the role"}

Candidate's resume summary:
${input.resumeSummary || "(not provided)"}

Conversation so far:
${input.transcriptSoFar || "(this is the first question)"}

${input.lastAnswer ? `Candidate's most recent answer:\n${input.lastAnswer}` : "This is the opening question — introduce the interview briefly and ask your first question."}

Rules (do not break these):
- Ask exactly ONE question.
- If there's a previous answer, engage with what they actually said — reference it naturally, the way a real interviewer would. Never invent facts about their background that weren't stated.
- Never give feedback, a score, or coaching. Never say whether an answer was good or bad.
- Never repeat a question that's already been asked in the conversation above.
- Choose the action that best fits what just happened: follow_up (dig into what they said), clarify (ask them to clarify something vague), challenge (push back constructively), request_example (ask for a concrete example), request_metric (ask for numbers/results), request_tradeoff (ask about a tradeoff they made), increase_difficulty, change_topic (move to a new topic within this stage), or move_to_next_competency (wrap up this stage's line of questioning).
- Sound like natural spoken interview language — not a form label.

Return ONLY JSON matching: {"actionType": "follow_up"|"clarify"|"challenge"|"request_example"|"request_metric"|"request_tradeoff"|"increase_difficulty"|"change_topic"|"move_to_next_competency", "questionText": string}`;

  const raw = await geminiGenerateJSON(prompt);
  const parsed = parseModelJson(raw);
  return NextQuestionSchema.parse(parsed);
}

