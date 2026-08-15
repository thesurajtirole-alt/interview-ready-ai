import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNextQuestion } from "@/lib/ai/interview-question";
import { evaluateAnswer } from "@/lib/ai/answer-evaluation";
import { buildStagePlan, currentStage } from "@/lib/interview/stage-plan";
import {
  pickInterviewerForStage,
  PERSONA_LABEL,
  type PanelMemberOption,
} from "@/lib/interview/panel-persona";

const STAGE_LABEL: Record<string, string> = {
  opening: "opening",
  resume_deep_dive: "resume deep dive",
  technical: "technical",
  system_design: "system design",
  behavioral: "behavioral",
  leadership: "leadership",
  candidate_questions: "candidate questions",
};

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { interviewId, questionId, answerText } = await request.json();
  if (!interviewId || !questionId || !answerText) {
    return NextResponse.json(
      { error: "interviewId, questionId, and answerText are required." },
      { status: 400 }
    );
  }

  const { data: interview, error: interviewErr } = await supabase
    .from("interviews")
    .select("*, interview_plans(*, job_descriptions(*, companies(*)))")
    .eq("id", interviewId)
    .single();
  if (interviewErr || !interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  // 1. Save the answer
  const { data: answer, error: answerErr } = await supabase
    .from("interview_answers")
    .insert({
      interview_question_id: questionId,
      answer_text: answerText,
    })
    .select()
    .single();
  if (answerErr) throw answerErr;

  await supabase.from("transcripts").insert({
    interview_id: interviewId,
    speaker: "candidate",
    content: answerText,
  });

  // 2. Evaluate the answer in the background (per spec: never shown mid-interview)
  const { data: question } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("id", questionId)
    .single();

  evaluateAnswer({ question: question.question_text, answer: answerText })
    .then((analysis) =>
      supabase.from("answer_analysis").insert({
        interview_answer_id: answer.id,
        relevance: analysis.relevance,
        accuracy: analysis.accuracy,
        structure: analysis.structure,
        specificity: analysis.specificity,
        evidence: analysis.evidence,
        strengths: analysis.strengths,
        growth_areas: analysis.growthAreas,
        recommendation: analysis.recommendation,
      })
    )
    .catch(() => {
      // Non-fatal: the interview continues even if evaluation fails.
      // The report phase will simply have fewer analyzed answers.
    });

  // 3. Decide the next stage
  const blueprint = interview.interview_plans.blueprint as {
    stages: { stage: string; percentage: number }[];
  };
  const stagePlan = buildStagePlan(blueprint.stages);

  const { data: allQuestions } = await supabase
    .from("interview_questions")
    .select("stage")
    .eq("interview_id", interviewId);

  const askedCountByStage: Record<string, number> = {};
  for (const q of allQuestions ?? []) {
    askedCountByStage[q.stage] = (askedCountByStage[q.stage] ?? 0) + 1;
  }

  const nextStage = currentStage(stagePlan, askedCountByStage);

  if (!nextStage) {
    await supabase
      .from("interviews")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", interviewId);

    return NextResponse.json({ complete: true });
  }

  // 4. Build a compact transcript for context (not the full raw history,
  // per spec section 62: keep token usage low)
  const { data: recentTranscript } = await supabase
    .from("transcripts")
    .select("*")
    .eq("interview_id", interviewId)
    .order("spoken_at", { ascending: true })
    .limit(20);

  const transcriptText = (recentTranscript ?? [])
    .map((t) => `${t.speaker === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`)
    .join("\n");

  const jd = interview.interview_plans.job_descriptions;

  // Real panel members, if any were added during onboarding.
  const { data: panelRecord } = await supabase
    .from("interview_panels")
    .select("id")
    .eq("job_description_id", jd.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: participants } = panelRecord
    ? await supabase
        .from("interview_participants")
        .select("panel_persona, interviewers(name)")
        .eq("panel_id", panelRecord.id)
    : { data: [] };

  const panelMembers: PanelMemberOption[] = (participants ?? [])
    .filter((p: any) => p.interviewers?.name)
    .map((p: any) => ({
      name: p.interviewers.name,
      persona: p.panel_persona ?? "other",
    }));

  const nextInterviewer = pickInterviewerForStage(panelMembers, nextStage);

  // Was the previous question asked by a different panel member? If so,
  // this question should include a natural handoff introduction.
  const { data: lastQuestion } = await supabase
    .from("interview_questions")
    .select("interviewer_name")
    .eq("interview_id", interviewId)
    .order("asked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isPersonaChange =
    !!nextInterviewer && nextInterviewer.name !== lastQuestion?.interviewer_name;

  try {
    const nextQ = await generateNextQuestion({
      companyName: jd.companies?.name ?? "the company",
      roleTitle: jd.title,
      stage: STAGE_LABEL[nextStage] ?? nextStage,
      stageFocus: [],
      resumeSummary: "(see conversation so far)",
      transcriptSoFar: transcriptText,
      lastAnswer: answerText,
      mode: interview.mode,
      currentInterviewerName: nextInterviewer?.name ?? null,
      currentInterviewerPersona: nextInterviewer
        ? PERSONA_LABEL[nextInterviewer.persona]
        : null,
      isPersonaChange,
    });

    const { data: newQuestion, error: qErr } = await supabase
      .from("interview_questions")
      .insert({
        interview_id: interviewId,
        stage: nextStage,
        question_text: nextQ.questionText,
        action_type: nextQ.actionType,
        interviewer_name: nextInterviewer?.name ?? null,
        panel_persona: nextInterviewer?.persona ?? null,
      })
      .select()
      .single();
    if (qErr) throw qErr;

    await supabase.from("transcripts").insert({
      interview_id: interviewId,
      speaker: "interviewer",
      content: nextQ.questionText,
    });

    return NextResponse.json({
      complete: false,
      question: {
        id: newQuestion.id,
        text: nextQ.questionText,
        stage: nextStage,
        interviewerName: nextInterviewer?.name ?? null,
        panelPersona: nextInterviewer ? PERSONA_LABEL[nextInterviewer.persona] : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Failed to generate the next question." },
      { status: 500 }
    );
  }
}
