import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateAttempt } from "@/lib/ai/training";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { exerciseId, responseText, durationSeconds } = await request.json();
  if (!exerciseId || !responseText) {
    return NextResponse.json(
      { error: "exerciseId and responseText are required." },
      { status: 400 }
    );
  }

  const { data: exercise, error: exErr } = await supabase
    .from("training_exercises")
    .select("*")
    .eq("id", exerciseId)
    .single();
  if (exErr || !exercise) {
    return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  }

  const { data: priorAttempts } = await supabase
    .from("training_attempts")
    .select("*")
    .eq("training_exercise_id", exerciseId)
    .order("attempted_at", { ascending: true });

  const attemptNumber = (priorAttempts?.length ?? 0) + 1;

  try {
    const result = await evaluateAttempt({
      exerciseInstructions: exercise.instructions,
      response: responseText,
      attemptNumber,
    });

    const { data: attempt, error: attemptErr } = await supabase
      .from("training_attempts")
      .insert({
        training_exercise_id: exerciseId,
        response_text: responseText,
        duration_seconds: durationSeconds ?? null,
        score: result.score,
        feedback: result.feedback,
      })
      .select()
      .single();
    if (attemptErr) throw attemptErr;

    const firstScore = priorAttempts?.[0]?.score ?? null;
    const improvement =
      firstScore !== null ? Math.round(result.score - firstScore) : null;

    return NextResponse.json({
      ok: true,
      attempt: {
        score: result.score,
        feedback: result.feedback,
        attemptNumber,
      },
      improvement, // null on first attempt, otherwise +/- vs the first attempt
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Could not evaluate that attempt." },
      { status: 500 }
    );
  }
}
