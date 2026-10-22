import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rzp } from "@/lib/billing/razorpay";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("user_subscriptions")
    .select("razorpay_subscription_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!row?.razorpay_subscription_id) {
    return NextResponse.json({ error: "You don't have a paid plan to cancel." }, { status: 400 });
  }

  try {
    // Keep access until the end of the period that is already paid for.
    await rzp(`/subscriptions/${row.razorpay_subscription_id}/cancel`, "POST", {
      cancel_at_cycle_end: 1,
    });
    await admin
      .from("user_subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Could not cancel." }, { status: 502 });
  }
}
