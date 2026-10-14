import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  planId: z.string().uuid(),
  priceDollars: z.number().int().min(0).max(10000),
  priceInr: z.number().int().min(0).max(1000000),
  active: z.boolean(),
  features: z
    .array(
      z.object({
        id: z.string().uuid(),
        included: z.boolean(),
        // null = unlimited
        limitValue: z.number().int().min(0).max(1000000).nullable(),
      })
    )
    .max(50),
});

export async function POST(req: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { planId, priceDollars, priceInr, active, features } = parsed.data;

  const admin = createAdminClient();

  const { error: planError } = await admin
    .from("pricing_plans")
    .update({
      monthly_price_cents: priceDollars * 100,
      monthly_price_inr: priceInr,
      active,
    })
    .eq("id", planId);
  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  for (const f of features) {
    const { error } = await admin
      .from("pricing_plan_features")
      .update({ included: f.included, limit_value: f.limitValue })
      .eq("id", f.id)
      .eq("plan_id", planId); // a row can only be changed through its own plan
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
