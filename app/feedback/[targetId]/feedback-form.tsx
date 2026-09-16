"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FeedbackForm({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/interview-targets/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId,
          feedbackText: text,
          privacyAcknowledged: acknowledged,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not analyze that feedback.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!showForm) {
    return (
      <div>
        <p className="text-sm font-medium">
          Did the company share any feedback?
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Yes, add it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">Paste the feedback here</p>
      <p className="mt-1 text-xs text-muted-foreground">
        A recruiter email, interviewer notes, anything they shared with
        you.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={8000}
        className="mt-2 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Paste the email or notes here…"
      />

      <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
        Your feedback may contain personal or confidential information.
        Please remove passwords, private contact details, confidential
        company information, or anything you don&apos;t want processed,
        before continuing.
      </div>

      <label className="mt-3 flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I&apos;ve reviewed this and I&apos;m okay with it being processed.
        </span>
      </label>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setShowForm(false)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting || !acknowledged || text.trim().length < 10}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Analyzing…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
