"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl font-medium">
        Something didn&apos;t work.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This isn&apos;t something you did wrong — try again, and if it keeps
        happening, come back to this page in a few minutes.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium transition hover:bg-secondary"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
