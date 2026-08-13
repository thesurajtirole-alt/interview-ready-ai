import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReadinessTrigger } from "./readiness-trigger";

const BREAKDOWN_LABEL: Record<string, string> = {
  technical: "Technical",
  communication: "Communication",
  resumeDefense: "Resume Defense",
  behavioral: "Behavioral",
};

export default async function ProgressPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: latest } = await supabase
    .from("readiness_scores")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: history } = await supabase
    .from("readiness_scores")
    .select("overall_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const breakdown = (latest?.breakdown ?? {}) as Record<string, number>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium">Your progress</h1>
      <p className="mt-2 text-muted-foreground">
        Based on your practice sessions — not a guarantee, just an honest
        picture of where you stand.
      </p>

      {!latest && (
        <div className="mt-8 rounded-lg border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Complete at least one mock interview, then check in here.
          </p>
          <div className="mt-4 flex justify-center">
            <ReadinessTrigger />
          </div>
        </div>
      )}

      {latest && (
        <div className="mt-8 space-y-10">
          <div className="rounded-xl border border-border p-6 text-center">
            <p className="font-display text-4xl font-medium text-primary">
              {latest.overall_score}
              <span className="text-lg text-muted-foreground"> / 100</span>
            </p>
            <p className="mt-3 text-muted-foreground">{latest.narrative}</p>
          </div>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground">
              Breakdown
            </h2>
            <div className="mt-3 space-y-3">
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span>{BREAKDOWN_LABEL[key] ?? key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {history && history.length > 1 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground">
                Over time
              </h2>
              <div className="mt-3 flex items-end gap-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${Math.max(4, h.overall_score)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {h.overall_score}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col items-center gap-3 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Practiced more since your last check?
            </p>
            <ReadinessTrigger />
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <a
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </a>
      </div>
    </main>
  );
}
