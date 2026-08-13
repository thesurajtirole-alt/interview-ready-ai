import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTrainingPlan } from "@/lib/ai/training";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { growthAreaId } = await request.json();
  if (!growthAreaId) {
    return NextResponse.json(
      { error: "growthAreaId is required." },
      { status: 400 }
    );
  }

  const { data: growthArea, error: gaErr } = await supabase
    .from("growth_areas")
    .select("*")
    .eq("id", growthAreaId)
    .single();
  if (gaErr || !growthArea) {
    return NextResponse.json({ error: "Growth area not found." }, { status: 404 });
  }

  // Best-effort: use the candidate's most recent job description title for
  // context, but don't fail if there isn't one yet.
  const { data: jd } = await supabase
    .from("job_descriptions")
    .select("title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const generated = await generateTrainingPlan({
      growthAreaName: growthArea.name,
      growthAreaDescription: growthArea.description ?? growthArea.name,
      roleTitle: jd?.title ?? "your target role",
    });

    const { data: plan, error: planErr } = await supabase
      .from("training_plans")
      .insert({
        user_id: user.id,
        growth_area_id: growthAreaId,
        title: generated.planTitle,
        status: "active",
      })
      .select()
      .single();
    if (planErr) throw planErr;

    const { data: exercises, error: exErr } = await supabase
      .from("training_exercises")
      .insert(
        generated.exercises.map((e, i) => ({
          training_plan_id: plan.id,
          title: e.title,
          instructions: e.instructions,
          order_index: i,
        }))
      )
      .select();
    if (exErr) throw exErr;

    return NextResponse.json({ ok: true, planId: plan.id, exercises });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Training plan generation failed." },
      { status: 500 }
    );
  }
}
