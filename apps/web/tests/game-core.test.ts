import { describe, expect, it } from "vitest";
import {
  INVALID_PLACEMENT_FIXTURES,
  MICRO_MANAGING_CEO,
  VALID_SOLUTION_FIXTURE,
  createInitialState,
  getRotatedCells,
  getStableSnapshot,
  isSolved,
  normalizeRotation,
  placePiece,
  previewPlacement,
  removePiece,
  replayActionLog,
  restart,
  serializeActionLog,
  serializeSnapshot,
  undo,
} from "../game";
import type { GameState } from "../game";

function acceptedState(result: ReturnType<typeof placePiece>): GameState {
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error("Expected an accepted game action.");
  return result.state;
}

function solveLevel(): GameState {
  let state = createInitialState();
  for (const fixture of VALID_SOLUTION_FIXTURE) {
    state = acceptedState(placePiece(state, fixture.pieceId, fixture));
  }
  return state;
}

describe("deterministic game core", () => {
  it("normalizes 90-degree rotations and rotates shapes deterministically", () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
    expect(() => normalizeRotation(45)).toThrow(RangeError);
    expect(getRotatedCells(MICRO_MANAGING_CEO, 90)).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(getRotatedCells(MICRO_MANAGING_CEO, 450)).toEqual(
      getRotatedCells(MICRO_MANAGING_CEO, 90),
    );
  });

  it("returns a stable, pointer-independent placement preview", () => {
    const state = createInitialState();
    const fixture = VALID_SOLUTION_FIXTURE[0];
    const first = previewPlacement(state, fixture.pieceId, fixture);
    const second = previewPlacement(state, fixture.pieceId, { ...fixture });

    expect(first).toEqual(second);
    expect(first.valid).toBe(true);
    expect(first.cells).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 2, y: 1 },
    ]);
  });

  it("rejects out-of-bounds and blocked-cell placements", () => {
    const state = createInitialState();
    const outOfBounds = previewPlacement(
      state,
      INVALID_PLACEMENT_FIXTURES.outOfBounds.pieceId,
      INVALID_PLACEMENT_FIXTURES.outOfBounds,
    );
    const blocked = previewPlacement(
      state,
      INVALID_PLACEMENT_FIXTURES.blockedControls.pieceId,
      INVALID_PLACEMENT_FIXTURES.blockedControls,
    );

    expect(outOfBounds.valid).toBe(false);
    expect(outOfBounds.violations.map(({ reason }) => reason)).toContain("out-of-bounds");
    expect(blocked.valid).toBe(false);
    expect(blocked.violations.map(({ reason }) => reason)).toContain("blocked-cell");
  });

  it("detects collisions without partially changing the board", () => {
    const initial = createInitialState();
    const withCeo = acceptedState(
      placePiece(initial, "micro-managing-ceo", VALID_SOLUTION_FIXTURE[0]),
    );
    const before = serializeSnapshot(withCeo);
    const rejected = placePiece(
      withCeo,
      INVALID_PLACEMENT_FIXTURES.collisionAfterCeo.pieceId,
      INVALID_PLACEMENT_FIXTURES.collisionAfterCeo,
    );

    expect(rejected.accepted).toBe(false);
    expect(rejected.state).toBe(withCeo);
    expect(rejected.preview?.violations.some(({ reason }) => reason === "collision")).toBe(true);
    expect(serializeSnapshot(rejected.state)).toBe(before);
    expect(rejected.state.actionLog).toHaveLength(1);
  });

  it("atomically repositions an existing piece and preserves it on a failed move", () => {
    const initial = createInitialState();
    const placed = acceptedState(
      placePiece(initial, "sleeping-intern", { x: 0, y: 4, rotation: 0 }),
    );
    const moved = acceptedState(
      placePiece(placed, "sleeping-intern", { x: 2, y: 4, rotation: 0 }),
    );
    const beforeFailure = getStableSnapshot(moved);
    const failedMove = placePiece(moved, "sleeping-intern", {
      x: 5,
      y: 4,
      rotation: 0,
    });

    expect(moved.placements["sleeping-intern"]?.origin).toEqual({ x: 2, y: 4 });
    expect(failedMove.accepted).toBe(false);
    expect(failedMove.state).toBe(moved);
    expect(getStableSnapshot(failedMove.state)).toEqual(beforeFailure);
  });

  it("removes pieces and undoes board changes", () => {
    const solved = solveLevel();
    const removed = removePiece(solved, "sleeping-intern");
    expect(removed.accepted).toBe(true);
    if (!removed.accepted) throw new Error("Expected removal to succeed.");
    expect(isSolved(removed.state)).toBe(false);

    const restored = undo(removed.state);
    expect(restored.accepted).toBe(true);
    if (!restored.accepted) throw new Error("Expected undo to succeed.");
    expect(isSolved(restored.state)).toBe(true);
    expect(undo(createInitialState()).accepted).toBe(false);
  });

  it("restarts to an empty board and can undo the restart", () => {
    const solved = solveLevel();
    const restarted = restart(solved);
    expect(restarted.accepted).toBe(true);
    if (!restarted.accepted) throw new Error("Expected restart to succeed.");
    expect(restarted.state.placements).toEqual({});
    expect(isSolved(restarted.state)).toBe(false);
    expect(restarted.state.actionLog.at(-1)?.type).toBe("restart");

    const restored = undo(restarted.state);
    expect(restored.accepted).toBe(true);
    if (!restored.accepted) throw new Error("Expected restart undo to succeed.");
    expect(isSolved(restored.state)).toBe(true);
  });

  it("recognizes the solved target and emits a stable snapshot", () => {
    const solved = solveLevel();
    expect(isSolved(solved)).toBe(true);
    expect(getStableSnapshot(solved).solved).toBe(true);
    expect(serializeSnapshot(solved)).toBe(serializeSnapshot(solved));
    expect(getStableSnapshot(solved).placements.map(({ pieceId }) => pieceId)).toEqual([
      "broken-copy-machine",
      "micro-managing-ceo",
      "sleeping-intern",
    ]);
  });

  it("serializes and deterministically replays the accepted action log", () => {
    let state = solveLevel();
    const removed = removePiece(state, "sleeping-intern");
    if (!removed.accepted) throw new Error("Expected removal to succeed.");
    state = removed.state;
    const restoredPiece = undo(state);
    if (!restoredPiece.accepted) throw new Error("Expected undo to succeed.");
    state = restoredPiece.state;
    const restarted = restart(state);
    if (!restarted.accepted) throw new Error("Expected restart to succeed.");
    state = restarted.state;
    const restoredBoard = undo(state);
    if (!restoredBoard.accepted) throw new Error("Expected restart undo to succeed.");
    state = restoredBoard.state;

    const serialized = serializeActionLog(state);
    const replayed = replayActionLog(serialized);

    expect(isSolved(replayed)).toBe(true);
    expect(serializeSnapshot(replayed)).toBe(serializeSnapshot(state));
    expect(serializeActionLog(replayed)).toBe(serialized);
  });
});
