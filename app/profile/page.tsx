import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumeAnalysisTrigger } from "./resume-analysis-trigger";
import { Header } from "@/components/header";
import { PersonalInfoForm } from "./personal-info-form";
import { CareerPreferencesForm } from "./career-preferences-form";
import { SkillsEditor } from "./skills-editor";
import { ResumeVault } from "./resume-vault";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: preferences },
    { data: candidateSkills },
    { data: resumes },
    { data: latestResumeWithAnalysis },
    { data: targets },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("candidate_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("candidate_skills")
      .select("id, category, years_experience, confidence, skills(id, name)")
      .eq("user_id", user.id),
    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("resumes")
      .select("*, candidate_profiles(*)")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("interview_targets")
      .select("resume_id, companies(name)")
      .eq("user_id", user.id),
  ]);

  const skillRows = (candidateSkills ?? []).map((cs: any) => ({
    candidateSkillId: cs.id,
    skillId: cs.skills?.id,
    name: cs.skills?.name ?? "Unknown",
    category: cs.category,
    years_experience: cs.years_experience,
    confidence: cs.confidence,
  }));

  // Build a map of resumeId -> which company names use it, for the
  // Resume Vault's delete-safety warning.
  const usageMap: Record<string, string[]> = {};
  for (const t of targets ?? []) {
    if (!t.resume_id) continue;
    const companyName = (t as any).companies?.name ?? "an interview";
    usageMap[t.resume_id] = [...(usageMap[t.resume_id] ?? []), companyName];
  }

  const resumeAnalysis = latestResumeWithAnalysis;
  const analysisProfile = resumeAnalysis?.candidate_profiles;
  const defenseMap = (resumeAnalysis?.resume_defense_map ?? []) as {
    claim: string;
    possibleFollowUps: string[];
  }[];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-medium">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          Your own information, editable any time — plus what we&apos;ve
          learned from your resume.
        </p>

        {/* ---------- Candidate Profile (editable) ---------- */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-medium">
            Personal information
          </h2>
          <div className="mt-4">
            <PersonalInfoForm
              userId={user.id}
              initial={{
                preferred_name: profile?.preferred_name ?? null,
                phone: profile?.phone ?? null,
                location: profile?.location ?? null,
                linkedin_url: profile?.linkedin_url ?? null,
                current_job_title: profile?.current_job_title ?? null,
                current_company: profile?.current_company ?? null,
                years_experience: profile?.years_experience ?? null,
              }}
            />
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-medium">
            Career preferences
          </h2>
          <div className="mt-4">
            <CareerPreferencesForm
              userId={user.id}
              initial={{
                desired_roles: preferences?.desired_roles ?? [],
                industries: preferences?.industries ?? [],
                work_preference: preferences?.work_preference ?? null,
                preferred_locations: preferences?.preferred_locations ?? [],
              }}
            />
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-medium">Skills</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Resume analysis can suggest skills, but this list is always
            yours to edit.
          </p>
          <div className="mt-4">
            <SkillsEditor userId={user.id} initialSkills={skillRows} />
          </div>
        </section>

        {/* ---------- Resume Vault ---------- */}
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-medium">Resume Vault</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every resume version you&apos;ve uploaded — pick a default, or
            keep several for different kinds of roles.
          </p>
          <div className="mt-4">
            <ResumeVault resumes={resumes ?? []} usageMap={usageMap} />
          </div>
        </section>

        {/* ---------- Resume Analysis (AI-derived, read-only) ---------- */}
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-display text-xl font-medium">
            Resume analysis
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            AI-derived from your most recent resume — re-analyze any
            resume in your vault above if you update it.
          </p>

          {!resumeAnalysis && (
            <p className="mt-4 text-sm text-muted-foreground">
              No resume uploaded yet. Add one during onboarding.
            </p>
          )}

          {resumeAnalysis && (
            <div className="mt-4 rounded-lg border border-border p-5">
              <p className="font-medium">{resumeAnalysis.file_name}</p>

              {!analysisProfile ? (
                <div className="mt-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Not analyzed yet — this reads your actual resume and
                    extracts real experience, skills, and a defense map of
                    likely follow-up questions.
                  </p>
                  <ResumeAnalysisTrigger resumeId={resumeAnalysis.id} />
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {analysisProfile.skills?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Skills (from resume)
                      </p>
                      <p className="mt-1 text-sm">
                        {analysisProfile.skills.join(", ")}
                      </p>
                    </div>
                  )}

                  {analysisProfile.experience?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Experience
                      </p>
                      <div className="mt-2 space-y-3">
                        {analysisProfile.experience.map((exp: any, i: number) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium">
                              {exp.title} · {exp.company}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {exp.duration}
                            </p>
                            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                              {exp.highlights?.map((h: string, j: number) => (
                                <li key={j}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {defenseMap.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Resume Defense Map
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Follow-up questions you should be ready for about
                        specific claims on your resume.
                      </p>
                      <div className="mt-3 space-y-3">
                        {defenseMap.map((d, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-secondary/60 p-3 text-sm"
                          >
                            <p className="font-medium">{d.claim}</p>
                            <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                              {d.possibleFollowUps.map((q, j) => (
                                <li key={j}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="mt-10 text-center">
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </a>
        </div>
      </main>
    </>
  );
}
