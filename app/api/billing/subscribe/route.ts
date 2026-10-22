import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentsEnabled, razorpayKeyId, rzp } from "@/lib/billing/razorpay";

const schema = z.object({ planSlug: z.string().min(1).max(60) });

export async function POST(req: Request) {
  if (!paymentsEnabled()) {
    return NextResponse.json({ error: "Payments are not available yet." }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = createAdminClient();

  const { data: plan } = await admin
    .from("pricing_plans")
    .select("id, name, slug, monthly_price_inr, active, is_default_free, razorpay_plan_id, razorpay_plan_amount")
    .eq("slug", parsed.data.planSlug)
    .maybeSingle();

  if (!plan || !plan.active || plan.is_default_free || !(plan.monthly_price_inr > 0)) {
    return NextResponse.json({ error: "That plan can't be purchased." }, { status: 400 });
  }

  // Don't stack subscriptions: one paid plan at a time.
  const { data: current } = await admin
    .from("user_subscriptions")
    .select("razorpay_subscription_id, cancel_at_period_end")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (current?.razorpay_subscription_id) {
    return NextResponse.json(
      { error: "You already have a paid plan. Cancel it first (from your profile), then choose a new one." },
      { status: 409 }
    );
  }

  try {
    const amountPaise = plan.monthly_price_inr * 100;

    // Create (or re-create, if the price changed) the matching Razorpay plan.
    let rzpPlanId: string | null = plan.razorpay_plan_id;
    if (!rzpPlanId || plan.razorpay_plan_amount !== plan.monthly_price_inr) {
      const created = await rzp("/plans", "POST", {
        period: "monthly",
        interval: 1,
        item: {
          name: `Truepanel ${plan.name} (monthly)`,
          amount: amountPaise,
          currency: "INR",
        },
      });
      rzpPlanId = created.id as string;
      await admin
        .from("pricing_plans")
        .update({ razorpay_plan_id: rzpPlanId, razorpay_plan_amount: plan.monthly_price_inr })
        .eq("id", plan.id);
    }

    const sub = await rzp("/subscriptions", "POST", {
      plan_id: rzpPlanId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: { user_id: user.id, plan_id: plan.id, plan_slug: plan.slug },
    });

    return NextResponse.json({
      subscriptionId: sub.id,
      keyId: razorpayKeyId(),
      planName: plan.name,
      email: user.email ?? "",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Could not start checkout." },
      { status: 502 }
    );
  }
}
