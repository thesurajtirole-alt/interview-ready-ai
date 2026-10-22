"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelPlanButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not cancel. Please try again.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network problem. Please try again.");
    }
    setLoading(false);
    setConfirming(false);
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Cancel plan
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>Cancel at the end of this billing period?</span>
      <button
        type="button"
        onClick={cancel}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="rounded-lg border border-border px-3 py-1.5 transition hover:bg-secondary"
      >
        Keep my plan
      </button>
    </div>
  );
}
