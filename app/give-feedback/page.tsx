import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Send feedback — Truepanel",
  robots: { index: false },
};

export default async function GiveFeedbackPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="font-display text-3xl font-medium">Send feedback</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us what confused you, what you liked, or anything that broke.
          Every message is read.
        </p>
        <FeedbackForm />
      </main>
    </>
  );
}
