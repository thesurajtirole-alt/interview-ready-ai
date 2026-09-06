interface CompletionInput {
  hasPreferredName: boolean;
  hasPhone: boolean;
  hasLocation: boolean;
  hasLinkedin: boolean;
  hasCurrentTitle: boolean;
  hasCurrentCompany: boolean;
  hasYearsExperience: boolean;
  hasDesiredRoles: boolean;
  hasIndustries: boolean;
  hasWorkPreference: boolean;
  hasSkills: boolean;
  hasResume: boolean;
}

const CHECKS: { key: keyof CompletionInput; label: string }[] = [
  { key: "hasPreferredName", label: "Preferred name" },
  { key: "hasPhone", label: "Phone number" },
  { key: "hasLocation", label: "Location" },
  { key: "hasLinkedin", label: "LinkedIn profile" },
  { key: "hasCurrentTitle", label: "Current job title" },
  { key: "hasCurrentCompany", label: "Current company" },
  { key: "hasYearsExperience", label: "Years of experience" },
  { key: "hasDesiredRoles", label: "Desired roles" },
  { key: "hasIndustries", label: "Industries of interest" },
  { key: "hasWorkPreference", label: "Work preference" },
  { key: "hasSkills", label: "At least one skill" },
  { key: "hasResume", label: "A resume in your vault" },
];

export function ProfileCompletion({ data }: { data: CompletionInput }) {
  const completed = CHECKS.filter((c) => data[c.key]).length;
  const total = CHECKS.length;
  const percent = Math.round((completed / total) * 100);
  const missing = CHECKS.filter((c) => !data[c.key]).map((c) => c.label);

  if (percent === 100) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-medium text-primary">
          Profile complete — 100%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Everything here helps us personalize your research and
          interview questions more precisely.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Profile completion</p>
        <p className="text-sm font-medium text-primary">{percent}%</p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        A more complete profile helps us personalize your company research
        and interview questions more precisely — it&apos;s never required,
        just helpful.
      </p>
      {missing.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Missing: {missing.join(", ")}
        </p>
      )}
    </div>
  );
}
