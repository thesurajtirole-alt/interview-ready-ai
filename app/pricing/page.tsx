import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { PricingGrid, type GridPlan } from "./pricing-grid";

export const metadata = {
  title: "Pricing — Truepanel",
  description: "Simple, honest pricing for AI-powered interview preparation.",
};

export default async function PricingPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans } = await supabase
    .from("pricing_plans")
    .select(
      "*, pricing_plan_features(included, limit_value, display_order, pricing_features(label, description))"
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  let currentPlanId: string | null = null;
  if (user) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("plan_id")
      .eq("user_id", user.id)
      .maybeSingle();
    currentPlanId = sub?.plan_id ?? null;
  }

  const gridPlans: GridPlan[] = (plans ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    badge: p.badge ?? null,
    highlighted: !!p.highlighted,
    isFree: !!p.is_default_free,
    ctaText: p.cta_text ?? null,
    usd: Math.round((p.monthly_price_cents ?? 0) / 100),
    inr: p.monthly_price_inr ?? 0,
    features: [...(p.pricing_plan_features ?? [])]
      .sort((a: any, b: any) => a.display_order - b.display_order)
      .map((f: any) => ({
        label: f.pricing_features?.label ?? "Feature",
        included: !!f.included,
        limit: f.limit_value ?? null,
      })),
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-medium">
            Simple, honest pricing.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Start free. We&apos;ll let you know clearly if you ever need more
            room — never an aggressive paywall.
          </p>
        </div>

        <PricingGrid
          plans={gridPlans}
          currentPlanId={currentPlanId}
          loggedIn={!!user}
        />

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Paid plans aren&apos;t live yet — they&apos;re coming in an upcoming
          update. Prices shown are planned and may change before launch.
        </p>
      </main>
    </>
  );
}
