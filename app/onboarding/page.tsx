"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { inferPanelPersona } from "@/lib/interview/panel-persona";

type PanelKnowledge = "full" | "partial" | "unknown";
type Confidence =
  | "nervous"
  | "somewhat_nervous"
  | "okay"
  | "pretty_confident"
  | "ready";

interface PanelMember {
  name: string;
  role: string;
  linkedin: string;
}

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screen 2 — company & role
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLinkedin, setCompanyLinkedin] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewDate, setInterviewDate] = useState("");

  // Screen 3 — panel
  const [panelKnowledge, setPanelKnowledge] = useState<PanelKnowledge | null>(
    null
  );
  const [panelMembers, setPanelMembers] = useState<PanelMember[]>([
    { name: "", role: "", linkedin: "" },
  ]);

  // Screen 4 — resume
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [candidateLinkedin, setCandidateLinkedin] = useState("");

  // Screen 5 — confidence
  const [confidence, setConfidence] = useState<Confidence | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setCheckingAuth(false);
    });
  }, [router, supabase]);

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function updatePanelMember(
    index: number,
    field: keyof PanelMember,
    value: string
  ) {
    setPanelMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");

      // 1. Company
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          name: companyName,
          website: companyWebsite || null,
          linkedin_url: companyLinkedin || null,
        })
        .select()
        .single();
      if (companyErr) throw companyErr;

      // 2. Job description
      const { data: jd, error: jdErr } = await supabase
        .from("job_descriptions")
        .insert({
          user_id: user.id,
          company_id: company.id,
          title: roleTitle,
          raw_text: jobDescription,
          interview_date: interviewDate || null,
        })
        .select()
        .single();
      if (jdErr) throw jdErr;

      // 3. Interview panel
      const { data: panel, error: panelErr } = await supabase
        .from("interview_panels")
        .insert({
          user_id: user.id,
          job_description_id: jd.id,
          knowledge_level: panelKnowledge ?? "unknown",
        })
        .select()
        .single();
      if (panelErr) throw panelErr;

      // 4. Panel members (only if the candidate provided any)
      const validMembers = panelMembers.filter((m) => m.name.trim() !== "");
      for (const member of validMembers) {
        const { data: interviewer, error: interviewerErr } = await supabase
          .from("interviewers")
          .insert({
            user_id: user.id,
            company_id: company.id,
            name: member.name,
            role_title: member.role || null,
            linkedin_url: member.linkedin || null,
          })
          .select()
          .single();
        if (interviewerErr) throw interviewerErr;

        const { error: participantErr } = await supabase
          .from("interview_participants")
          .insert({
            panel_id: panel.id,
            interviewer_id: interviewer.id,
            panel_persona: inferPanelPersona(member.role),
          });
        if (participantErr) throw participantErr;
      }

      // 5. Resume upload (optional) — automatically analyzed too, so the
      // blueprint and interview have real resume data without the
      // candidate needing a separate manual step.
      if (resumeFile) {
        const path = `${user.id}/${Date.now()}-${resumeFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("resumes")
          .upload(path, resumeFile);
        if (uploadErr) throw uploadErr;

        const { data: resumeRow, error: resumeRowErr } = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            storage_path: path,
            file_name: resumeFile.name,
            file_type: resumeFile.type || "application/octet-stream",
          })
          .select()
          .single();
        if (resumeRowErr) throw resumeRowErr;

        // Best-effort: if analysis fails (e.g. a scanned/image-only PDF),
        // don't block onboarding — the candidate can retry from /profile.
        try {
          await fetch("/api/resume/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeId: resumeRow.id }),
          });
        } catch {
          // Silently continue — analysis can be retried later.
        }
      }

      // 6. Confidence check -> profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ confidence_level: confidence })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Something went wrong saving your details.");
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      {/* progress dots */}
      {step > 0 && (
        <div className="mb-10 flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* -------- SCREEN 0: Welcome -------- */}
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-md text-center"
          >
            <h1 className="font-display text-3xl font-medium">
              Hey. Take a breath.
            </h1>
            <p className="mt-4 text-muted-foreground">
              You&apos;re not here to prove that you&apos;re perfect.
            </p>
            <p className="mt-1 text-muted-foreground">
              You&apos;re here to become ready.
            </p>
            <button
              onClick={next}
              className="mt-10 rounded-lg bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Let&apos;s prepare
            </button>
          </motion.div>
        )}

        {/* -------- SCREEN 1: Company & role -------- */}
        {step === 1 && (
          <motion.div
            key="company"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-2xl font-medium">
              Tell us about your interview.
            </h1>
            <div className="mt-8 space-y-4">
              <Field label="Company" required>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input"
                  placeholder="ABC Technologies"
                />
              </Field>
              <Field label="Company website">
                <input
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="input"
                  placeholder="https://abctech.com"
                />
              </Field>
              <Field label="Company LinkedIn">
                <input
                  value={companyLinkedin}
                  onChange={(e) => setCompanyLinkedin(e.target.value)}
                  className="input"
                  placeholder="https://linkedin.com/company/..."
                />
              </Field>
              <Field label="Role" required>
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="input"
                  placeholder="Senior Backend Engineer"
                />
              </Field>
              <Field label="Job description">
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={5}
                  className="input resize-none"
                  placeholder="Paste what you're walking into."
                />
              </Field>
              <Field label="Interview date">
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <StepNav
              onBack={back}
              onNext={next}
              nextDisabled={!companyName || !roleTitle}
            />
          </motion.div>
        )}

        {/* -------- SCREEN 2: Panel -------- */}
        {step === 2 && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-2xl font-medium">
              Who will you be meeting?
            </h1>
            <div className="mt-6 flex flex-col gap-3">
              {(
                [
                  ["full", "I know the panel"],
                  ["partial", "I know some of them"],
                  ["unknown", "I don't know yet"],
                ] as [PanelKnowledge, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPanelKnowledge(value)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                    panelKnowledge === value
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(panelKnowledge === "full" || panelKnowledge === "partial") && (
              <div className="mt-6 space-y-4">
                {panelMembers.map((member, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <input
                      value={member.name}
                      onChange={(e) =>
                        updatePanelMember(i, "name", e.target.value)
                      }
                      className="input mb-2"
                      placeholder="Name"
                    />
                    <input
                      value={member.role}
                      onChange={(e) =>
                        updatePanelMember(i, "role", e.target.value)
                      }
                      className="input mb-2"
                      placeholder="Role (e.g. Engineering Manager)"
                    />
                    <input
                      value={member.linkedin}
                      onChange={(e) =>
                        updatePanelMember(i, "linkedin", e.target.value)
                      }
                      className="input"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setPanelMembers((p) => [
                      ...p,
                      { name: "", role: "", linkedin: "" },
                    ])
                  }
                  className="text-sm font-medium text-primary"
                >
                  + Add another panel member
                </button>
              </div>
            )}

            <StepNav
              onBack={back}
              onNext={next}
              nextDisabled={!panelKnowledge}
            />
          </motion.div>
        )}

        {/* -------- SCREEN 3: Resume -------- */}
        {step === 3 && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-2xl font-medium">
              Bring your story.
            </h1>
            <div className="mt-8 space-y-4">
              <Field label="Resume (PDF, DOCX, or TXT)">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 10 * 1024 * 1024) {
                      setError("That file is over 10MB — try a smaller one.");
                      setResumeFile(null);
                      e.target.value = "";
                      return;
                    }
                    setError(null);
                    setResumeFile(file);
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium"
                />
                {resumeFile && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Selected: {resumeFile.name}
                  </p>
                )}
              </Field>
              <Field label="Your LinkedIn (optional)">
                <input
                  value={candidateLinkedin}
                  onChange={(e) => setCandidateLinkedin(e.target.value)}
                  className="input"
                  placeholder="https://linkedin.com/in/..."
                />
              </Field>
            </div>
            <StepNav onBack={back} onNext={next} />
          </motion.div>
        )}

        {/* -------- SCREEN 4: Confidence -------- */}
        {step === 4 && (
          <motion.div
            key="confidence"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-md"
          >
            <h1 className="font-display text-2xl font-medium">
              How confident do you feel right now?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This isn&apos;t an assessment — it just helps us match our tone
              to you.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {(
                [
                  ["nervous", "I'm nervous"],
                  ["somewhat_nervous", "Somewhat nervous"],
                  ["okay", "I'm okay"],
                  ["pretty_confident", "Pretty confident"],
                  ["ready", "I feel ready"],
                ] as [Confidence, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setConfidence(value)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                    confidence === value
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={back}
                disabled={submitting}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!confidence || submitting}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Setting things up…" : "Finish"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--input));
          background: transparent;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px hsl(var(--ring));
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Back
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
