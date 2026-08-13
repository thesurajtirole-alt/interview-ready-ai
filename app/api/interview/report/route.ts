import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { synthesizeReport } from "@/lib/ai/report-synthesis";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { interviewId } = await request.json();
  if (!interviewId) {
    return NextResponse.json({ error: "interviewId is required." }, { status: 400 });
  }

  const { data: interview, error: interviewErr } = await supabase
    .from("interviews")
    .select("*, interview_plans(*, job_descriptions(*, companies(*)))")
    .eq("id", interviewId)
    .single();
  if (interviewErr || !interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  // Pull every answer + its analysis for this interview, via the
  // question -> answer -> analysis chain.
  const { data: questions } = await supabase
    .from("interview_questions")
    .select("id")
    .eq("interview_id", interviewId);

  const questionIds = (questions ?? []).map((q) => q.id);
  if (questionIds.length === 0) {
    return NextResponse.json(
      { error: "No questions found for this interview." },
      { status: 400 }
    );
  }

  const { data: answers } = await supabase
    .from("interview_answers")
    .select("id")
    .in("interview_question_id", questionIds);

  const answerIds = (answers ?? []).map((a) => a.id);

  const { data: analyses } = await supabase
    .from("answer_analysis")
    .select("*")
    .in("interview_answer_id", answerIds);

  if (!analyses || analyses.length === 0) {
    return NextResponse.json(
      {
        error:
          "Answer analysis isn't ready yet — this runs in the background during the interview. Wait a few seconds and try again.",
      },
      { status: 400 }
    );
  }

  // ---------- Compute Interview DNA (real averages, not invented) ----------
  const avg = (key: "relevance" | "accuracy" | "structure" | "specificity") =>
    Math.round(
      analyses.reduce((sum, a) => sum + (a[key] ?? 0), 0) / analyses.length
    );

  const interviewDna = {
    relevance: avg("relevance"),
    accuracy: avg("accuracy"),
    structure: avg("structure"),
    specificity: avg("specificity"),
  };

  const allEvidence = analyses.flatMap((a) => a.evidence ?? []);
  const allStrengths = analyses.flatMap((a) => a.strengths ?? []);
  const allGrowthAreas = analyses.flatMap((a) => a.growth_areas ?? []);
  const allRecommendations = analyses
    .map((a) => a.recommendation)
    .filter(Boolean);

  const jd = interview.interview_plans?.job_descriptions;
  const company = jd?.companies;

  try {
    const narrative = await synthesizeReport({
      roleTitle: jd?.title ?? "this role",
      companyName: company?.name ?? "the company",
      allEvidence,
      allStrengths,
      allGrowthAreas,
      allRecommendations,
    });

    // Persist growth areas as their own rows for later cross-interview
    // tracking (spec section 34) — and attach each real id back onto the
    // narrative so the report page can link straight into training.
    const growthAreasWithIds = await Promise.all(
      narrative.growthAreas.map(async (g) => {
        const { data: existingArea } = await supabase
          .from("growth_areas")
          .select("id")
          .eq("name", g.title)
          .maybeSingle();

        const areaId =
          existingArea?.id ??
          (
            await supabase
              .from("growth_areas")
              .insert({ name: g.title, description: g.description })
              .select()
              .single()
          ).data?.id;

        if (areaId) {
          await supabase.from("candidate_growth_areas").upsert(
            {
              user_id: user.id,
              growth_area_id: areaId,
              last_observed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,growth_area_id" }
          );
        }

        return { ...g, growthAreaId: areaId ?? null };
      })
    );

    const { data: report, error: reportErr } = await supabase
      .from("interview_reports")
      .insert({
        interview_id: interviewId,
        strengths: narrative.strengths,
        growth_areas: growthAreasWithIds,
        interview_dna: interviewDna,
        summary: narrative.summary,
      })
      .select()
      .single();
    if (reportErr) throw reportErr;

    return NextResponse.json({
      ok: true,
      reportId: report.id,
      report: {
        strengths: narrative.strengths,
        growthAreas: growthAreasWithIds,
        summary: narrative.summary,
        interviewDna,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Report generation failed." },
      { status: 500 }
    );
  }
}
