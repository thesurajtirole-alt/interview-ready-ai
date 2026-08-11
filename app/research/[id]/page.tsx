import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResearchTrigger } from "./research-trigger";

const CONFIDENCE_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  strong_indication: "Strong indication",
  possible: "Possible",
};

export default async function ResearchPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!company) notFound();

  const { data: research } = await supabase
    .from("company_research")
    .select("*")
    .eq("company_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sources } = research
    ? await supabase
        .from("research_sources")
        .select("*")
        .eq("related_table", "company_research")
        .eq("related_id", research.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Interview brief</p>
      <h1 className="mt-1 font-display text-3xl font-medium">
        {company.name}
      </h1>

      {!research && (
        <div className="mt-8 rounded-lg border border-border p-6">
          <p className="text-sm text-muted-foreground">
            We haven&apos;t researched this company yet. This runs a real web
            search — only publicly available information, every claim
            traceable to a source.
          </p>
          <div className="mt-4">
            <ResearchTrigger companyId={company.id} />
          </div>
        </div>
      )}

      {research && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-display text-xl font-medium">Overview</h2>
            <p className="mt-2 text-muted-foreground">
              {research.summary || "Not enough public information available."}
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-medium">Sources</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Every claim above is traceable to public sources below, each
              labeled by confidence.
            </p>
            <div className="mt-4 space-y-3">
              {(sources ?? []).map((s) => (
                <a
                  key={s.id}
                  href={s.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border p-4 text-sm transition hover:bg-secondary"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{s.source_title}</p>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {CONFIDENCE_LABEL[s.confidence] ?? s.confidence}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {s.source_url}
                  </p>
                  <p className="mt-2 text-muted-foreground">{s.summary}</p>
                </a>
              ))}
            </div>
          </section>

          <ResearchTrigger companyId={company.id} />
        </div>
      )}
    </main>
  );
}
