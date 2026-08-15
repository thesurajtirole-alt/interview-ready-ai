import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InterviewChat } from "./interview-chat";
import { PERSONA_LABEL, type PanelPersona } from "@/lib/interview/panel-persona";

export default async function InterviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: interview } = await supabase
    .from("interviews")
    .select("*, interview_plans(*, job_descriptions(*, companies(*)))")
    .eq("id", params.id)
    .single();

  if (!interview) notFound();

  if (interview.status === "completed") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-medium">
          This interview is complete.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Nice work finishing a full mock interview.
        </p>
        <a
          href={`/interview/${params.id}/report`}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          See what we noticed
        </a>
      </main>
    );
  }

  const { data: lastQuestion } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("interview_id", params.id)
    .order("asked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const company = interview.interview_plans?.job_descriptions?.companies;
  const role = interview.interview_plans?.job_descriptions?.title;

  return (
    <InterviewChat
      interviewId={interview.id}
      companyName={company?.name ?? "the company"}
      roleTitle={role ?? "this role"}
      initialQuestion={
        lastQuestion
          ? {
              id: lastQuestion.id,
              text: lastQuestion.question_text,
              interviewerName: lastQuestion.interviewer_name,
              panelPersona: lastQuestion.panel_persona
                ? PERSONA_LABEL[lastQuestion.panel_persona as PanelPersona]
                : null,
            }
          : null
      }
    />
  );
}
