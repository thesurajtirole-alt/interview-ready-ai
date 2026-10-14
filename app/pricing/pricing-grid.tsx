"use client";

import { useEffect, useState } from "react";

export type GridFeature = {
  label: string;
  included: boolean;
  limit: number | null;
};

export type GridPlan = {
  id: string;
  name: string;
  badge: string | null;
  highlighted: boolean;
  isFree: boolean;
  ctaText: string | null;
  usd: number; // whole dollars
  inr: number; // whole rupees
  features: GridFeature[];
};

type Currency = "INR" | "USD";

export function PricingGrid({
  plans,
  currentPlanId,
  loggedIn,
}: {
  plans: GridPlan[];
  currentPlanId: string | null;
  loggedIn: boolean;
}) {
  const [currency, setCurrency] = useState<Currency>("USD");

  // Start in rupees for visitors in India, dollars for everyone else.
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
      if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") setCurrency("INR");
    } catch {
      /* keep USD */
    }
  }, []);

  function priceLabel(p: GridPlan) {
    if (p.isFree || (p.usd === 0 && p.inr === 0)) return "Free";
    if (currency === "INR" && p.inr > 0) return `₹${p.inr.toLocaleString("en-IN")}`;
    return `$${p.usd}`;
  }

  return (
    <>
      <div className="mt-8 flex justify-center">
        <div
          role="group"
          aria-label="Currency"
          className="inline-flex rounded-lg border border-border p-1 text-sm"
        >
          {(["INR", "USD"] as Currency[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              aria-pressed={currency === c}
              className={`rounded-md px-4 py-1.5 font-medium transition ${
                currency === c
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "INR" ? "₹ INR" : "$ USD"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const label = priceLabel(plan);
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border p-6 ${
                plan.highlighted ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex min-h-[1.5rem] items-center gap-2">
                {plan.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {plan.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                    Your plan
                  </span>
                )}
              </div>
              <h2 className="mt-2 font-display text-xl font-medium">
                {plan.name}
              </h2>
              <p className="mt-1 font-display text-3xl font-medium">
                {label}
                {label !== "Free" && (
                  <span className="text-base font-normal text-muted-foreground">
                    /mo
                  </span>
                )}
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={f.included ? "text-primary" : "text-muted-foreground"}>
                      {f.included ? "✓" : "–"}
                    </span>
                    <span className={f.included ? "" : "text-muted-foreground line-through"}>
                      {f.label}
                      {f.included && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {f.limit == null ? "unlimited" : `${f.limit}/month`}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.isFree ? (
                isCurrent ? (
                  <a
                    href="/dashboard"
                    className="mt-6 block rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition hover:bg-secondary"
                  >
                    Go to dashboard
                  </a>
                ) : (
                  <a
                    href={loggedIn ? "/dashboard" : "/signup"}
                    className="mt-6 block rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    {loggedIn ? "Go to dashboard" : plan.ctaText ?? "Get started"}
                  </a>
                )
              ) : (
                <span className="mt-6 block rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium text-muted-foreground">
                  Coming soon
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
