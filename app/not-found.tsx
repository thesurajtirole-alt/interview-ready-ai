export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl font-medium">
        We couldn&apos;t find that page.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        It may have moved, or the link might be off. Let&apos;s get you back
        on track.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Go to home page
        </a>
        <a
          href="/dashboard"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition hover:bg-secondary"
        >
          Dashboard
        </a>
      </div>
    </main>
  );
}
