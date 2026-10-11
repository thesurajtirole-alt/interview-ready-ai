"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccount() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: text }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    await createClient().auth.signOut();
    router.push("/");
  }

  return (
    <div className="mt-10 rounded-lg border border-red-300 p-5">
      <h2 className="font-medium text-red-600">Danger zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account and all your data: resumes, interviews,
        reports, and progress. This cannot be undone.
      </p>
      <p className="mt-4 text-sm">
        Type <span className="font-mono font-medium">DELETE</span> to confirm:
      </p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={remove}
        disabled={text !== "DELETE" || busy}
        className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {busy ? "Deleting..." : "Delete my account"}
      </button>
    </div>
  );
}
