import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePrepPlan } from "@/lib/ai/prep-plan";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const ScheduleRequestSchema = z.object({
  targetId: uuidSchema,
  dailyPracticeMinutes: z.number().int().min(5).max(240),
});

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(ScheduleRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { targetId, dailyPracticeMinutes } = validation.data;

  const { data: target, error: targetErr } = await supabase
    .from("interview_targets")
    .select("*, companies(name), job_descriptions(title, interview_date)")
    .eq("id", targetId)
    .eq("user_id", user.id)
    .single();
  if (targetErr || !target) {
    return NextResponse.json({ error: "Interview target not found." }, { status: 404 });
  }

  const interviewDate = target.job_descriptions?.interview_date;
  if (!interviewDate) {
    return NextResponse.json(
      {
        error:
          "No interview date set for this target yet. Add one from the research page first.",
      },
      { status: 400 }
    );
  }

  const daysUntil = Math.ceil(
    (new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysUntil < 1) {
    return NextResponse.json(
      { error: "That interview date has already passed." },
      { status: 400 }
    );
  }

  const [{ data: plan }, { data: growthAreas }] = await Promise.all([
    supabase
      .from("interview_plans")
      .select("blueprint")
      .eq("job_description_id", target.job_description_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("candidate_growth_areas")
      .select("growth_areas(name)")
      .eq("user_id", user.id),
  ]);

  const blueprint = plan?.blueprint as
    | { highPriorityAreas: string[]; potentialChallengeAreas: string[] }
    | undefined;

  try {
    const prepPlan = await generatePrepPlan({
      roleTitle: target.job_descriptions?.title ?? "this role",
      companyName: target.companies?.name ?? "the company",
      daysUntilInterview: daysUntil,
      dailyPracticeMinutes,
      highPriorityAreas: blueprint?.highPriorityAreas ?? [],
      potentialChallengeAreas: blueprint?.potentialChallengeAreas ?? [],
      currentGrowthAreaNames: (growthAreas ?? []).map(
        (g: any) => g.growth_areas?.name
      ).filter(Boolean),
    });

    const { error: updateErr } = await supabase
      .from("interview_targets")
      .update({
        daily_practice_minutes: dailyPracticeMinutes,
        prep_plan: prepPlan,
      })
      .eq("id", targetId);
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, prepPlan });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Could not generate your prep plan." },
      { status: 500 }
    );
  }
}
