import { describe, it, expect } from "vitest";
import {
  checkAndIncrementUsage,
  UsageLimitError,
} from "../lib/usage/enforce";

type Upsert = { table: string; row: any };

/** A tiny stand-in for the Supabase client: each table returns canned data. */
function fakeSupabase(data: Record<string, any>) {
  const upserts: Upsert[] = [];
  const client = {
    from(table: string) {
      const b: any = {
        select: () => b,
        eq: () => b,
        maybeSingle: async () => {
          if (data[table] === "THROW") throw new Error("db down");
          return { data: data[table] ?? null };
        },
        upsert: async (row: any) => {
          upserts.push({ table, row });
          return {};
        },
      };
      return b;
    },
  } as any;
  return { client, upserts };
}

describe("checkAndIncrementUsage", () => {
  it("allows the action and counts it when under the limit", async () => {
    const { client, upserts } = fakeSupabase({
      user_subscriptions: { plan_id: "p1" },
      pricing_plan_features: { limit_value: 3 },
      usage_counters: { count: 2 },
    });
    await checkAndIncrementUsage(client, "u1", "full_interview");
    expect(upserts).toHaveLength(1);
    expect(upserts[0].row.count).toBe(3);
    expect(upserts[0].row.metric).toBe("full_interview");
    expect(upserts[0].row.user_id).toBe("u1");
  });

  it("starts counting from 1 when there is no counter yet", async () => {
    const { client, upserts } = fakeSupabase({
      user_subscriptions: { plan_id: "p1" },
      pricing_plan_features: { limit_value: 3 },
    });
    await checkAndIncrementUsage(client, "u1", "blueprint");
    expect(upserts[0].row.count).toBe(1);
  });

  it("blocks with a friendly UsageLimitError at the limit", async () => {
    const { client, upserts } = fakeSupabase({
      user_subscriptions: { plan_id: "p1" },
      pricing_plan_features: { limit_value: 3 },
      usage_counters: { count: 3 },
    });
    await expect(
      checkAndIncrementUsage(client, "u1", "full_interview")
    ).rejects.toThrow(UsageLimitError);
    expect(upserts).toHaveLength(0);
  });

  it("mentions the limit and the feature in the message", async () => {
    const { client } = fakeSupabase({
      user_subscriptions: { plan_id: "p1" },
      pricing_plan_features: { limit_value: 10 },
      usage_counters: { count: 10 },
    });
    await expect(
      checkAndIncrementUsage(client, "u1", "training_drill")
    ).rejects.toThrow("10 free training drills");
  });

  it("does not limit or count when the plan is unlimited", async () => {
    const { client, upserts } = fakeSupabase({
      user_subscriptions: { plan_id: "p2" },
      pricing_plan_features: { limit_value: null },
      usage_counters: { count: 999 },
    });
    await checkAndIncrementUsage(client, "u1", "full_interview");
    expect(upserts).toHaveLength(0);
  });

  it("fails open when the user has no plan on record", async () => {
    const { client, upserts } = fakeSupabase({ user_subscriptions: null });
    await checkAndIncrementUsage(client, "u1", "full_interview");
    expect(upserts).toHaveLength(0);
  });

  it("fails open when the database errors", async () => {
    const { client } = fakeSupabase({ user_subscriptions: "THROW" });
    await expect(
      checkAndIncrementUsage(client, "u1", "full_interview")
    ).resolves.toBeUndefined();
  });
});
