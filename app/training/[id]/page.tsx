import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrainingExercises } from "./training-exercises";
import { Header } from "@/components/header";

export default async function TrainingPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*, growth_areas(*)")
    .eq("id", params.id)
    .single();

  if (!plan) notFound();

  const { data: exercises } = await supabase
    .from("training_exercises")
    .select("*")
    .eq("training_plan_id", params.id)
    .order("order_index", { ascending: true });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-muted-foreground">
        Training · {plan.growth_areas?.name}
      </p>
      <h1 className="mt-1 font-display text-2xl font-medium">{plan.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Don&apos;t worry about getting this perfect on the first try — that&apos;s
        what the retries are for.
      </p>

      <div className="mt-8">
        <TrainingExercises exercises={exercises ?? []} />
      </div>

      <div className="mt-10 text-center">
        <a
          href="/training"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to training
        </a>
      </div>
    </main>
    </>
  );
}
