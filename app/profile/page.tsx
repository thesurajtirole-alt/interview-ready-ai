import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumeAnalysisTrigger } from "./resume-analysis-trigger";
import { Header } from "@/components/header";

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resumes } = await supabase
    .from("resumes")
    .select("*, candidate_profiles(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium">Your profile</h1>
      <p className="mt-2 text-muted-foreground">
        Bring your story — this is what we use to prepare you.
      </p>

      {(!resumes || resumes.length === 0) && (
        <p className="mt-8 text-sm text-muted-foreground">
          No resume uploaded yet. Add one during onboarding.
        </p>
      )}

      <div className="mt-8 space-y-6">
        {(resumes ?? []).map((r) => {
          const profile = r.candidate_profiles;
          const defenseMap = (r.resume_defense_map ?? []) as {
            claim: string;
            possibleFollowUps: string[];
          }[];

          return (
            <div key={r.id} className="rounded-lg border border-border p-5">
              <p className="font-medium">{r.file_name}</p>

              {!profile ? (
                <div className="mt-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Not analyzed yet — this reads your actual resume and
                    extracts real experience, skills, and a defense map of
                    likely follow-up questions.
                  </p>
                  <ResumeAnalysisTrigger resumeId={r.id} />
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {profile.skills?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Skills
                      </p>
                      <p className="mt-1 text-sm">
                        {profile.skills.join(", ")}
                      </p>
                    </div>
                  )}

                  {profile.experience?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Experience
                      </p>
                      <div className="mt-2 space-y-3">
                        {profile.experience.map((exp: any, i: number) => (
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
          );
        })}
      </div>

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
