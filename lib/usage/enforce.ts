import type { SupabaseClient } from "@supabase/supabase-js";

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

function currentPeriodStart(): string {
  // Rolling monthly period, anchored to the 1st of the current month —
  // simple and predictable rather than a rolling 30-day window.
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

/**
 * Checks the user's plan limit for a metric and increments their usage
 * counter if they're still within it. Throws UsageLimitError (with a
 * friendly, upgrade-oriented message, not a cold "403 Forbidden") if
 * they've hit their limit — callers should catch this and return a 402
 * response with the message shown as-is.
 *
 * Fails open (allows the action) if anything about the limit lookup
 * itself errors — a usage-tracking bug should never be the reason a
 * paying-eventually user can't use the product.
 */
export async function checkAndIncrementUsage(
  supabase: SupabaseClient,
  userId: string,
  metric: "full_interview" | "training_drill" | "blueprint"
): Promise<void> {
  try {
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!subscription) return; // no plan on record — fail open

    const { data: planFeature } = await supabase
      .from("pricing_plan_features")
      .select("limit_value, pricing_features!inner(key)")
      .eq("plan_id", subscription.plan_id)
      .eq("pricing_features.key", metric)
      .maybeSingle();

    const limit = planFeature?.limit_value;
    if (limit === null || limit === undefined) return; // unlimited on this plan

    const period = currentPeriodStart();
    const { data: counter } = await supabase
      .from("usage_counters")
      .select("count")
      .eq("user_id", userId)
      .eq("metric", metric)
      .eq("period_start", period)
      .maybeSingle();

    const currentCount = counter?.count ?? 0;
    if (currentCount >= limit) {
      const metricLabel: Record<string, string> = {
        full_interview: "full mock interviews",
        training_drill: "training drills",
        blueprint: "interview blueprints",
      };
      throw new UsageLimitError(
        `You've used your ${limit} free ${metricLabel[metric]} this month. This resets at the start of next month — check /pricing if you'd like more room sooner.`
      );
    }

    await supabase.from("usage_counters").upsert(
      {
        user_id: userId,
        metric,
        period_start: period,
        count: currentCount + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,metric,period_start" }
    );
  } catch (e) {
    if (e instanceof UsageLimitError) throw e;
    // Any other error (network blip, schema mismatch, etc.) — fail open.
  }
}
