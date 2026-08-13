import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReadinessSignals {
  overallScore: number;
  breakdown: {
    technical: number;
    communication: number;
    resumeDefense: number;
    behavioral: number;
  };
  completedInterviews: number;
  biggestGrowthArea: { name: string; frequency: number } | null;
  trainingCompletionRate: number; // 0-100
  averageTrainingImprovement: number | null; // null if no retries yet
}

/**
 * Computes readiness from real data only — averages of actual interview
 * DNA scores and actual training attempt improvement. No invented
 * numbers, per spec section 39 ("never a guarantee, just what the
 * practice sessions actually show").
 */
export async function computeReadinessSignals(
  supabase: SupabaseClient,
  userId: string
): Promise<ReadinessSignals> {
  // ---------- Interview DNA averages across all completed interviews ----------
  const { data: interviews } = await supabase
    .from("interviews")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed");

  const interviewIds = (interviews ?? []).map((i) => i.id);

  const { data: reports } = interviewIds.length
    ? await supabase
        .from("interview_reports")
        .select("interview_dna")
        .in("interview_id", interviewIds)
    : { data: [] };

  const dnaRows = (reports ?? [])
    .map((r) => r.interview_dna as Record<string, number> | null)
    .filter(Boolean) as Record<string, number>[];

  const avgDna = (key: string) => {
    const values = dnaRows.map((d) => d[key]).filter((v) => typeof v === "number");
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const technical = avgDna("accuracy");
  const communication = Math.round(
    (avgDna("relevance") + avgDna("structure")) / 2
  );
  const behavioral = avgDna("specificity");

  // ---------- Biggest / most frequent growth area ----------
  const { data: growthAreas } = await supabase
    .from("candidate_growth_areas")
    .select("*, growth_areas(name)")
    .eq("user_id", userId)
    .order("frequency_count", { ascending: false })
    .limit(1);

  const biggestGrowthArea = growthAreas?.[0]
    ? {
        name: (growthAreas[0] as any).growth_areas?.name ?? "Unknown",
        frequency: growthAreas[0].frequency_count ?? 1,
      }
    : null;

  // ---------- Training completion + improvement ----------
  const { data: plans } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", userId);

  const planIds = (plans ?? []).map((p) => p.id);

  const { data: exercises } = planIds.length
    ? await supabase
        .from("training_exercises")
        .select("id")
        .in("training_plan_id", planIds)
    : { data: [] };

  const exerciseIds = (exercises ?? []).map((e) => e.id);

  const { data: attempts } = exerciseIds.length
    ? await supabase
        .from("training_attempts")
        .select("*")
        .in("training_exercise_id", exerciseIds)
        .order("attempted_at", { ascending: true })
    : { data: [] };

  const attemptedExerciseIds = new Set((attempts ?? []).map((a) => a.training_exercise_id));
  const trainingCompletionRate =
    exerciseIds.length > 0
      ? Math.round((attemptedExerciseIds.size / exerciseIds.length) * 100)
      : 0;

  // Average improvement: for each exercise with 2+ attempts, last score - first score
  const attemptsByExercise = new Map<string, number[]>();
  for (const a of attempts ?? []) {
    const list = attemptsByExercise.get(a.training_exercise_id) ?? [];
    list.push(a.score ?? 0);
    attemptsByExercise.set(a.training_exercise_id, list);
  }
  const improvements: number[] = [];
  for (const scores of attemptsByExercise.values()) {
    if (scores.length >= 2) {
      improvements.push(scores[scores.length - 1] - scores[0]);
    }
  }
  const averageTrainingImprovement =
    improvements.length > 0
      ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)
      : null;

  // ---------- Overall score ----------
  // Base: average of the four breakdown dimensions. Small bonus for
  // demonstrated training improvement, capped so it can't dominate.
  const dimensions = [technical, communication, behavioral].filter((v) => v > 0);
  const base =
    dimensions.length > 0
      ? Math.round(dimensions.reduce((a, b) => a + b, 0) / dimensions.length)
      : 0;
  const improvementBonus =
    averageTrainingImprovement && averageTrainingImprovement > 0
      ? Math.min(10, Math.round(averageTrainingImprovement / 5))
      : 0;
  const overallScore = Math.min(100, base + improvementBonus);

  return {
    overallScore,
    breakdown: {
      technical,
      communication,
      resumeDefense: 0, // populated once resume defensibility (later phase) exists
      behavioral,
    },
    completedInterviews: interviewIds.length,
    biggestGrowthArea,
    trainingCompletionRate,
    averageTrainingImprovement,
  };
}
