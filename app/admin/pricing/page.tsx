import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/header";
import { PlanEditor } from "./plan-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin pricing — Truepanel",
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  const user = await getAdminUser();
  if (!user) notFound();

  const admin = createAdminClient();
  const { data: plans, error } = await admin
    .from("pricing_plans")
    .select(
      "id, name, is_default_free, active, monthly_price_cents, display_order, pricing_plan_features(id, included, limit_value, display_order, pricing_features(label))"
    )
    .order("display_order", { ascending: true });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to admin
        </a>
        <h1 className="mt-3 font-display text-3xl font-medium">Pricing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit plan prices and monthly limits. Saved changes apply immediately
          to the public pricing page and to usage limits.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Could not load plans: {error.message}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {(plans ?? []).map((p: any) => {
            const features = [...(p.pricing_plan_features ?? [])]
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((f: any) => ({
                id: f.id as string,
                label: (f.pricing_features?.label ?? "Feature") as string,
                included: f.included as boolean,
                limitValue: f.limit_value as number | null,
              }));
            return (
              <PlanEditor
                key={p.id}
                planId={p.id}
                name={p.name}
                isFree={p.is_default_free}
                priceDollars={Math.round(p.monthly_price_cents / 100)}
                active={p.active}
                features={features}
              />
            );
          })}
          {(plans ?? []).length === 0 && !error && (
            <p className="text-sm text-muted-foreground">No plans found.</p>
          )}
        </div>
      </main>
    </>
  );
}
