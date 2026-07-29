import { describe, expect, it } from "vitest";
import { createInitialState, placePiece, serializeActionLog, serializeSnapshot } from "../game";
import type { GameState } from "../game";
import {
  DEFAULT_HINT_SEARCH_NODE_LIMIT,
  findGameHint,
  getGameHint,
} from "../game/hints";

function acceptedState(result: ReturnType<typeof placePiece>): GameState {
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error("Expected an accepted game action.");
  return result.state;
}

describe("deterministic HR hints", () => {
  it("returns the same target-only placement for the same board", () => {
    const state = createInitialState();
    const first = findGameHint(state);
    const second = findGameHint(state);

    expect(first).toEqual(second);
    expect(first.limitReached).toBe(false);
    expect(first.solutionCount).toBeGreaterThan(0);
    expect(first.nodesVisited).toBeLessThanOrEqual(DEFAULT_HINT_SEARCH_NODE_LIMIT);
    expect(first.hint).toEqual({
      kind: "placement",
      pieceId: "sleeping-intern",
      origin: { x: 1, y: 3 },
      rotation: 0,
      cells: [
        { x: 1, y: 3 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ],
    });
  });

  it("preserves compatible placed pieces while suggesting the next authored piece", () => {
    const initial = createInitialState();
    const withCeo = acceptedState(
      placePiece(initial, "micro-managing-ceo", { x: 1, y: 0, rotation: 0 }),
    );

    expect(getGameHint(withCeo)).toMatchObject({
      kind: "placement",
      pieceId: "sleeping-intern",
      origin: { x: 1, y: 3 },
      rotation: 0,
    });
  });

  it("preserves a solvable higher-HR orientation instead of rewriting player progress", () => {
    const withUpsideDownIntern = acceptedState(
      placePiece(createInitialState(), "sleeping-intern", {
        x: 1,
        y: 3,
        rotation: 180,
      }),
    );

    expect(getGameHint(withUpsideDownIntern)).toMatchObject({
      kind: "placement",
      pieceId: "micro-managing-ceo",
    });
  });

  it("identifies the placed piece that makes the current board a dead end", () => {
    let state = createInitialState();
    state = acceptedState(
      placePiece(state, "micro-managing-ceo", { x: 1, y: 0, rotation: 0 }),
    );
    state = acceptedState(
      placePiece(state, "sleeping-intern", { x: 2, y: 4, rotation: 0 }),
    );

    expect(getGameHint(state)).toEqual({
      kind: "recover",
      pieceId: "sleeping-intern",
      reason: "dead-end",
    });
  });

  it("prefers the lowest-HR orientation when equivalent covers exist", () => {
    let state = createInitialState();
    state = acceptedState(
      placePiece(state, "micro-managing-ceo", { x: 1, y: 0, rotation: 0 }),
    );
    state = acceptedState(
      placePiece(state, "broken-copy-machine", { x: 0, y: 1, rotation: 0 }),
    );

    expect(getGameHint(state)).toMatchObject({
      kind: "placement",
      pieceId: "sleeping-intern",
      rotation: 0,
    });
  });

  it("returns no hint after the exact target is complete", () => {
    let state = createInitialState();
    for (const [pieceId, candidate] of [
      ["micro-managing-ceo", { x: 1, y: 0, rotation: 0 }],
      ["broken-copy-machine", { x: 0, y: 1, rotation: 0 }],
      ["sleeping-intern", { x: 1, y: 3, rotation: 0 }],
    ] as const) {
      state = acceptedState(placePiece(state, pieceId, candidate));
    }

    expect(getGameHint(state)).toBeNull();
  });

  it("does not mutate placements, history, or the action log", () => {
    const state = acceptedState(
      placePiece(createInitialState(), "micro-managing-ceo", {
        x: 1,
        y: 0,
        rotation: 0,
      }),
    );
    const placementsReference = state.placements;
    const historyReference = state.history;
    const actionLogReference = state.actionLog;
    const beforeSnapshot = serializeSnapshot(state);
    const beforeActions = serializeActionLog(state);

    const hint = getGameHint(state);

    expect(serializeSnapshot(state)).toBe(beforeSnapshot);
    expect(serializeActionLog(state)).toBe(beforeActions);
    expect(state.placements).toBe(placementsReference);
    expect(state.history).toBe(historyReference);
    expect(state.actionLog).toBe(actionLogReference);
    expect(Object.isFrozen(hint)).toBe(true);
  });

  it("reports a deterministic bounded-search stop without exceeding maxNodes", () => {
    const result = findGameHint(createInitialState(), { maxNodes: 1 });

    expect(result).toEqual({
      hint: null,
      nodesVisited: 1,
      solutionCount: 0,
      limitReached: true,
    });
    expect(() => findGameHint(createInitialState(), { maxNodes: 0 })).toThrow(RangeError);
    expect(() => findGameHint(createInitialState(), { maxNodes: 1.5 })).toThrow(RangeError);
  });
});
