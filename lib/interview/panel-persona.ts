export type PanelPersona = "engineering_manager" | "technical_lead" | "hr" | "other";

/**
 * Guesses which persona category a panel member falls into based on
 * their stated role title, per spec section 9. Deliberately simple
 * keyword matching — no invented seniority or authority, just a
 * reasonable guess from what the candidate actually entered.
 */
export function inferPanelPersona(roleTitle: string | null | undefined): PanelPersona {
  if (!roleTitle) return "other";
  const t = roleTitle.toLowerCase();

  if (
    t.includes("hr") ||
    t.includes("people") ||
    t.includes("talent") ||
    t.includes("recruiter") ||
    t.includes("recruiting")
  ) {
    return "hr";
  }

  if (
    t.includes("engineering manager") ||
    t.includes("eng manager") ||
    (t.includes("manager") && (t.includes("engineer") || t.includes("technical")))
  ) {
    return "engineering_manager";
  }

  if (
    t.includes("tech lead") ||
    t.includes("technical lead") ||
    t.includes("architect") ||
    t.includes("staff engineer") ||
    t.includes("principal engineer") ||
    t.includes("senior engineer")
  ) {
    return "technical_lead";
  }

  return "other";
}

export const PERSONA_FOCUS: Record<PanelPersona, string[]> = {
  engineering_manager: ["ownership", "architecture decisions", "leadership", "prioritization"],
  technical_lead: ["technical depth", "architecture", "debugging", "scalability"],
  hr: ["communication", "motivation", "culture fit", "behavioral scenarios"],
  other: [],
};

export const PERSONA_LABEL: Record<PanelPersona, string> = {
  engineering_manager: "Engineering Manager",
  technical_lead: "Technical Lead",
  hr: "HR",
  other: "Interviewer",
};

/**
 * Which persona should lead each interview stage, per spec section 18's
 * panel-transition example (EM opens/closes, Tech Lead owns the deep
 * technical stages, HR owns behavioral).
 */
export const STAGE_PERSONA_PREFERENCE: Record<string, PanelPersona[]> = {
  opening: ["engineering_manager", "hr", "other"],
  resume_deep_dive: ["engineering_manager", "technical_lead", "other"],
  technical: ["technical_lead", "engineering_manager", "other"],
  system_design: ["technical_lead", "engineering_manager", "other"],
  behavioral: ["hr", "engineering_manager", "other"],
  leadership: ["engineering_manager", "hr", "other"],
  candidate_questions: ["engineering_manager", "hr", "other"],
};

export interface PanelMemberOption {
  name: string;
  persona: PanelPersona;
}

/**
 * Picks which panel member should lead a given stage, based on the
 * stage's persona preference order. Falls back gracefully if the
 * preferred persona isn't among the candidate's actual panel members.
 */
export function pickInterviewerForStage(
  members: PanelMemberOption[],
  stage: string
): PanelMemberOption | null {
  if (members.length === 0) return null;

  const preference = STAGE_PERSONA_PREFERENCE[stage] ?? ["other"];
  for (const persona of preference) {
    const match = members.find((m) => m.persona === persona);
    if (match) return match;
  }
  return members[0];
}
