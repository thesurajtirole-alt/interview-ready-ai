"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MODES = [
  { value: "friendly", label: "Friendly", desc: "Supportive, gives you room to think." },
  { value: "professional", label: "Professional", desc: "Neutral and realistic." },
  { value: "challenging", label: "Challenging", desc: "Deeper follow-ups than usual." },
  { value: "pressure", label: "Pressure", desc: "Brisk, tighter follow-ups. Never rude." },
];

function NewInterviewForm() {
  const router = useRouter();
  const params = useSearchParams();
  const jobDescriptionId = params.get("jobDescriptionId");

  const [mode, setMode] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!jobDescriptionId) {
      setError("Missing job description. Go back and try again from your research page.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescriptionId, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start the interview.");
      router.push(`/interview/${data.interviewId}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-medium">
        Let&apos;s practice together.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose the tone for this session.
      </p>

      <div className="mt-6 space-y-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`block w-full rounded-lg border px-4 py-3 text-left transition ${
              mode === m.value
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary"
            }`}
          >
            <p className="text-sm font-medium">{m.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={start}
        disabled={loading}
        className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Setting up your interview…" : "Begin"}
      </button>
    </main>
  );
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={null}>
      <NewInterviewForm />
    </Suspense>
  );
}