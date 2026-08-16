import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
