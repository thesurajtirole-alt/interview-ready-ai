import type { SupabaseClient } from "@supabase/supabase-js";

/** Puts a user on a paid plan (creates or updates their single subscription row). */
export async function activatePlan(
  admin: SupabaseClient,
  args: {
    userId: string;
    planId: string;
    razorpaySubscriptionId: string;
    currentEnd?: number | null; // unix seconds, from Razorpay
  }
) {
  const periodEnd = args.currentEnd
    ? new Date(args.currentEnd * 1000).toISOString()
    : null;

  const { data: existing } = await admin
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", args.userId)
    .limit(1)
    .maybeSingle();

  const values = {
    plan_id: args.planId,
    status: "active",
    razorpay_subscription_id: args.razorpaySubscriptionId,
    current_period_end: periodEnd,
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await admin.from("user_subscriptions").update(values).eq("id", existing.id)
    : await admin
        .from("user_subscriptions")
        .insert({ user_id: args.userId, ...values });
  if (error) throw new Error(error.message);
}

/** Moves a user back to the free plan and clears payment details. */
export async function downgradeToFree(admin: SupabaseClient, userId: string) {
  const { data: free } = await admin
    .from("pricing_plans")
    .select("id")
    .eq("is_default_free", true)
    .limit(1)
    .maybeSingle();
  if (!free) throw new Error("No default free plan found");

  const { error } = await admin
    .from("user_subscriptions")
    .update({
      plan_id: free.id,
      status: "active",
      razorpay_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
