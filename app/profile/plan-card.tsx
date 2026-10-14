import { createClient } from "@/lib/supabase/server";

const METRICS: { key: string; label: string }[] = [
  { key: "full_interview", label: "Full mock interviews" },
  { key: "training_drill", label: "Training drills" },
  { key: "blueprint", label: "Interview blueprints" },
];

export async function PlanCard({ userId }: { userId: string }) {
  const supabase = createClient();

  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
    .toISOString()
    .slice(0, 10);

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  const [planRes, limitsRes, usageRes] = await Promise.all([
    sub?.plan_id
      ? supabase
          .from("pricing_plans")
          .select("name")
          .eq("id", sub.plan_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    sub?.plan_id
      ? supabase
          .from("pricing_plan_features")
          .select("limit_value, pricing_features(key)")
          .eq("plan_id", sub.plan_id)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from("usage_counters")
      .select("metric, count")
      .eq("user_id", userId)
      .eq("period_start", periodStart),
  ]);

  const planName = (planRes.data as any)?.name ?? "Free";

  const limits = new Map<string, number | null>();
  for (const r of (limitsRes.data ?? []) as any[]) {
    const key = r.pricing_features?.key;
    if (key) limits.set(key, r.limit_value ?? null);
  }
  const used = new Map<string, number>();
  for (const r of usageRes.data ?? []) used.set(r.metric, r.count);

  return (
    <section className="mt-10 rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Your plan</p>
          <p className="font-display text-xl font-medium">{planName}</p>
        </div>
        <a
          href="/pricing"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          See all plans
        </a>
      </div>

      <p className="mt-4 text-xs font-medium text-muted-foreground">
        Used this month
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {METRICS.map((m) => {
          const count = used.get(m.key) ?? 0;
          const hasLimit = limits.has(m.key);
          const limit = limits.get(m.key);
          return (
            <div key={m.key} className="rounded-lg bg-secondary/50 px-3 py-2">
              <p className="text-lg font-semibold">
                {count}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {!hasLimit ? "—" : limit == null ? "unlimited" : limit}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Limits reset on the 1st of each month. Paid plans are coming in an
        upcoming update.
      </p>
    </section>
  );
}
