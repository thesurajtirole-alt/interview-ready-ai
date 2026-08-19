"use client";

import { useEffect, useState } from "react";

interface FinalPrep {
  strongAreas: string[];
  thingsToRemember: string[];
  storiesToKeepReady: string[];
  likelyThemes: string[];
  questionsToAsk: string[];
  oneFinalThing: string;
}

export function FinalPrepView({ companyId }: { companyId: string }) {
  const [prep, setPrep] = useState<FinalPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/final-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Could not generate final prep.");
        setPrep(data.finalPrep);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Pulling together everything you&apos;ve prepared…
      </p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!prep) return null;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-medium text-muted-foreground">
          3 things you&apos;re strong at
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {prep.strongAreas.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">
          Things to remember
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {prep.thingsToRemember.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">
          Stories to keep ready
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {prep.storiesToKeepReady.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">
          Likely themes
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {prep.likelyThemes.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">
          Questions to ask them
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {prep.questionsToAsk.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <h2 className="text-sm font-medium text-primary">
          One final thing to focus on
        </h2>
        <p className="mt-2 text-sm">{prep.oneFinalThing}</p>
      </section>
    </div>
  );
}
