export const metadata = {
  title: "AI Interview Coach — Personalized Interview Preparation | InterviewReady AI",
  description:
    "An AI interview coach researches your target company, role, and panel, runs a realistic mock interview, and builds a training plan around your actual weaknesses — not generic tips.",
};

export default function AIInterviewCoachPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium">
        What is an AI interview coach?
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        An AI interview coach is software that prepares you for a real job
        interview by researching the specific company and role you&apos;re
        applying for, running a realistic mock interview, and giving you
        evidence-based feedback — rather than generic tips that apply to
        everyone.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-medium text-foreground">
            How is it different from generic interview tips?
          </h2>
          <p className="mt-2">
            Generic interview advice (&ldquo;use the STAR method,&rdquo;
            &ldquo;research the company&rdquo;) is the same for every
            candidate and every role. An AI interview coach instead reads
            your actual resume, the actual job description, and public
            information about your actual interview panel — then builds
            a mock interview and a training plan specific to that
            combination. The follow-up questions it asks reference
            specific claims on your resume, not generic prompts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-foreground">
            What does the process actually look like?
          </h2>
          <p className="mt-2">
            Typically: you provide the company, role, job description, and
            your resume. The system researches the company and, if you
            provide names, the interview panel — using only public
            professional information. It builds an interview blueprint (what
            topics will come up, and roughly how much time each gets), runs
            a realistic mock interview with voice and video, and produces a
            report showing what you did well and what to work on — grounded
            in specific evidence from your actual answers, not a vague
            score.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-foreground">
            Does it use my resume?
          </h2>
          <p className="mt-2">
            Yes — a real AI interview coach should analyze your resume
            directly and be ready to ask you to defend specific claims on
            it (for example, asking exactly how you achieved a stated
            metric, or what tradeoffs a described project involved). This
            is one of the clearest differentiators from generic practice
            question banks.
          </p>
        </section>
      </div>

      <div className="mt-12 rounded-xl border border-border p-6 text-center">
        <p className="font-medium">See it for yourself</p>
        <a
          href="/demo"
          className="mt-3 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Try the demo
        </a>
      </div>
    </main>
  );
}
