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
        className="text-sm text-muted-foreground hover:text-red-600"
      >
        Remove
      </button>
    );
  }

  return (
    <span className="text-sm">
      Remove from dashboard?{" "}
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="font-medium text-red-600 underline"
      >
        {busy ? "Removing..." : "Yes"}
      </button>{" "}
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-muted-foreground underline"
      >
        Cancel
      </button>
    </span>
  );
}
