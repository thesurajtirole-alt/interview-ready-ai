import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { FinalPrepView } from "./final-prep-view";

export default async function FinalPrepPage({
  params,
}: {
  params: { companyId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", params.companyId)
    .eq("user_id", user.id)
    .single();
  if (!company) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Your final prep</p>
        <h1 className="mt-1 font-display text-3xl font-medium">
          {company.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Everything you&apos;ve prepared, pulled together for one last
          review before you walk in.
        </p>

        <div className="mt-8">
          <FinalPrepView companyId={params.companyId} />
        </div>

        <div className="mt-10 text-center">
          <a
            href={`/research/${params.companyId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to research
          </a>
        </div>
      </main>
    </>
  );
}
