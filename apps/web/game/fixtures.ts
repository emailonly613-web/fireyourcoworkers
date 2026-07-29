import type { PieceId, PlacementCandidate } from "./types";

export interface PlacementFixture extends PlacementCandidate {
  readonly pieceId: PieceId;
}

/** A complete deterministic solution for the launch level. */
export const VALID_SOLUTION_FIXTURE: readonly PlacementFixture[] = Object.freeze([
  Object.freeze({ pieceId: "micro-managing-ceo", x: 1, y: 0, rotation: 0 }),
  Object.freeze({ pieceId: "broken-copy-machine", x: 0, y: 1, rotation: 0 }),
  Object.freeze({ pieceId: "sleeping-intern", x: 1, y: 3, rotation: 0 }),
]);

export const INVALID_PLACEMENT_FIXTURES = Object.freeze({
  outOfBounds: Object.freeze({
    pieceId: "micro-managing-ceo",
    x: 4,
    y: 0,
    rotation: 0,
  }) satisfies PlacementFixture,
  blockedControls: Object.freeze({
    pieceId: "sleeping-intern",
    x: 3,
    y: 0,
    rotation: 0,
  }) satisfies PlacementFixture,
  collisionAfterCeo: Object.freeze({
    pieceId: "broken-copy-machine",
    x: 1,
    y: 0,
    rotation: 0,
  }) satisfies PlacementFixture,
});
