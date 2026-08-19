import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInterviewBlueprint } from "@/lib/ai/interview-blueprint";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const BlueprintRequestSchema = z.object({ jobDescriptionId: uuidSchema });

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(BlueprintRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { jobDescriptionId } = validation.data;

  const { data: jd, error: jdErr } = await supabase
    .from("job_descriptions")
    .select("*, companies(*)")
    .eq("id", jobDescriptionId)
    .single();

  if (jdErr || !jd) {
    return NextResponse.json(
      { error: "Job description not found." },
      { status: 404 }
    );
  }

  const { data: research } = await supabase
    .from("company_research")
    .select("*")
    .eq("company_id", jd.company_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: panel } = await supabase
    .from("interview_panels")
    .select("*, interview_participants(interviewer_id)")
    .eq("job_description_id", jobDescriptionId)
    .maybeSingle();

  let panelFocusAreas: string[] = [];
  if (panel?.interview_participants?.length > 0) {
    const interviewerIds = panel.interview_participants.map(
      (p: any) => p.interviewer_id
    );
    const { data: interviewers } = await supabase
      .from("interviewers")
      .select("role_title")
      .in("id", interviewerIds);
    panelFocusAreas = (interviewers ?? [])
      .map((i) => i.role_title)
      .filter(Boolean) as string[];
  }

  try {
    const blueprint = await createInterviewBlueprint({
      roleTitle: jd.title,
      jobDescriptionText: jd.raw_text,
      companyName: jd.companies?.name ?? "the company",
      companyResearchSummary: research?.summary ?? null,
      panelFocusAreas,
    });

    const { data: planRow, error: planErr } = await supabase
      .from("interview_plans")
      .insert({
        user_id: user.id,
        job_description_id: jobDescriptionId,
        panel_id: panel?.id ?? null,
        blueprint,
      })
      .select()
      .single();
    if (planErr) throw planErr;

    return NextResponse.json({ ok: true, planId: planRow.id, blueprint });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Blueprint generation failed." },
      { status: 500 }
    );
  }
}
