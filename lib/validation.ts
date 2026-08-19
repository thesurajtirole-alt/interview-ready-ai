import { z } from "zod";

/**
 * Shared UUID validator — every foreign-key-style ID coming from the
 * client should be validated as a real UUID before hitting the database,
 * rather than trusting whatever string was sent.
 */
export const uuidSchema = z.string().uuid("Not a valid ID.");

/**
 * Length caps on free-text fields the user can submit. These exist for
 * two reasons: (1) protect against abuse that could rack up real AI
 * costs (spec section 63's cost-control goal), and (2) keep prompts
 * within a sane size so AI responses stay focused and fast.
 */
export const answerTextSchema = z
  .string()
  .trim()
  .min(1, "Answer can't be empty.")
  .max(4000, "That answer is unusually long — please keep it under 4000 characters.");

export const trainingResponseSchema = z
  .string()
  .trim()
  .min(1, "Response can't be empty.")
  .max(3000, "That response is unusually long — please keep it under 3000 characters.");

export const jobDescriptionTextSchema = z
  .string()
  .trim()
  .max(20000, "That job description is unusually long — please keep it under 20,000 characters.");

export const interviewModeSchema = z
  .enum(["friendly", "professional", "challenging", "pressure"])
  .default("professional");

/**
 * Parses a request body against a schema and returns either the parsed
 * data or a ready-to-return NextResponse with a clear error message —
 * so every route can validate with the same two lines instead of
 * duplicating try/catch boilerplate.
 */
export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid request.",
    };
  }
  return { success: true, data: result.data };
}
