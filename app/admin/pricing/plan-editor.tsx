"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Feature = {
  id: string;
  label: string;
  included: boolean;
  limitValue: number | null;
};

export function PlanEditor({
  planId,
  name,
  isFree,
  priceDollars: initialPrice,
  active: initialActive,
  features: initialFeatures,
}: {
  planId: string;
  name: string;
  isFree: boolean;
  priceDollars: number;
  active: boolean;
  features: Feature[];
}) {
  const router = useRouter();
  const [price, setPrice] = useState(String(initialPrice));
  const [active, setActive] = useState(initialActive);
  const [features, setFeatures] = useState(
    initialFeatures.map((f) => ({
      ...f,
      limitText: f.limitValue === null ? "" : String(f.limitValue),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(i: number, patch: Partial<(typeof features)[number]>) {
    setFeatures((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);

    const priceNum = Number(price);
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      setMessage("Price must be a whole number of dollars (0 or more).");
      setSaving(false);
      return;
    }
    for (const f of features) {
      if (f.limitText.trim() !== "" && !/^\d+$/.test(f.limitText.trim())) {
        setMessage(`"${f.label}" limit must be a whole number, or empty for unlimited.`);
        setSaving(false);
        return;
      }
    }

    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        priceDollars: priceNum,
        active,
        features: features.map((f) => ({
          id: f.id,
          included: f.included,
          limitValue: f.limitText.trim() === "" ? null : Number(f.limitText),
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(`Could not save: ${data.error ?? "unknown error"}`);
      return;
    }
    setMessage("Saved. Changes are live.");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">
          {name}
          {isFree && (
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
              default free plan
            </span>
          )}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => {
              setActive(e.target.checked);
              setMessage(null);
            }}
          />
          Show on pricing page
        </label>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium">Price per month (USD)</label>
        <input
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setMessage(null);
          }}
          inputMode="numeric"
          className="mt-1 w-32 rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Whole dollars. 0 shows as &quot;Free&quot;. No payments are collected yet.
        </p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium">Features and monthly limits</p>
        <div className="mt-2 space-y-2">
          {features.map((f, i) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
            >
              <label className="flex flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.included}
                  onChange={(e) => update(i, { included: e.target.checked })}
                />
                {f.label}
              </label>
              <input
                value={f.limitText}
                onChange={(e) => update(i, { limitText: e.target.value })}
                placeholder="unlimited"
                inputMode="numeric"
                className="w-28 rounded-lg border border-input bg-background px-2 py-1 text-sm"
              />
              <span className="text-xs text-muted-foreground">per month</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Leave a limit empty for unlimited. Limits apply to users on this plan
          right away.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.startsWith("Saved") ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
