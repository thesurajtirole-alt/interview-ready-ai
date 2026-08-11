export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        InterviewReady AI
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
        Your interview isn&apos;t a test.
        <br />
        It&apos;s a skill you can train.
      </h1>
      <p className="mt-6 max-w-xl text-muted-foreground">
        Project scaffold is live (Phase 1). The full landing page, onboarding
        flow, and coaching experience are built in the phases that follow.
      </p>
      <div className="mt-8 flex gap-3">
        <a
          href="/signup"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Prepare for my interview
        </a>
        <a
          href="/login"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-secondary"
        >
          Log in
        </a>
      </div>
    </main>
  );
}
