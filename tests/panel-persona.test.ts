import { describe, it, expect } from "vitest";
import {
  inferPanelPersona,
  pickInterviewerForStage,
  type PanelMemberOption,
} from "../lib/interview/panel-persona";

describe("inferPanelPersona", () => {
  it("recognises an engineering manager", () => {
    expect(inferPanelPersona("Engineering Manager")).toBe("engineering_manager");
  });

  it("recognises HR and recruiting titles", () => {
    expect(inferPanelPersona("HR Business Partner")).toBe("hr");
    expect(inferPanelPersona("Senior Technical Recruiter")).toBe("hr");
    expect(inferPanelPersona("Head of People")).toBe("hr");
  });

  it("recognises technical leads", () => {
    expect(inferPanelPersona("Staff Engineer")).toBe("technical_lead");
    expect(inferPanelPersona("Solutions Architect")).toBe("technical_lead");
  });

  it("does not treat the letters 'hr' inside another word as HR", () => {
    expect(inferPanelPersona("Chrome Platform Engineer")).toBe("other");
  });

  it("falls back to 'other' for empty or unknown titles", () => {
    expect(inferPanelPersona(null)).toBe("other");
    expect(inferPanelPersona(undefined)).toBe("other");
    expect(inferPanelPersona("")).toBe("other");
    expect(inferPanelPersona("Sales Director")).toBe("other");
  });
});

describe("pickInterviewerForStage", () => {
  const em: PanelMemberOption = { name: "Asha", persona: "engineering_manager" };
  const tl: PanelMemberOption = { name: "Ravi", persona: "technical_lead" };
  const hr: PanelMemberOption = { name: "Meera", persona: "hr" };

  it("returns null for an empty panel", () => {
    expect(pickInterviewerForStage([], "technical")).toBeNull();
  });

  it("gives technical stages to the technical lead", () => {
    expect(pickInterviewerForStage([em, tl, hr], "technical")).toEqual(tl);
  });

  it("gives behavioral stages to HR", () => {
    expect(pickInterviewerForStage([em, tl, hr], "behavioral")).toEqual(hr);
  });

  it("falls back to the next preferred persona", () => {
    expect(pickInterviewerForStage([em, hr], "technical")).toEqual(em);
  });

  it("falls back to the first member for an unknown stage", () => {
    expect(pickInterviewerForStage([hr, em], "made_up_stage")).toEqual(hr);
  });
});
