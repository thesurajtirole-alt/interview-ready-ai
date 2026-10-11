import { createClient } from "@/lib/supabase/server";

export async function ProgressStats({ userId }: { userId: string }) {
  const supabase = createClient();

  const [mockRes, outcomesRes] = await Promise.all([
    supabase
      .from("interviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase.from("interview_outcomes").select("*").eq("user_id", userId),
  ]);

  const outcomes = (outcomesRes.data ?? []) as Record<string, unknown>[];
  const stats = [
    { label: "Mock interviews", value: mockRes.count ?? 0 },
    { label: "Real interviews tracked", value: outcomes.length },
    {
      label: "Moved forward",
      value: outcomes.filter((o) => o.moved_forward === true).length,
    },
    {
      label: "Offers",
      value: outcomes.filter((o) => o.got_offer === true).length,
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg border border-border p-4 text-center"
        >
          <p className="text-2xl font-semibold">{s.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
