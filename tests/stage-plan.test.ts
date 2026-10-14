import { describe, it, expect } from "vitest";
import { buildStagePlan, currentStage } from "../lib/interview/stage-plan";

describe("buildStagePlan", () => {
  it("turns percentages into question counts out of 8", () => {
    const plan = buildStagePlan([
      { stage: "opening", percentage: 25 },
      { stage: "technical", percentage: 50 },
      { stage: "behavioral", percentage: 25 },
    ]);
    expect(plan).toEqual([
      { stage: "opening", targetCount: 2 },
      { stage: "technical", targetCount: 4 },
      { stage: "behavioral", targetCount: 2 },
    ]);
  });

  it("gives every included stage at least one question", () => {
    const plan = buildStagePlan([{ stage: "leadership", percentage: 5 }]);
    expect(plan).toEqual([{ stage: "leadership", targetCount: 1 }]);
  });

  it("drops stages with 0 percent", () => {
    const plan = buildStagePlan([
      { stage: "opening", percentage: 0 },
      { stage: "technical", percentage: 100 },
    ]);
    expect(plan).toEqual([{ stage: "technical", targetCount: 8 }]);
  });

  it("returns an empty plan for no stages", () => {
    expect(buildStagePlan([])).toEqual([]);
  });
});

describe("currentStage", () => {
  const plan = [
    { stage: "opening", targetCount: 1 },
    { stage: "technical", targetCount: 2 },
  ];

  it("starts at the first stage", () => {
    expect(currentStage(plan, {})).toBe("opening");
  });

  it("moves on once a stage has its questions", () => {
    expect(currentStage(plan, { opening: 1 })).toBe("technical");
  });

  it("stays in a stage until its target is reached", () => {
    expect(currentStage(plan, { opening: 1, technical: 1 })).toBe("technical");
  });

  it("returns null when the interview is complete", () => {
    expect(currentStage(plan, { opening: 1, technical: 2 })).toBeNull();
  });
});
