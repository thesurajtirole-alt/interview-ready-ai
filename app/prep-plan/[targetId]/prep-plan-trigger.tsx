"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIME_OPTIONS = [10, 20, 30, 45, 60];

export function PrepPlanTrigger({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview-targets/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, dailyPracticeMinutes: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not build your plan.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        How much time can you realistically practice each day?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIME_OPTIONS.map((mins) => (
          <button
            key={mins}
            onClick={() => setSelected(mins)}
            className={`rounded-lg border px-4 py-2 text-sm transition ${
              selected === mins
                ? "border-primary bg-primary/5 font-medium"
                : "border-border hover:bg-secondary"
            }`}
          >
            {mins === 60 ? "60+ minutes" : `${mins} minutes`}
          </button>
        ))}
      </div>
      <button
        onClick={generate}
        disabled={!selected || loading}
        className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Building your plan…" : "Build my prep plan"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
