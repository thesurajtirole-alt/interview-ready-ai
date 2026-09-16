"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OUTCOMES: { value: string; label: string }[] = [
  { value: "got_offer", label: "🟢 I got the offer" },
  { value: "moved_forward", label: "🔵 I moved to the next round" },
  { value: "waiting", label: "🟡 I'm waiting for the result" },
  { value: "didnt_move_forward", label: "🟠 I didn't move forward" },
  { value: "postponed", label: "⚪ Interview was postponed" },
  { value: "cancelled", label: "⚪ Interview was cancelled" },
  { value: "didnt_attend", label: "⚪ I didn't attend" },
  { value: "prefer_not_to_say", label: "⚪ I'd rather not say" },
];

export function OutcomeSelector({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(outcome: string) {
    setLoading(outcome);
    setError(null);
    try {
      const res = await fetch("/api/interview-targets/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, outcome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save that.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">How did it go?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {OUTCOMES.map((o) => (
          <button
            key={o.value}
            onClick={() => submit(o.value)}
            disabled={loading !== null}
            className="rounded-lg border border-border px-4 py-2.5 text-left text-sm transition hover:bg-secondary disabled:opacity-50"
          >
            {loading === o.value ? "Saving…" : o.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
