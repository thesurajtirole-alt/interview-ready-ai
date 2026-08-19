import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainingTrigger } from "./training-trigger";
import { SurpriseTrigger } from "./surprise-trigger";
import { Header } from "@/components/header";

export default async function TrainingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: candidateGrowthAreas } = await supabase
    .from("candidate_growth_areas")
    .select("*, growth_areas(*)")
    .eq("user_id", user.id)
    .order("last_observed_at", { ascending: false });

  const { data: existingPlans } = await supabase
    .from("training_plans")
    .select("id, growth_area_id, status")
    .eq("user_id", user.id);

  const planByGrowthArea = new Map(
    (existingPlans ?? []).map((p) => [p.growth_area_id, p])
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium">Training</h1>
      <p className="mt-2 text-muted-foreground">
        Short, focused drills built around what your interviews actually
        showed — not generic practice.
      </p>

      <div className="mt-5">
        <SurpriseTrigger />
      </div>

      {(!candidateGrowthAreas || candidateGrowthAreas.length === 0) && (
        <p className="mt-8 text-sm text-muted-foreground">
          Complete a mock interview and view its report first — your growth
          areas will show up here automatically.
        </p>
      )}

      <div className="mt-8 space-y-3">
        {(candidateGrowthAreas ?? []).map((cga: any) => {
          const existing = planByGrowthArea.get(cga.growth_area_id);
          return (
            <div
              key={cga.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div>
                <p className="font-medium">{cga.growth_areas?.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cga.growth_areas?.description}
                </p>
              </div>
              {existing ? (
                <a
                  href={`/training/${existing.id}`}
                  className="shrink-0 rounded-lg border border-border px-4 py-2 text-xs font-medium transition hover:bg-secondary"
                >
                  Continue
                </a>
              ) : (
                <div className="shrink-0">
                  <TrainingTrigger growthAreaId={cga.growth_area_id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
    </>
  );
}
