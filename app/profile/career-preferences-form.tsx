"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Preferences {
  desired_roles: string[];
  industries: string[];
  work_preference: string | null;
  preferred_locations: string[];
}

export function CareerPreferencesForm({
  userId,
  initial,
}: {
  userId: string;
  initial: Preferences;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [desiredRoles, setDesiredRoles] = useState(initial.desired_roles.join(", "));
  const [industries, setIndustries] = useState(initial.industries.join(", "));
  const [workPreference, setWorkPreference] = useState(initial.work_preference ?? "");
  const [locations, setLocations] = useState(initial.preferred_locations.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toList(csv: string): string[] {
    return csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("candidate_preferences").upsert(
      {
        user_id: userId,
        desired_roles: toList(desiredRoles),
        industries: toList(industries),
        work_preference: workPreference || null,
        preferred_locations: toList(locations),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Desired roles (comma-separated)
        </label>
        <input
          value={desiredRoles}
          onChange={(e) => {
            setDesiredRoles(e.target.value);
            setSaved(false);
          }}
          placeholder="Product Manager, Senior PM"
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Industries of interest (comma-separated)
        </label>
        <input
          value={industries}
          onChange={(e) => {
            setIndustries(e.target.value);
            setSaved(false);
          }}
          placeholder="Fintech, SaaS, Healthcare"
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Work preference
        </label>
        <select
          value={workPreference}
          onChange={(e) => {
            setWorkPreference(e.target.value);
            setSaved(false);
          }}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Not specified</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Preferred locations (comma-separated)
        </label>
        <input
          value={locations}
          onChange={(e) => {
            setLocations(e.target.value);
            setSaved(false);
          }}
          placeholder="Bengaluru, Remote"
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-xs text-primary">Saved</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
