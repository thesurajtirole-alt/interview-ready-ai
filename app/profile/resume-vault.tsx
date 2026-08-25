"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ResumeRow {
  id: string;
  file_name: string;
  label: string | null;
  is_default: boolean;
  created_at: string;
}

export function ResumeVault({
  resumes,
  usageMap,
}: {
  resumes: ResumeRow[];
  usageMap: Record<string, string[]>; // resumeId -> company names using it
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function saveLabel(id: string) {
    setBusyId(id);
    setError(null);
    const { error } = await supabase
      .from("resumes")
      .update({ label: labelDraft.trim() || null })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function setDefault(id: string) {
    setBusyId(id);
    setError(null);
    // Clear the previous default, then set the new one — no DB-level
    // uniqueness constraint for this, enforced here in application code.
    await supabase.from("resumes").update({ is_default: false }).eq("is_default", true);
    const { error } = await supabase
      .from("resumes")
      .update({ is_default: true })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function confirmDelete(id: string) {
    setBusyId(id);
    setError(null);
    // Soft delete only — never hard-deletes, so any Interview Target
    // still referencing this resume keeps working.
    const { error } = await supabase
      .from("resumes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    setBusyId(null);
    setConfirmDeleteId(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  if (resumes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No resumes uploaded yet. Add one during onboarding, or from your
        next Interview Target.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {resumes.map((r) => {
        const usedBy = usageMap[r.id] ?? [];
        return (
          <div key={r.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                {editingId === r.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      placeholder={r.file_name}
                      className="rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      onClick={() => saveLabel(r.id)}
                      disabled={busyId === r.id}
                      className="text-xs font-medium text-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="font-medium">
                    {r.label || r.file_name}
                    {r.is_default && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Default
                      </span>
                    )}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.file_name} · Uploaded{" "}
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                  {usedBy.length > 0 &&
                    ` · Used by ${usedBy.length} interview target${usedBy.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {editingId !== r.id && (
                <button
                  onClick={() => {
                    setEditingId(r.id);
                    setLabelDraft(r.label ?? "");
                  }}
                  className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-secondary"
                >
                  Rename
                </button>
              )}
              {!r.is_default && (
                <button
                  onClick={() => setDefault(r.id)}
                  disabled={busyId === r.id}
                  className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                >
                  Set as default
                </button>
              )}
              <button
                onClick={() => setConfirmDeleteId(r.id)}
                className="rounded-lg border border-border px-3 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>

            {confirmDeleteId === r.id && (
              <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">
                {usedBy.length > 0 ? (
                  <p>
                    This resume is used by your{" "}
                    <strong>{usedBy.join(", ")}</strong> interview target
                    {usedBy.length > 1 ? "s" : ""}. Deleting it here won&apos;t
                    break those — their history stays intact — but it will
                    be removed from this list.
                  </p>
                ) : (
                  <p>Delete this resume from your vault?</p>
                )}
                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => confirmDelete(r.id)}
                    disabled={busyId === r.id}
                    className="text-xs font-medium text-red-600"
                  >
                    {busyId === r.id ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
