export const metadata = {
  title: "AI Mock Interview — Practice with a Realistic Voice & Video Panel | InterviewReady AI",
  description:
    "Practice a realistic AI mock interview with voice, video, and a simulated panel of interviewers — built around the actual company, role, and job description you're preparing for.",
};

export default function AIMockInterviewPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium">
        What is an AI mock interview?
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        An AI mock interview is a simulated job interview conducted by an AI
        interviewer, designed to closely resemble a real interview so you
        can practice under realistic conditions before the actual one.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-xl font-medium text-foreground">
            How realistic is it?
          </h2>
          <p className="mt-2">
            A good AI mock interview uses your camera and microphone, asks
            questions one at a time, listens to your actual answer, and
            follows up naturally — asking for a specific example, a metric,
            or clarification, the way a real interviewer would, instead of
            working through a fixed script. Some systems can also simulate
            multiple panel members (for example, an Engineering Manager and
            a Technical Lead), handing off between them the way a real
            panel interview would.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-foreground">
            Can I practice for a specific company and role?
          </h2>
          <p className="mt-2">
            Yes — the more specific the input (your actual resume, the
            actual job description, the actual company), the more useful
            the practice. A mock interview built around a specific role will
            weight technical, behavioral, and system-design questions
            differently depending on what that role actually requires,
            rather than asking the same generic question set to everyone.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-foreground">
            What happens after the mock interview?
          </h2>
          <p className="mt-2">
            A useful mock interview doesn&apos;t just give you a score — it
            should show you specific evidence from your actual answers (what
            you said, and why it mattered), identify real growth areas, and
            ideally connect those growth areas to focused practice drills so
            you can retest and see measurable improvement before the real
            interview.
          </p>
        </section>
      </div>

      <div className="mt-12 rounded-xl border border-border p-6 text-center">
        <p className="font-medium">Try a mock interview</p>
        <a
          href="/demo"
          className="mt-3 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          See a demo
        </a>
      </div>
    </main>
  );
}
