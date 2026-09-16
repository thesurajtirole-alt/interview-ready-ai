import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { uuidSchema, validateBody } from "@/lib/validation";

const QuestionSchema = z.object({
  targetId: uuidSchema,
  questionText: z
    .string()
    .trim()
    .min(3, "Question is too short.")
    .max(1000, "Please keep it under 1000 characters."),
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
  const validation = validateBody(QuestionSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { targetId, questionText } = validation.data;

  const { data: target } = await supabase
    .from("interview_targets")
    .select("id")
    .eq("id", targetId)
    .eq("user_id", user.id)
    .single();
  if (!target) {
    return NextResponse.json({ error: "Interview target not found." }, { status: 404 });
  }

  const { data: question, error } = await supabase
    .from("real_interview_questions")
    .insert({
      user_id: user.id,
      interview_target_id: targetId,
      question_text: questionText,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, question });
}
