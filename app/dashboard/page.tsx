import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: companies }, { data: readiness }, { data: growthAreas }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("readiness_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("candidate_growth_areas")
        .select("*, growth_areas(name)")
        .eq("user_id", user.id)
        .order("last_observed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

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

  const primaryCompany = companies?.[0];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        {!companies || companies.length === 0 ? (
          <>
            <h1 className="font-display text-2xl font-medium">
              Let&apos;s get you ready.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Tell us about your interview and we&apos;ll build a plan
              around it.
            </p>
            <a
              href="/onboarding"
              className="mt-8 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Start your first interview prep
            </a>
          </>
        ) : (
          <>
            {primaryCompany && (
              <div>
                <p className="text-sm text-muted-foreground">
                  You&apos;re preparing for
                </p>
                <h1 className="mt-1 font-display text-2xl font-medium">
                  {primaryCompany.name}
                </h1>
              </div>
            )}

            {readiness && (
              <div className="mt-6 rounded-xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Interview readiness
                </p>
                <p className="mt-1 font-display text-3xl font-medium text-primary">
                  {readiness.overall_score}
                  <span className="text-base text-muted-foreground"> / 100</span>
                </p>
                <a
                  href="/progress"
                  className="mt-2 inline-block text-xs text-muted-foreground hover:text-foreground"
                >
                  See full breakdown →
                </a>
              </div>
            )}

            {growthAreas?.growth_areas?.name && (
              <div className="mt-4 rounded-xl border border-border p-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Your biggest growth area
                </p>
                <p className="mt-1 font-medium">{growthAreas.growth_areas.name}</p>
                <a
                  href={
                    existingPlan
                      ? `/training/${existingPlan.id}`
                      : "/training"
                  }
                  className="mt-3 inline-block rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                >
                  {existingPlan ? "Continue training" : "Start training"}
                </a>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-sm font-medium text-muted-foreground">
                Your interviews
              </h2>
              <div className="mt-3 space-y-2">
                {companies.map((c) => (
                  <a
                    key={c.id}
                    href={`/research/${c.id}`}
                    className="block rounded-lg border border-border p-4 text-sm transition hover:bg-secondary"
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      View company research brief →
                    </p>
                  </a>
                ))}
              </div>
              <a
                href="/onboarding"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                + Prep for another interview
              </a>
            </div>
          </>
        )}
      </main>
    </>
  );
}
