import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      <h1 className="mt-2 text-2xl font-semibold">You&apos;re in.</h1>
      <p className="mt-3 text-muted-foreground">
        Authentication is working end to end. The full readiness dashboard is
        built in Phase 18.
      </p>

      {companies && companies.length > 0 ? (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground">
            Your interviews
          </h2>
          <div className="mt-3 space-y-2">
            {companies.map((c) => (
              <a
                key={c.id}
                href={`/research/${c.id}`}
                className="block rounded-lg border border-border p-4 text-sm transition hover:bg-secondary"
              >
                <p className="font-medium">{c.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  View company research brief →
                </p>
              </a>
            ))}
          </div>
          <a
            href="/training"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Go to training →
          </a>
          <a
            href="/progress"
            className="mt-4 ml-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Am I ready? →
          </a>
        </div>
      ) : (
        <a
          href="/onboarding"
          className="mt-10 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Start your first interview prep
        </a>
      )}
    </main>
  );
}
