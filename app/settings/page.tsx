import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { DeleteAccount } from "./delete-account";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl font-medium">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {user.email}
        </p>
        <DeleteAccount />
      </main>
    </>
  );
}
