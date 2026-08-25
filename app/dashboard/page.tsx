import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  preparing: "Preparing",
  scheduled: "Scheduled",
  completed: "Completed",
  archived: "Archived",
};

function daysRemaining(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const days = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"} away`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: targets }, { data: growthAreas }] = await Promise.all([
    supabase
      .from("interview_targets")
      .select(
        "*, companies(id, name), job_descriptions(title, interview_date), resumes(label, file_name)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("candidate_growth_areas")
      .select("*, growth_areas(name)")
      .eq("user_id", user.id)
      .order("last_observed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const jdIds = (targets ?? [])
    .map((t: any) => t.job_description_id)
    .filter(Boolean);

  const { data: readinessRows } = jdIds.length
    ? await supabase
        .from("readiness_scores")
        .select("job_description_id, overall_score, created_at")
        .in("job_description_id", jdIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Keep only the most recent readiness score per job_description_id.
  const readinessByJd = new Map<string, number>();
  for (const r of readinessRows ?? []) {
    if (!readinessByJd.has(r.job_description_id)) {
      readinessByJd.set(r.job_description_id, r.overall_score);
    }
  }

  const { data: existingPlan } = growthAreas
    ? await supabase
        .from("training_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("growth_area_id", growthAreas.growth_area_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        {!targets || targets.length === 0 ? (
          <>
            <h1 className="font-display text-2xl font-medium">
              You don&apos;t have an interview target yet.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Tell us about your interview and we&apos;ll build a plan
              around it.
            </p>
            <a
              href="/onboarding"
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Prepare for an interview
            </a>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-medium">
              Your interview targets
            </h1>

            {growthAreas?.growth_areas?.name && (
              <div className="mt-6 rounded-xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Your biggest growth area
                </p>
                <p className="mt-1 font-medium">
                  {growthAreas.growth_areas.name}
                </p>
                <a
                  href={existingPlan ? `/training/${existingPlan.id}` : "/training"}
                  className="mt-3 inline-block rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  {existingPlan ? "Continue training" : "Start training"}
                </a>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {targets.map((t: any) => {
                const readiness = readinessByJd.get(t.job_description_id);
                const days = daysRemaining(t.job_descriptions?.interview_date);
                const resumeLabel =
                  t.resumes?.label || t.resumes?.file_name || null;

                return (
                  <a
                    key={t.id}
                    href={`/research/${t.company_id}`}
                    className="block rounded-xl border border-border p-5 transition hover:bg-secondary"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{t.companies?.name}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {t.job_descriptions?.title ?? "Role not set"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {days && <span>{days}</span>}
                      {readiness !== undefined && (
                        <span>Readiness: {readiness}/100</span>
                      )}
                      {resumeLabel && <span>Resume: {resumeLabel}</span>}
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href="/onboarding"
                className="text-sm font-medium text-primary hover:underline"
              >
                + Prep for another interview
              </a>
              <a
                href="/training"
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to training →
              </a>
              <a
                href="/progress"
                className="text-sm font-medium text-primary hover:underline"
              >
                Am I ready? →
              </a>
              <a
                href="/profile"
                className="text-sm font-medium text-primary hover:underline"
              >
                Your profile →
              </a>
            </div>
          </>
        )}
      </main>
    </>
  );
}
