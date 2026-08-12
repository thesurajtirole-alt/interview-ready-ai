const TOTAL_QUESTION_BUDGET = 8;

export interface StageProgress {
  stage: string;
  targetCount: number;
  askedCount: number;
}

/**
 * Converts the blueprint's stage percentages into a concrete question
 * plan (spec section 14: "Do not use a fixed question list" — the
 * percentages are per-interview, not a hardcoded script).
 */
export function buildStagePlan(
  stages: { stage: string; percentage: number }[]
): { stage: string; targetCount: number }[] {
  return stages
    .filter((s) => s.percentage > 0)
    .map((s) => ({
      stage: s.stage,
      targetCount: Math.max(
        1,
        Math.round((s.percentage / 100) * TOTAL_QUESTION_BUDGET)
      ),
    }));
}

/**
 * Given the plan and how many questions have already been asked per
 * stage, returns the current stage to continue with, or null if the
 * interview is complete.
 */
export function currentStage(
  plan: { stage: string; targetCount: number }[],
  askedCountByStage: Record<string, number>
): string | null {
  for (const s of plan) {
    const asked = askedCountByStage[s.stage] ?? 0;
    if (asked < s.targetCount) return s.stage;
  }
  return null;
}
