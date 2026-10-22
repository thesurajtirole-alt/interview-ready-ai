import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/billing/razorpay";
import { activatePlan, downgradeToFree } from "@/lib/billing/apply";

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const sub = event?.payload?.subscription?.entity;
  const notes = sub?.notes ?? {};
  if (!sub?.id || !notes.user_id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();
  try {
    switch (event.event) {
      case "subscription.activated":
      case "subscription.charged":
        if (notes.plan_id) {
          await activatePlan(admin, {
            userId: notes.user_id,
            planId: notes.plan_id,
            razorpaySubscriptionId: sub.id,
            currentEnd: sub.current_end ?? null,
          });
        }
        break;
      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.halted": {
        // Only downgrade if this is still the user's current subscription.
        const { data: row } = await admin
          .from("user_subscriptions")
          .select("razorpay_subscription_id")
          .eq("user_id", notes.user_id)
          .limit(1)
          .maybeSingle();
        if (row?.razorpay_subscription_id === sub.id) {
          await downgradeToFree(admin, notes.user_id);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // Non-2xx makes Razorpay retry later.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
