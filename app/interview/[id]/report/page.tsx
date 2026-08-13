import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportTrigger } from "./report-trigger";
import { TrainingTrigger } from "@/app/training/training-trigger";

const DNA_LABEL: Record<string, string> = {
  relevance: "Relevance",
  accuracy: "Accuracy",
  structure: "Answer Structure",
  specificity: "Specificity",
};

export default async function ReportPage({
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

  const { data: report } = await supabase
    .from("interview_reports")
    .select("*")
    .eq("interview_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const company = interview.interview_plans?.job_descriptions?.companies;
  const role = interview.interview_plans?.job_descriptions?.title;

  const strengths = (report?.strengths ?? []) as {
    title: string;
    description: string;
  }[];
  const growthAreas = (report?.growth_areas ?? []) as {
    title: string;
    description: string;
    recommendation: string;
    growthAreaId: string | null;
  }[];
  const dna = (report?.interview_dna ?? {}) as Record<string, number>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      {!report && (
        <div className="text-center">
          <h1 className="font-display text-3xl font-medium">You did it.</h1>
          <p className="mt-3 text-muted-foreground">
            You just completed a realistic interview for {role} at{" "}
            {company?.name}.
          </p>
          <div className="mt-8">
            <ReportTrigger interviewId={interview.id} />
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-10">
          <div className="text-center">
            <h1 className="font-display text-3xl font-medium">You did it.</h1>
            <p className="mt-3 text-muted-foreground">{report.summary}</p>
          </div>

          <section>
            <h2 className="font-display text-xl font-medium">
              Here&apos;s what you&apos;re already doing well
            </h2>
            <div className="mt-4 space-y-3">
              {strengths.map((s) => (
                <div key={s.title} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-medium">Growth areas</h2>
            <p className="text-xs text-muted-foreground">
              This isn&apos;t a judgment. It&apos;s a map of where we can
              improve.
            </p>
            <div className="mt-4 space-y-4">
              {growthAreas.map((g, i) => (
                <div key={g.title} className="rounded-lg border border-border p-4">
                  <p className="text-xs font-medium text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 font-medium">{g.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {g.description}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Try this: </span>
                    {g.recommendation}
                  </p>
                  {g.growthAreaId && (
                    <div className="mt-3">
                      <TrainingTrigger growthAreaId={g.growthAreaId} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-medium">
              Interview DNA
            </h2>
            <div className="mt-4 space-y-3">
              {Object.entries(dna).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span>{DNA_LABEL[key] ?? key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center">
            <a
              href="/dashboard"
              className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
