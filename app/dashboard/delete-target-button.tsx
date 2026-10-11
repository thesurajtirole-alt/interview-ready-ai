"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTargetButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch("/api/interview-targets/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    setBusy(false);
    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        Remove
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      Remove from dashboard?
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white disabled:opacity-50"
      >
        {busy ? "Removing..." : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-border px-3 py-1.5 font-medium"
      >
        Cancel
      </button>
    </span>
  );
}
