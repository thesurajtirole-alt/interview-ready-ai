import { z } from "zod";

export const CompetencySchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(100),
  category: z.enum(["technical", "behavioral", "leadership", "communication", "other"]),
});

export const BlueprintStageSchema = z.object({
  stage: z.enum([
    "opening",
    "resume_deep_dive",
    "technical",
    "system_design",
    "behavioral",
    "leadership",
    "candidate_questions",
  ]),
  percentage: z.number().min(0).max(100),
});

export const InterviewBlueprintSchema = z.object({
  competencies: z.array(CompetencySchema).min(1),
  stages: z.array(BlueprintStageSchema).min(1),
  highPriorityAreas: z.array(z.string()).min(1),
  potentialChallengeAreas: z.array(z.string()),
  questionsToPrepare: z.array(z.string()).min(1),
  questionsToAsk: z.array(z.string()).min(1),
});

export type InterviewBlueprint = z.infer<typeof InterviewBlueprintSchema>;

export const NextQuestionSchema = z.object({
  actionType: z.enum([
    "follow_up",
    "clarify",
    "challenge",
    "request_example",
    "request_metric",
    "request_tradeoff",
    "increase_difficulty",
    "change_topic",
    "move_to_next_competency",
  ]),
  questionText: z.string().min(1),
});
export type NextQuestion = z.infer<typeof NextQuestionSchema>;

export const AnswerAnalysisSchema = z.object({
  relevance: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  structure: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  strengths: z.array(z.string()),
  growthAreas: z.array(z.string()),
  recommendation: z.string(),
});
export type AnswerAnalysis = z.infer<typeof AnswerAnalysisSchema>;
