import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const EndRequestSchema = z.object({ interviewId: uuidSchema });

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateBody(EndRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { interviewId } = validation.data;

  const { data: interview } = await supabase
    .from("interviews")
    .select("status")
    .eq("id", interviewId)
    .eq("user_id", user.id)
    .single();

  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  // Don't overwrite a genuinely completed interview.
  if (interview.status === "completed") {
    return NextResponse.json({ ok: true, status: "completed" });
  }

  const { error } = await supabase
    .from("interviews")
    .update({ status: "abandoned" })
    .eq("id", interviewId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: "abandoned" });
}
