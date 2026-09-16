import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const OutcomeSchema = z.object({
  targetId: uuidSchema,
  outcome: z.enum([
    "got_offer",
    "moved_forward",
    "waiting",
    "didnt_move_forward",
    "postponed",
    "cancelled",
    "didnt_attend",
    "prefer_not_to_say",
  ]),
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
  const validation = validateBody(OutcomeSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { targetId, outcome } = validation.data;

  const { data: target } = await supabase
    .from("interview_targets")
    .select("id")
    .eq("id", targetId)
    .eq("user_id", user.id)
    .single();
  if (!target) {
    return NextResponse.json({ error: "Interview target not found." }, { status: 404 });
  }

  const { error } = await supabase.from("interview_outcomes").insert({
    user_id: user.id,
    interview_target_id: targetId,
    outcome,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // A recorded outcome means this target's active phase is done.
  await supabase
    .from("interview_targets")
    .update({ status: "completed" })
    .eq("id", targetId);

  return NextResponse.json({ ok: true });
}
