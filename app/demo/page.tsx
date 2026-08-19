export const metadata = {
  title: "Demo — InterviewReady AI",
};

export default function DemoPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
        Demo — fictional company &amp; candidate, not real data
      </div>

      <h1 className="font-display text-3xl font-medium">
        See how it works
      </h1>
      <p className="mt-2 text-muted-foreground">
        A walkthrough of what you&apos;ll get, using a fictional example:
        Northstar Technologies.
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Interview brief
          </p>
          <h2 className="mt-1 font-display text-xl font-medium">
            Northstar Technologies
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Northstar builds infrastructure monitoring tools for mid-size
            SaaS companies. Series B, ~120 employees, recently expanded
            into EU markets.
          </p>
        </section>

        <section className="rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Your panel
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-medium">Aarav Mehta</p>
              <p className="text-xs text-muted-foreground">
                Engineering Manager — 8 years backend engineering, 4 years
                leadership. Publicly listed expertise: distributed
                systems, AWS, team scaling.
              </p>
            </div>
            <div>
              <p className="font-medium">Maya Rao</p>
              <p className="text-xs text-muted-foreground">
                Senior Engineering Lead — publicly listed expertise:
                system design, observability tooling, Kubernetes.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Interview structure
          </p>
          <div className="mt-3 space-y-2">
            {[
              { stage: "Opening", pct: 10 },
              { stage: "Resume deep dive", pct: 20 },
              { stage: "Technical", pct: 35 },
              { stage: "System design", pct: 20 },
              { stage: "Behavioral", pct: 15 },
            ].map((s) => (
              <div
                key={s.stage}
                className="flex items-center justify-between text-sm"
              >
                <span>{s.stage}</span>
                <span className="font-medium text-accent">{s.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Here&apos;s what we noticed
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-sm font-medium">Strong technical depth</p>
              <p className="text-xs text-muted-foreground">
                You explained architecture decisions clearly and
                demonstrated practical experience with distributed
                systems.
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs font-medium text-accent">
                Growth area: Answer structure
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your main point tended to arrive after your example, not
                before it. Answer → Reason → Example → Result usually
                fixes this fast.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border p-5 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            Readiness
          </p>
          <p className="mt-1 font-display text-3xl font-medium text-primary">
            78 <span className="text-base text-muted-foreground">/ 100</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;re looking ready. One area of minor polish left.
          </p>
        </section>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          This was a demo. Ready to prepare for your own interview?
        </p>
        <a
          href="/signup"
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Prepare for my interview
        </a>
      </div>
    </main>
  );
}
