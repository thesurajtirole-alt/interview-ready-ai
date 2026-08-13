import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeReadinessSignals } from "@/lib/readiness/compute";
import { generateReadinessNarrative } from "@/lib/ai/readiness-narrative";

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const signals = await computeReadinessSignals(supabase, user.id);

    if (signals.completedInterviews === 0) {
      return NextResponse.json(
        {
          error:
            "Complete at least one mock interview first — readiness is based on real practice data, not a guess.",
        },
        { status: 400 }
      );
    }

    const narrative = await generateReadinessNarrative({
      overallScore: signals.overallScore,
      completedInterviews: signals.completedInterviews,
      biggestGrowthAreaName: signals.biggestGrowthArea?.name ?? null,
      trainingCompletionRate: signals.trainingCompletionRate,
      averageTrainingImprovement: signals.averageTrainingImprovement,
    });

    const { data: readiness, error: readinessErr } = await supabase
      .from("readiness_scores")
      .insert({
        user_id: user.id,
        overall_score: signals.overallScore,
        breakdown: signals.breakdown,
        narrative: `${narrative.headline} ${narrative.explanation}`,
      })
      .select()
      .single();
    if (readinessErr) throw readinessErr;

    return NextResponse.json({
      ok: true,
      readiness: {
        ...signals,
        headline: narrative.headline,
        explanation: narrative.explanation,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Could not compute readiness right now." },
      { status: 500 }
    );
  }
}
