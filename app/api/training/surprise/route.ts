import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTrainingPlan } from "@/lib/ai/training";

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Find competencies from the candidate's role that haven't shown up as
  // a tracked growth area yet — those are "unexplored."
  const [{ data: jd }, { data: existingGrowthAreas }] = await Promise.all([
    supabase
      .from("job_descriptions")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("candidate_growth_areas")
      .select("growth_areas(name)")
      .eq("user_id", user.id),
  ]);

  const exploredNames = new Set(
    (existingGrowthAreas ?? []).map((g: any) =>
      (g.growth_areas?.name ?? "").toLowerCase()
    )
  );

  const { data: competencies } = jd
    ? await supabase
        .from("role_competencies")
        .select("competency, category")
        .eq("job_description_id", jd.id)
    : { data: [] };

  const unexplored = (competencies ?? []).find(
    (c) => !exploredNames.has(c.competency.toLowerCase())
  );

  // Fall back to a generic unexpected scenario if everything's been
  // covered — still keeps the "prevents memorization" spirit intact.
  const surpriseName = unexplored?.competency ?? "Unexpected Leadership Scenario";
  const surpriseDescription = unexplored
    ? `An area from the role's competency map that hasn't come up in your practice yet.`
    : `You've prepared well for the areas we've focused on — this drill tests how you handle a scenario you haven't specifically rehearsed.`;

  try {
    const generated = await generateTrainingPlan({
      growthAreaName: surpriseName,
      growthAreaDescription: surpriseDescription,
      roleTitle: jd?.title ?? "your target role",
    });

    // Ensure a growth_areas row exists so this can be tracked like any
    // other training plan.
    const { data: existingArea } = await supabase
      .from("growth_areas")
      .select("id")
      .eq("name", surpriseName)
      .maybeSingle();

    const areaId =
      existingArea?.id ??
      (
        await supabase
          .from("growth_areas")
          .insert({ name: surpriseName, description: surpriseDescription })
          .select()
          .single()
      ).data?.id;

    const { data: plan, error: planErr } = await supabase
      .from("training_plans")
      .insert({
        user_id: user.id,
        growth_area_id: areaId ?? null,
        title: `Surprise: ${generated.planTitle}`,
        status: "active",
      })
      .select()
      .single();
    if (planErr) throw planErr;

    const { error: exErr } = await supabase.from("training_exercises").insert(
      generated.exercises.map((e, i) => ({
        training_plan_id: plan.id,
        title: e.title,
        instructions: e.instructions,
        order_index: i,
      }))
    );
    if (exErr) throw exErr;

    return NextResponse.json({ ok: true, planId: plan.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Could not generate a surprise drill." },
      { status: 500 }
    );
  }
}
