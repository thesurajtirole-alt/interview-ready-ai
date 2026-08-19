"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SurpriseTrigger() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/training/surprise", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate a surprise drill.");
      router.push(`/training/${data.planId}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="rounded-lg border border-accent/40 bg-accent/5 px-5 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
      >
        {loading ? "Picking something…" : "🎲 Surprise me"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
