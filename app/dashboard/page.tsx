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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      <h1 className="mt-2 text-2xl font-semibold">You&apos;re in.</h1>
      <p className="mt-3 text-muted-foreground">
        Authentication is working end to end. The real dashboard — readiness
        score, growth areas, and today&apos;s practice — is built in Phase 18.
      </p>
    </main>
  );
}
