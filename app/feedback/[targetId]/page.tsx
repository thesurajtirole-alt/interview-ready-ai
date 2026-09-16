import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { OutcomeSelector } from "./outcome-selector";
import { FeedbackForm } from "./feedback-form";
import { RealQuestionsForm } from "./real-questions-form";

const OUTCOME_LABEL: Record<string, string> = {
  got_offer: "🟢 Got the offer",
  moved_forward: "🔵 Moved to the next round",
  waiting: "🟡 Waiting for the result",
  didnt_move_forward: "🟠 Didn't move forward",
  postponed: "⚪ Postponed",
  cancelled: "⚪ Cancelled",
  didnt_attend: "⚪ Didn't attend",
  prefer_not_to_say: "⚪ Prefer not to say",
};

const STATUS_LABEL: Record<string, string> = {
  explicit: "Explicit",
  strong_indication: "Strong indication",
  possible: "Possible",
  not_mentioned: "Not mentioned",
};

export default async function FeedbackPage({
  params,
}: {
  params: { targetId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: target } = await supabase
    .from("interview_targets")
    .select("*, companies(name), job_descriptions(title)")
    .eq("id", params.targetId)
    .eq("user_id", user.id)
    .single();
  if (!target) notFound();

  const [{ data: outcome }, { data: feedback }, { data: questions }] =
    await Promise.all([
      supabase
        .from("interview_outcomes")
        .select("*")
        .eq("interview_target_id", params.targetId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("interview_feedback")
        .select("*, interview_feedback_analysis(*)")
        .eq("interview_target_id", params.targetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("real_interview_questions")
        .select("*")
        .eq("interview_target_id", params.targetId)
        .order("created_at", { ascending: false }),
    ]);

  const analysis = feedback?.interview_feedback_analysis?.[0];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Interview feedback</p>
        <h1 className="mt-1 font-display text-3xl font-medium">
          {target.companies?.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {target.job_descriptions?.title}
        </p>

        {/* ---------- Outcome ---------- */}
        <section className="mt-8 rounded-xl border border-border p-5">
          {outcome ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Outcome
              </p>
              <p className="mt-1 font-medium">
                {OUTCOME_LABEL[outcome.outcome] ?? outcome.outcome}
              </p>
            </div>
          ) : (
            <OutcomeSelector targetId={target.id} />
          )}
        </section>

        {/* ---------- HR Feedback ---------- */}
        <section className="mt-6 rounded-xl border border-border p-5">
          {!analysis ? (
            <FeedbackForm targetId={target.id} />
          ) : (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Your interview feedback
              </p>
              <p className="mt-2 text-sm">{analysis.summary}</p>

              {analysis.positives?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-primary">
                    What they liked
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {analysis.positives.map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.improvement_areas?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-accent">
                    What they mentioned
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {analysis.improvement_areas.map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Reason given
                </p>
                <p className="mt-1 text-sm">{analysis.rejection_reason}</p>
              </div>

              {analysis.topic_labels?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Fact vs. inference
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {analysis.topic_labels.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{t.topic}</span>
                        <span className="text-xs text-muted-foreground">
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ---------- Real questions asked ---------- */}
        <section className="mt-6 rounded-xl border border-border p-5">
          <p className="text-sm font-medium">
            Do you remember any questions they asked?
          </p>
          <div className="mt-3">
            <RealQuestionsForm targetId={target.id} />
          </div>
          {questions && questions.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {questions.map((q) => (
                <li key={q.id}>{q.question_text}</li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 text-center">
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </a>
        </div>
      </main>
    </>
  );
}
