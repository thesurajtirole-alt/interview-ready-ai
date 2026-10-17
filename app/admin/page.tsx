import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminUser } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin — Truepanel",
  robots: { index: false, follow: false },
};

const METRIC_LABEL: Record<string, string> = {
  full_interview: "Full interviews",
  training_drill: "Training drills",
  blueprint: "Blueprints",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function countBy(rows: { user_id: string }[] | null) {
  const m = new Map<string, number>();
  for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
  return m;
}

export default async function AdminPage() {
  // --- Access control: only emails listed in ADMIN_EMAILS get in. ---
  const user = await getAdminUser();
  if (!user) {
    notFound(); // looks like a normal 404 to everyone else
  }

  const admin = createAdminClient();
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
    .toISOString()
    .slice(0, 10);

  const [usersRes, completedRes, targetsRes, interviewsRes, outcomesRes, resumesRes, usageRes] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin
        .from("interviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      admin.from("interview_targets").select("user_id").limit(20000),
      admin.from("interviews").select("user_id").limit(20000),
      admin
        .from("interview_outcomes")
        .select("id", { count: "exact", head: true }),
      admin.from("resumes").select("id", { count: "exact", head: true }),
      admin
        .from("usage_counters")
        .select("metric, count")
        .eq("period_start", periodStart),
    ]);

  const feedbackRes = await admin
    .from("feedback")
    .select("id, user_id, rating, message, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const errors: string[] = [];
  const named: [string, { error: { message: string } | null }][] = [
    ["users", usersRes as any],
    ["completed interviews", completedRes as any],
    ["interview targets", targetsRes as any],
    ["interviews", interviewsRes as any],
    ["outcomes", outcomesRes as any],
    ["resumes", resumesRes as any],
    ["usage", usageRes as any],
    ["feedback (run feedback.sql if missing)", feedbackRes as any],
  ];
  for (const [name, r] of named) {
    if (r.error) errors.push(`${name}: ${r.error.message}`);
  }

  const users = (usersRes.data?.users ?? []).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = users.filter(
    (u) => new Date(u.created_at).getTime() > weekAgo
  ).length;

  const emailById = new Map(users.map((u) => [u.id, u.email ?? "—"]));
  const feedback = feedbackRes.data ?? [];

  const targetCounts = countBy(targetsRes.data as any);
  const interviewCounts = countBy(interviewsRes.data as any);

  const usageByMetric = new Map<string, number>();
  for (const r of usageRes.data ?? []) {
    usageByMetric.set(r.metric, (usageByMetric.get(r.metric) ?? 0) + r.count);
  }

  const stats = [
    { label: "Total users", value: users.length },
    { label: "New this week", value: newThisWeek },
    { label: "Interview targets", value: (targetsRes.data ?? []).length },
    { label: "Completed interviews", value: completedRes.count ?? 0 },
    { label: "Real outcomes logged", value: outcomesRes.count ?? 0 },
    { label: "Resumes uploaded", value: resumesRes.count ?? 0 },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl font-medium">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user.email}. Only visible to emails in ADMIN_EMAILS.
        </p>

        {errors.length > 0 && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Some data could not be loaded:</p>
            <ul className="mt-1 list-disc pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <a
          href="/admin/pricing"
          className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Edit pricing and limits
        </a>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border p-4"
            >
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-medium">
          Usage this month{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (all users, from {fmtDate(periodStart)})
          </span>
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {Object.keys(METRIC_LABEL).map((k) => (
            <div key={k} className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold">
                {usageByMetric.get(k) ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {METRIC_LABEL[k]}
              </p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-medium">
          Users{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (newest first, up to 50)
          </span>
        </h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Joined</th>
                <th className="px-3 py-2 font-medium">Last seen</th>
                <th className="px-3 py-2 font-medium">Targets</th>
                <th className="px-3 py-2 font-medium">Interviews</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 50).map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{fmtDate(u.created_at)}</td>
                  <td className="px-3 py-2">{fmtDate(u.last_sign_in_at)}</td>
                  <td className="px-3 py-2">{targetCounts.get(u.id) ?? 0}</td>
                  <td className="px-3 py-2">
                    {interviewCounts.get(u.id) ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-lg font-medium">
          Feedback{" "}
          <span className="text-sm font-normal text-muted-foreground">
            (latest 30)
          </span>
        </h2>
        <div className="mt-3 space-y-3">
          {feedback.length === 0 && (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          )}
          {feedback.map((f: any) => (
            <div key={f.id} className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">
                {emailById.get(f.user_id) ?? "—"} · {fmtDate(f.created_at)}
                {f.rating ? ` · ${f.rating}/5` : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{f.message}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
