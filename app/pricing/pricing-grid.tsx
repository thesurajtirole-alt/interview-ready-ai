"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type GridFeature = {
  label: string;
  included: boolean;
  limit: number | null;
};

export type GridPlan = {
  id: string;
  name: string;
  slug: string;
  badge: string | null;
  highlighted: boolean;
  isFree: boolean;
  ctaText: string | null;
  usd: number; // whole dollars
  inr: number; // whole rupees
  features: GridFeature[];
};

type Currency = "INR" | "USD";

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function PricingGrid({
  plans,
  currentPlanId,
  loggedIn,
  paymentsLive,
  testMode,
  hasPaidSub,
}: {
  plans: GridPlan[];
  currentPlanId: string | null;
  loggedIn: boolean;
  paymentsLive: boolean;
  testMode: boolean;
  hasPaidSub: boolean;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function subscribe(plan: GridPlan) {
    setMessage(null);
    setBusySlug(plan.slug);
    try {
      const ok = await loadCheckout();
      if (!ok) {
        setMessage("Could not load the payment window. Check your connection and try again.");
        setBusySlug(null);
        return;
      }
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Could not start checkout.");
        setBusySlug(null);
        return;
      }
      const rz = new (window as any).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Truepanel",
        description: `${data.planName} plan — monthly`,
        prefill: { email: data.email },
        theme: { color: "#2f5d4c" },
        modal: { ondismiss: () => setBusySlug(null) },
        handler: async (r: any) => {
          try {
            const v = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_subscription_id: r.razorpay_subscription_id,
                razorpay_signature: r.razorpay_signature,
              }),
            });
            if (v.ok) {
              window.location.href = "/profile";
              return;
            }
            setMessage(
              "Your payment went through, but we couldn't confirm it instantly. Your plan should activate within a few minutes — if not, contact us and we'll sort it out."
            );
          } catch {
            setMessage(
              "Your payment went through, but we couldn't confirm it instantly. Your plan should activate within a few minutes — if not, contact us."
            );
          }
          setBusySlug(null);
          router.refresh();
        },
      });
      rz.open();
    } catch {
      setMessage("Something went wrong. Please try again.");
      setBusySlug(null);
    }
  }

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

      {paymentsLive && testMode && (
        <p className="mt-6 rounded-lg border border-border bg-secondary/60 px-4 py-3 text-center text-xs text-muted-foreground">
          Payments are in <strong>test mode</strong> — no real money is charged.
          Use Razorpay&apos;s test card or UPI details in the payment window.
        </p>
      )}
      {message && (
        <p className="mt-4 text-center text-sm text-red-600">{message}</p>
      )}

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
              ) : !paymentsLive || plan.inr <= 0 ? (
                <span className="mt-6 block rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium text-muted-foreground">
                  Coming soon
                </span>
              ) : !loggedIn ? (
                <a
                  href="/signup"
                  className="mt-6 block rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Sign up to subscribe
                </a>
              ) : isCurrent ? (
                <a
                  href="/profile"
                  className="mt-6 block rounded-lg border border-border px-5 py-2.5 text-center text-sm font-medium transition hover:bg-secondary"
                >
                  Your current plan
                </a>
              ) : hasPaidSub ? (
                <span className="mt-6 block rounded-lg border border-border px-5 py-2.5 text-center text-xs font-medium text-muted-foreground">
                  Cancel your current plan first (Profile)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => subscribe(plan)}
                  disabled={busySlug !== null}
                  className="mt-6 block w-full rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {busySlug === plan.slug
                    ? "Opening payment…"
                    : `Subscribe — ₹${plan.inr.toLocaleString("en-IN")}/mo`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
