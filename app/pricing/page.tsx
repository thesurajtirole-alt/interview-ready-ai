import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Pricing — InterviewReady AI",
  description: "Simple, honest pricing for AI-powered interview preparation.",
};

export default async function PricingPage() {
  const supabase = createClient();

  const { data: plans } = await supabase
    .from("pricing_plans")
    .select(
      "*, pricing_plan_features(included, limit_value, display_order, pricing_features(label, description))"
    )
    .eq("active", true)
    .order("display_order", { ascending: true });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium">
          Simple, honest pricing.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Start free. We&apos;ll let you know clearly if you ever need
          more room — never an aggressive paywall.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {(plans ?? []).map((plan: any) => {
          const features = (plan.pricing_plan_features ?? []).sort(
            (a: any, b: any) => a.display_order - b.display_order
          );
          const priceLabel =
            plan.monthly_price_cents === 0
              ? "Free"
              : `$${(plan.monthly_price_cents / 100).toFixed(0)}/mo`;

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                plan.highlighted ? "border-primary" : "border-border"
              }`}
            >
              {plan.badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {plan.badge}
                </span>
              )}
              <h2 className="mt-2 font-display text-xl font-medium">
                {plan.name}
              </h2>
              <p className="mt-1 font-display text-3xl font-medium">
                {priceLabel}
              </p>

              <ul className="mt-5 space-y-2 text-sm">
                {features.map((f: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      {f.pricing_features?.label}
                      {f.limit_value != null && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {f.limit_value}/month
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="/signup"
                className={`mt-6 block rounded-lg px-5 py-2.5 text-center text-sm font-medium transition ${
                  plan.is_default_free
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                {plan.is_default_free ? plan.cta_text : "Coming soon"}
              </a>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Paid plans aren&apos;t live yet — we&apos;re starting on the free
        tier while the product grows. If you&apos;re interested in more
        room sooner, reach out.
      </p>
    </main>
  );
}
