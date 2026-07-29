import { describe, expect, it } from "vitest";
import {
  HR_LAWSUIT_FIXTURE,
  HR_RULE_DEFINITIONS,
  clampHrScore,
  createInitialState,
  evaluateHr,
  getCompletionRating,
  getHrStatusBand,
  placePiece,
  undo,
} from "../game";
import type {
  GameState,
  HrAttempt,
  HrEvaluation,
  PieceId,
  PlacementCandidate,
} from "../game";

function place(state: GameState, pieceId: PieceId, candidate: PlacementCandidate): GameState {
  const result = placePiece(state, pieceId, candidate);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(`Expected ${pieceId} placement to succeed.`);
  return result.state;
}

function lawsuitArrangement(): GameState {
  let state = createInitialState();
  for (const fixture of HR_LAWSUIT_FIXTURE.placements) {
    state = place(state, fixture.pieceId, fixture.candidate);
  }
  return state;
}

const invalidDrop = (occurrenceKey: string): HrAttempt => ({
  type: "invalid-employee-drop",
  occurrenceKey,
  pieceId: "sleeping-intern",
  candidate: { x: 5, y: 5, rotation: 0 },
  reason: "out-of-bounds",
});

describe("deterministic HR evaluation", () => {
  it("publishes the four required visible rule definitions", () => {
    expect(HR_RULE_DEFINITIONS.map(({ id }) => id)).toEqual([
      "improper-employee-orientation",
      "unsafe-equipment-stacking",
      "unscheduled-executive-contact",
      "repeated-invalid-employee-drop",
    ]);
    expect(new Set(HR_RULE_DEFINITIONS.map(({ id }) => id)).size).toBe(4);
  });

  it("deduplicates arrangement rules even when multiple cells satisfy them", () => {
    const evaluation = evaluateHr(lawsuitArrangement());
    expect(evaluation.activeViolations.map(({ id }) => id)).toEqual([
      "improper-employee-orientation",
      "unsafe-equipment-stacking",
      "unscheduled-executive-contact",
    ]);
    expect(evaluation.activeViolations.filter(({ id }) => id === "unscheduled-executive-contact"))
      .toHaveLength(1);
    expect(evaluation.score).toBe(66);
  });

  it("clears arrangement violations when the arrangement changes", () => {
    let state = createInitialState();
    state = place(state, "micro-managing-ceo", { x: 0, y: 0, rotation: 0 });
    state = place(state, "sleeping-intern", { x: 0, y: 2, rotation: 0 });
    expect(evaluateHr(state).activeViolations.map(({ id }) => id)).toContain(
      "unscheduled-executive-contact",
    );

    state = place(state, "sleeping-intern", { x: 2, y: 4, rotation: 0 });
    expect(evaluateHr(state).activeViolations.map(({ id }) => id)).not.toContain(
      "unscheduled-executive-contact",
    );
  });

  it("persists unique invalid employee drops without double-scoring an occurrence", () => {
    const game = createInitialState();
    const first = evaluateHr(game, { attempt: invalidDrop("attempt-001") });
    expect(first.score).toBe(0);

    const second = evaluateHr(game, {
      persistentState: first.persistentState,
      attempt: invalidDrop("attempt-002"),
    });
    expect(second.score).toBe(11);
    expect(second.activeViolations[0]?.persistence).toBe("persistent-action");

    const duplicate = evaluateHr(game, {
      persistentState: second.persistentState,
      attempt: invalidDrop("attempt-002"),
    });
    expect(duplicate.score).toBe(11);
    expect(duplicate.persistentState.invalidEmployeeDrops).toHaveLength(2);
    expect(duplicate.activeViolations[0]?.evidence.occurrenceKeys).toEqual([
      "attempt-001",
      "attempt-002",
    ]);
  });

  it("clamps scores and applies every required status boundary", () => {
    expect(clampHrScore(-20)).toBe(0);
    expect(clampHrScore(140)).toBe(100);
    expect(getHrStatusBand(0)).toBe("Acceptable");
    expect(getHrStatusBand(24)).toBe("Acceptable");
    expect(getHrStatusBand(25)).toBe("Concerning");
    expect(getHrStatusBand(49)).toBe("Concerning");
    expect(getHrStatusBand(50)).toBe("Formal Warning");
    expect(getHrStatusBand(74)).toBe("Formal Warning");
    expect(getHrStatusBand(75)).toBe("Legal Is Typing");
    expect(getHrStatusBand(99)).toBe("Legal Is Typing");
    expect(getHrStatusBand(100)).toBe("Lawsuit");
    expect(getCompletionRating(0)).toBe("Perfectly Compliant");
    expect(getCompletionRating(25)).toBe("Technically Legal");
    expect(getCompletionRating(75)).toBe("HR Will Follow Up");
  });

  it("holds at 99 after four invalid drops and reaches lawsuit on the fifth", () => {
    const preLawsuit = evaluateHr(lawsuitArrangement(), {
      attempts: HR_LAWSUIT_FIXTURE.attempts.slice(0, 4),
    });
    expect(preLawsuit.score).toBe(99);
    expect(preLawsuit.statusBand).toBe("Legal Is Typing");
    expect(preLawsuit.lawsuit).toBe(false);
    expect(preLawsuit.activeViolations.at(-1)).toMatchObject({
      id: "repeated-invalid-employee-drop",
      score: 33,
    });

    const evaluation = evaluateHr(lawsuitArrangement(), {
      attempts: HR_LAWSUIT_FIXTURE.attempts,
    });

    expect(evaluation.score).toBe(100);
    expect(evaluation.statusBand).toBe("Lawsuit");
    expect(evaluation.completionRating).toBe("HR Will Follow Up");
    expect(evaluation.lawsuit).toBe(true);
    expect(evaluation.activeViolations.at(-1)).toMatchObject({
      id: "repeated-invalid-employee-drop",
      score: 34,
    });
  });

  it("recalculates arrangement state after undo while retaining action history", () => {
    const lawsuitState = lawsuitArrangement();
    const atLawsuit = evaluateHr(lawsuitState, {
      attempts: HR_LAWSUIT_FIXTURE.attempts,
    });
    const undone = undo(lawsuitState);
    expect(undone.accepted).toBe(true);
    if (!undone.accepted) throw new Error("Expected undo to succeed.");

    const recovered: HrEvaluation = evaluateHr(undone.state, {
      persistentState: atLawsuit.persistentState,
    });
    expect(recovered.lawsuit).toBe(false);
    expect(recovered.score).toBe(80);
    expect(recovered.activeViolations.map(({ id }) => id)).not.toContain(
      "unscheduled-executive-contact",
    );
    expect(recovered.activeViolations.map(({ id }) => id)).toContain(
      "repeated-invalid-employee-drop",
    );
  });
});
