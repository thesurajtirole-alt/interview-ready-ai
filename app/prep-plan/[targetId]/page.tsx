import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PrepPlanTrigger } from "./prep-plan-trigger";

export default async function PrepPlanPage({
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
    .select("*, companies(name), job_descriptions(title, interview_date)")
    .eq("id", params.targetId)
    .eq("user_id", user.id)
    .single();

  if (!target) notFound();

  const prepPlan = target.prep_plan as
    | { days: { day: number; focus: string; activities: string[] }[] }
    | null;

  const interviewDate = target.job_descriptions?.interview_date;
  const daysUntil = interviewDate
    ? Math.ceil(
        (new Date(interviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Your prep plan</p>
        <h1 className="mt-1 font-display text-3xl font-medium">
          {target.companies?.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {target.job_descriptions?.title}
          {daysUntil !== null && ` · ${daysUntil} day${daysUntil === 1 ? "" : "s"} away`}
        </p>

        {!interviewDate && (
          <div className="mt-8 rounded-lg border border-border p-6 text-sm text-muted-foreground">
            No interview date is set for this target yet — add one from
            your research page first, then come back here to build a
            day-by-day plan.
          </div>
        )}

        {interviewDate && !prepPlan && (
          <div className="mt-8 rounded-lg border border-border p-6">
            <PrepPlanTrigger targetId={target.id} />
          </div>
        )}

        {prepPlan && (
          <div className="mt-8 space-y-3">
            {prepPlan.days.map((d) => (
              <div key={d.day} className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-accent">
                  Day {d.day}
                </p>
                <p className="mt-1 font-medium">{d.focus}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {d.activities.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="pt-2">
              <PrepPlanTrigger targetId={target.id} />
              <p className="mt-2 text-xs text-muted-foreground">
                Rebuilding replaces your current plan with a fresh one
                based on where things stand now.
              </p>
            </div>
          </div>
        )}

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
