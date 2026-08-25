"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PersonalInfo {
  preferred_name: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  current_job_title: string | null;
  current_company: string | null;
  years_experience: number | null;
}

export function PersonalInfoForm({
  userId,
  initial,
}: {
  userId: string;
  initial: PersonalInfo;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    preferred_name: initial.preferred_name ?? "",
    phone: initial.phone ?? "",
    location: initial.location ?? "",
    linkedin_url: initial.linkedin_url ?? "",
    current_job_title: initial.current_job_title ?? "",
    current_company: initial.current_company ?? "",
    years_experience: initial.years_experience?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        preferred_name: form.preferred_name || null,
        phone: form.phone || null,
        location: form.location || null,
        linkedin_url: form.linkedin_url || null,
        current_job_title: form.current_job_title || null,
        current_company: form.current_company || null,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Preferred name
        </label>
        <input
          value={form.preferred_name}
          onChange={(e) => update("preferred_name", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Phone
        </label>
        <input
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Location
        </label>
        <input
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          LinkedIn URL
        </label>
        <input
          value={form.linkedin_url}
          onChange={(e) => update("linkedin_url", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Current job title
        </label>
        <input
          value={form.current_job_title}
          onChange={(e) => update("current_job_title", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Current company
        </label>
        <input
          value={form.current_company}
          onChange={(e) => update("current_company", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          Years of experience
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={form.years_experience}
          onChange={(e) => update("years_experience", e.target.value)}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
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
