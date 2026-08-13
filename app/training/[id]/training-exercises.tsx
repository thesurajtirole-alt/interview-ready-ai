"use client";

import { useState } from "react";

interface Exercise {
  id: string;
  title: string;
  instructions: string;
}

interface AttemptResult {
  score: number;
  feedback: string;
  attemptNumber: number;
  improvement: number | null;
}

export function TrainingExercises({ exercises }: { exercises: Exercise[] }) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AttemptResult[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(exerciseId: string) {
    const responseText = responses[exerciseId]?.trim();
    if (!responseText) return;

    setLoadingId(exerciseId);
    setErrors((prev) => ({ ...prev, [exerciseId]: "" }));

    try {
      const res = await fetch("/api/training/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, responseText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      setResults((prev) => ({
        ...prev,
        [exerciseId]: [
          ...(prev[exerciseId] ?? []),
          {
            score: data.attempt.score,
            feedback: data.attempt.feedback,
            attemptNumber: data.attempt.attemptNumber,
            improvement: data.improvement,
          },
        ],
      }));
      setResponses((prev) => ({ ...prev, [exerciseId]: "" }));
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [exerciseId]: e.message }));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {exercises.map((ex, i) => {
        const exResults = results[ex.id] ?? [];
        const latest = exResults[exResults.length - 1];

        return (
          <div key={ex.id} className="rounded-lg border border-border p-5">
            <p className="text-xs font-medium text-accent">
              Drill {i + 1}
            </p>
            <p className="mt-1 font-medium">{ex.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {ex.instructions}
            </p>

            {exResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {exResults.map((r, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-secondary/60 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Attempt {r.attemptNumber} — {r.score}/100
                      </span>
                      {r.improvement !== null && (
                        <span
                          className={`text-xs font-medium ${
                            r.improvement >= 0 ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {r.improvement >= 0 ? "+" : ""}
                          {r.improvement} vs your first attempt
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-muted-foreground">{r.feedback}</p>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={responses[ex.id] ?? ""}
              onChange={(e) =>
                setResponses((prev) => ({ ...prev, [ex.id]: e.target.value }))
              }
              rows={3}
              placeholder={
                latest ? "Try it again, a little tighter…" : "Your attempt…"
              }
              className="mt-4 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors[ex.id] && (
              <p className="mt-1 text-xs text-red-600">{errors[ex.id]}</p>
            )}
            <button
              onClick={() => submit(ex.id)}
              disabled={loadingId === ex.id || !responses[ex.id]?.trim()}
              className="mt-2 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loadingId === ex.id
                ? "Getting feedback…"
                : exResults.length > 0
                ? "Submit this attempt"
                : "Submit first attempt"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
