"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SkillRow {
  candidateSkillId: string;
  skillId: string;
  name: string;
  category: string | null;
  years_experience: number | null;
  confidence: string | null;
}

const CATEGORIES = [
  "technical",
  "functional",
  "business",
  "leadership",
  "communication",
  "tools",
  "industry_knowledge",
];

const CATEGORY_LABEL: Record<string, string> = {
  technical: "Technical",
  functional: "Functional",
  business: "Business",
  leadership: "Leadership",
  communication: "Communication",
  tools: "Tools",
  industry_knowledge: "Industry Knowledge",
};

export function SkillsEditor({
  userId,
  initialSkills,
}: {
  userId: string;
  initialSkills: SkillRow[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [newSkillName, setNewSkillName] = useState("");
  const [newCategory, setNewCategory] = useState("technical");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", name)
        .maybeSingle();

      const skillId =
        existing?.id ??
        (await supabase.from("skills").insert({ name }).select().single()).data?.id;

      if (!skillId) throw new Error("Could not create that skill.");

      const { error } = await supabase.from("candidate_skills").upsert(
        {
          user_id: userId,
          skill_id: skillId,
          category: newCategory,
        },
        { onConflict: "user_id,skill_id" }
      );
      if (error) throw error;

      setNewSkillName("");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeSkill(candidateSkillId: string) {
    await supabase.from("candidate_skills").delete().eq("id", candidateSkillId);
    router.refresh();
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    skills: initialSkills.filter((s) => s.category === cat),
  })).filter((g) => g.skills.length > 0);

  const uncategorized = initialSkills.filter((s) => !s.category);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSkill()}
          placeholder="Add a skill…"
          className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <button
          onClick={addSkill}
          disabled={adding || !newSkillName.trim()}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {grouped.length === 0 && uncategorized.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No skills added yet — analyzing a resume will suggest some, or
          add your own above.
        </p>
      )}

      {grouped.map((g) => (
        <div key={g.category}>
          <p className="text-xs font-medium text-muted-foreground">
            {CATEGORY_LABEL[g.category]}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {g.skills.map((s) => (
              <span
                key={s.candidateSkillId}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {s.name}
                <button
                  onClick={() => removeSkill(s.candidateSkillId)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${s.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Uncategorized
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {uncategorized.map((s) => (
              <span
                key={s.candidateSkillId}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {s.name}
                <button
                  onClick={() => removeSkill(s.candidateSkillId)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${s.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
