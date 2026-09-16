import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeFeedback } from "@/lib/ai/feedback-analysis";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const FeedbackSchema = z.object({
  targetId: uuidSchema,
  feedbackText: z
    .string()
    .trim()
    .min(10, "Paste a bit more detail so there's something real to analyze.")
    .max(8000, "That's a lot of text — please keep it under 8000 characters."),
  privacyAcknowledged: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm you've reviewed the feedback for sensitive information first.",
    }),
  }),
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
  const validation = validateBody(FeedbackSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { targetId, feedbackText, privacyAcknowledged } = validation.data;

  const { data: target } = await supabase
    .from("interview_targets")
    .select("*, companies(name), job_descriptions(title)")
    .eq("id", targetId)
    .eq("user_id", user.id)
    .single();
  if (!target) {
    return NextResponse.json({ error: "Interview target not found." }, { status: 404 });
  }

  const { data: feedbackRow, error: feedbackErr } = await supabase
    .from("interview_feedback")
    .insert({
      user_id: user.id,
      interview_target_id: targetId,
      raw_feedback_text: feedbackText,
      privacy_acknowledged: privacyAcknowledged,
    })
    .select()
    .single();
  if (feedbackErr) {
    return NextResponse.json({ error: feedbackErr.message }, { status: 500 });
  }

  try {
    const analysis = await analyzeFeedback({
      roleTitle: target.job_descriptions?.title ?? "this role",
      companyName: target.companies?.name ?? "the company",
      feedbackText,
    });

    const { error: analysisErr } = await supabase
      .from("interview_feedback_analysis")
      .insert({
        interview_feedback_id: feedbackRow.id,
        positives: analysis.positives,
        improvement_areas: analysis.improvementAreas,
        rejection_reason: analysis.rejectionReason,
        topic_labels: analysis.topicLabels,
        summary: analysis.summary,
      });
    if (analysisErr) throw analysisErr;

    // Feed real, company-stated improvement areas back into the same
    // growth-area tracking used by mock interviews and training — this
    // is genuinely higher-signal than AI-guessed growth areas, since a
    // real company said it.
    for (const areaName of analysis.improvementAreas) {
      const { data: existingArea } = await supabase
        .from("growth_areas")
        .select("id")
        .eq("name", areaName)
        .maybeSingle();

      const areaId =
        existingArea?.id ??
        (
          await supabase
            .from("growth_areas")
            .insert({
              name: areaName,
              description: `Identified from real interview feedback at ${target.companies?.name ?? "a company"}.`,
            })
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
    }

    return NextResponse.json({ ok: true, analysis });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Could not analyze that feedback." },
      { status: 500 }
    );
  }
}
