import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNextQuestion } from "@/lib/ai/interview-question";
import { buildStagePlan } from "@/lib/interview/stage-plan";
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

  const { jobDescriptionId, mode } = await request.json();
  if (!jobDescriptionId) {
    return NextResponse.json(
      { error: "jobDescriptionId is required." },
      { status: 400 }
    );
  }

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

  const { data: plan } = await supabase
    .from("interview_plans")
    .select("*")
    .eq("job_description_id", jobDescriptionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan?.blueprint) {
    return NextResponse.json(
      {
        error:
          "No interview blueprint found yet. Generate one from the research page first.",
      },
      { status: 400 }
    );
  }

  const blueprint = plan.blueprint as {
    stages: { stage: string; percentage: number }[];
  };
  const stagePlan = buildStagePlan(blueprint.stages);
  if (stagePlan.length === 0) {
    return NextResponse.json(
      { error: "The blueprint has no stages to interview on." },
      { status: 400 }
    );
  }

  const { data: candidateProfile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Real panel members, if the candidate added any during onboarding.
  const { data: panelRecord } = await supabase
    .from("interview_panels")
    .select("id")
    .eq("job_description_id", jobDescriptionId)
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

  // Resume summary: real extracted experience/skills/projects, now that
  // resume analysis actually exists.
  const resumeSummary = candidateProfile
    ? [
        candidateProfile.experience?.length > 0
          ? `Experience: ${candidateProfile.experience
              .map((e: any) => `${e.title} at ${e.company} (${e.duration})`)
              .join("; ")}`
          : "",
        candidateProfile.skills?.length > 0
          ? `Skills: ${candidateProfile.skills.join(", ")}`
          : "",
        candidateProfile.projects?.length > 0
          ? `Projects: ${candidateProfile.projects.join("; ")}`
          : "",
        candidateProfile.achievements?.length > 0
          ? `Achievements: ${candidateProfile.achievements.join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "(no resume on file yet)";

  const validMode = ["friendly", "professional", "challenging", "pressure"].includes(
    mode
  )
    ? mode
    : "professional";

  const { data: interview, error: interviewErr } = await supabase
    .from("interviews")
    .insert({
      user_id: user.id,
      interview_plan_id: plan.id,
      mode: validMode,
      status: "in_progress",
    })
    .select()
    .single();
  if (interviewErr) throw interviewErr;

  const firstStage = stagePlan[0].stage;
  const openingInterviewer = pickInterviewerForStage(panelMembers, firstStage);

  try {
    const nextQ = await generateNextQuestion({
      companyName: jd.companies?.name ?? "the company",
      roleTitle: jd.title,
      stage: STAGE_LABEL[firstStage] ?? firstStage,
      stageFocus: [],
      resumeSummary,
      transcriptSoFar: "",
      lastAnswer: null,
      mode: validMode,
      currentInterviewerName: openingInterviewer?.name ?? null,
      currentInterviewerPersona: openingInterviewer
        ? PERSONA_LABEL[openingInterviewer.persona]
        : null,
      isPersonaChange: !!openingInterviewer, // first question always "introduces" if a real panel exists
    });

    const { data: question, error: qErr } = await supabase
      .from("interview_questions")
      .insert({
        interview_id: interview.id,
        stage: firstStage,
        question_text: nextQ.questionText,
        action_type: nextQ.actionType,
        interviewer_name: openingInterviewer?.name ?? null,
        panel_persona: openingInterviewer?.persona ?? null,
      })
      .select()
      .single();
    if (qErr) throw qErr;

    await supabase.from("transcripts").insert({
      interview_id: interview.id,
      speaker: "interviewer",
      content: nextQ.questionText,
    });

    return NextResponse.json({
      interviewId: interview.id,
      question: {
        id: question.id,
        text: nextQ.questionText,
        stage: firstStage,
        interviewerName: openingInterviewer?.name ?? null,
        panelPersona: openingInterviewer ? PERSONA_LABEL[openingInterviewer.persona] : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Failed to start interview." },
      { status: 500 }
    );
  }
}
