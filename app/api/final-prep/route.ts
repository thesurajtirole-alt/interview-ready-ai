import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFinalPrep } from "@/lib/ai/final-prep";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const FinalPrepRequestSchema = z.object({ companyId: uuidSchema });

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(FinalPrepRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { companyId } = validation.data;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .eq("user_id", user.id)
    .single();
  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const [{ data: research }, { data: jd }, { data: resume }] = await Promise.all([
    supabase
      .from("company_research")
      .select("summary")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("job_descriptions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("resume_defense_map")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: plan } = jd
    ? await supabase
        .from("interview_plans")
        .select("blueprint")
        .eq("job_description_id", jd.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const blueprint = plan?.blueprint as
    | {
        highPriorityAreas: string[];
        potentialChallengeAreas: string[];
        questionsToPrepare: string[];
        questionsToAsk: string[];
      }
    | undefined;

  // Past interview reports for this company, if any.
  const { data: pastInterviews } = jd
    ? await supabase
        .from("interviews")
        .select("id, interview_plans!inner(job_description_id)")
        .eq("user_id", user.id)
        .eq("interview_plans.job_description_id", jd.id)
    : { data: [] };

  const interviewIds = (pastInterviews ?? []).map((i) => i.id);
  const { data: reports } = interviewIds.length
    ? await supabase
        .from("interview_reports")
        .select("strengths, growth_areas")
        .in("interview_id", interviewIds)
    : { data: [] };

  const { data: readiness } = await supabase
    .from("readiness_scores")
    .select("overall_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pastStrengths = (reports ?? []).flatMap(
    (r) => (r.strengths as any[])?.map((s) => s.title) ?? []
  );
  const pastGrowthAreas = (reports ?? []).flatMap(
    (r) => (r.growth_areas as any[])?.map((g) => g.title) ?? []
  );
  const resumeDefenseClaims = ((resume?.resume_defense_map as any[]) ?? []).map(
    (d) => d.claim
  );

  try {
    const finalPrep = await generateFinalPrep({
      companyName: company.name,
      roleTitle: jd?.title ?? "this role",
      companyResearchSummary: research?.summary ?? null,
      highPriorityAreas: blueprint?.highPriorityAreas ?? [],
      potentialChallengeAreas: blueprint?.potentialChallengeAreas ?? [],
      questionsToPrepare: blueprint?.questionsToPrepare ?? [],
      questionsToAskSuggestions: blueprint?.questionsToAsk ?? [],
      resumeDefenseClaims,
      pastStrengths,
      pastGrowthAreas,
      readinessScore: readiness?.overall_score ?? null,
    });

    return NextResponse.json({ ok: true, finalPrep });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Could not generate final prep." },
      { status: 500 }
    );
  }
}
