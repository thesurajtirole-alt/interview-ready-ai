import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResearchTrigger } from "./research-trigger";
import { BlueprintTrigger } from "./blueprint-trigger";
import { InterviewerResearchTrigger } from "./interviewer-trigger";
import { Header } from "@/components/header";

const CONFIDENCE_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  strong_indication: "Strong indication",
  possible: "Possible",
};

const STAGE_LABEL: Record<string, string> = {
  opening: "Opening",
  resume_deep_dive: "Resume deep dive",
  technical: "Technical",
  system_design: "System design",
  behavioral: "Behavioral",
  leadership: "Leadership",
  candidate_questions: "Candidate questions",
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

  // Round 1: research, job description, and interviewers only depend on
  // params.id — run them together instead of one after another.
  const [{ data: research }, { data: jd }, { data: interviewers }] = await Promise.all([
    supabase
      .from("company_research")
      .select("*")
      .eq("company_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("job_descriptions")
      .select("*")
      .eq("company_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("interviewers")
      .select("*, interviewer_research(*)")
      .eq("company_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  // Round 2: sources depends on research.id, plan depends on jd.id — these
  // are independent of EACH OTHER, so they also run together.
  const [{ data: sources }, { data: plan }] = await Promise.all([
    research
      ? supabase
          .from("research_sources")
          .select("*")
          .eq("related_table", "company_research")
          .eq("related_id", research.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    jd
      ? supabase
          .from("interview_plans")
          .select("*")
          .eq("job_description_id", jd.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);

  const blueprint = plan?.blueprint as
    | {
        competencies: { name: string; weight: number; category: string }[];
        stages: { stage: string; percentage: number }[];
        highPriorityAreas: string[];
        potentialChallengeAreas: string[];
        questionsToPrepare: string[];
        questionsToAsk: string[];
      }
    | undefined;

  return (
    <>
      <Header />
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

          {interviewers && interviewers.length > 0 && (
            <section className="border-t border-border pt-8">
              <h2 className="font-display text-xl font-medium">
                Your panel
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Based only on public professional information. Never a
                guess at what someone privately thinks.
              </p>
              <div className="mt-4 space-y-4">
                {interviewers.map((iv: any) => {
                  const research = iv.interviewer_research?.[0];
                  return (
                    <div
                      key={iv.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{iv.name}</p>
                          {iv.role_title && (
                            <p className="text-xs text-muted-foreground">
                              {iv.role_title}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          {research
                            ? research.confidence === "strong_indication"
                              ? "Strong indication"
                              : research.confidence === "confirmed"
                              ? "Confirmed"
                              : "Possible"
                            : "Not researched yet"}
                        </span>
                      </div>

                      {research ? (
                        <div className="mt-3 space-y-3 text-sm">
                          {research.summary && (
                            <p className="text-muted-foreground">
                              {research.summary}
                            </p>
                          )}
                          {research.years_experience && (
                            <p>
                              <span className="font-medium">Experience: </span>
                              <span className="text-muted-foreground">
                                {research.years_experience} (as publicly stated)
                              </span>
                            </p>
                          )}
                          {research.company_description && (
                            <div className="rounded-lg bg-secondary/60 p-3">
                              <p className="text-xs font-medium text-accent">
                                What {company.name} says about them
                              </p>
                              <p className="mt-1 text-muted-foreground">
                                {research.company_description.summary}
                              </p>
                            </div>
                          )}
                          {research.expertise?.length > 0 && (
                            <p>
                              <span className="font-medium">
                                Publicly listed expertise:{" "}
                              </span>
                              <span className="text-muted-foreground">
                                {research.expertise.join(", ")}
                              </span>
                            </p>
                          )}
                          {research.public_statements?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-accent">
                                Publicly stated approach
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                What they&apos;ve said publicly — not a guess
                                at what they privately think.
                              </p>
                              <div className="mt-2 space-y-2">
                                {research.public_statements.map(
                                  (s: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={s.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block rounded-lg border border-border p-2.5 text-xs transition hover:bg-secondary"
                                    >
                                      <p className="text-muted-foreground">
                                        {s.summary}
                                      </p>
                                      <p className="mt-1 truncate text-[10px] text-muted-foreground/70">
                                        {s.sourceUrl}
                                      </p>
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Likely professional focus:{" "}
                            {research.focus_areas?.join(", ") || "unclear from public info"}
                          </p>
                          <div className="pt-1">
                            <InterviewerResearchTrigger interviewerId={iv.id} />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <InterviewerResearchTrigger interviewerId={iv.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ---------- Interview Blueprint ---------- */}
          <section className="border-t border-border pt-8">
            <h2 className="font-display text-xl font-medium">
              Your interview blueprint
            </h2>

            {!jd && (
              <p className="mt-2 text-sm text-muted-foreground">
                Add a job description during onboarding to generate a
                blueprint.
              </p>
            )}

            {jd && !blueprint && (
              <div className="mt-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Combines your resume, this job description, and the
                  research above into a personalized prep plan.
                </p>
                <BlueprintTrigger jobDescriptionId={jd.id} />
              </div>
            )}

            {blueprint && (
              <div className="mt-6 space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Interview structure
                  </h3>
                  <div className="mt-3 space-y-2">
                    {blueprint.stages.map((s) => (
                      <div
                        key={s.stage}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
                      >
                        <span>{STAGE_LABEL[s.stage] ?? s.stage}</span>
                        <span className="font-medium text-accent">
                          {s.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Competency map
                  </h3>
                  <div className="mt-3 space-y-2">
                    {blueprint.competencies.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
                      >
                        <span>{c.name}</span>
                        <span className="font-medium">{c.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    High-priority preparation areas
                  </h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {blueprint.highPriorityAreas.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Potential challenge areas
                  </h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {blueprint.potentialChallengeAreas.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Questions to prepare
                  </h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {blueprint.questionsToPrepare.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Questions you could ask them
                  </h3>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {blueprint.questionsToAsk.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>

                <BlueprintTrigger jobDescriptionId={jd!.id} />

                <div className="border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ready to practice?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start a real mock interview built from this blueprint.
                  </p>
                  <a
                    href={`/interview/new?jobDescriptionId=${jd!.id}`}
                    className="mt-3 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Start mock interview
                  </a>
                  <a
                    href={`/final-prep/${company.id}`}
                    className="mt-3 ml-3 inline-block rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition hover:bg-secondary"
                  >
                    Final prep before the real thing →
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
    </>
  );
}
