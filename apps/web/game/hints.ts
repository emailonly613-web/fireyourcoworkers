import { getRotatedCells } from "./engine";
import { evaluateHr } from "./hr";
import type {
  Cell,
  GameState,
  PieceId,
  PiecePlacement,
  PlacementMap,
  Rotation,
} from "./types";

export const DEFAULT_HINT_SEARCH_NODE_LIMIT = 25_000;

const ROTATIONS: readonly Rotation[] = Object.freeze([0, 90, 180, 270]);

export interface PlacementGameHint {
  readonly kind: "placement";
  readonly pieceId: PieceId;
  readonly origin: Cell;
  readonly rotation: Rotation;
  readonly cells: readonly Cell[];
}

export interface RecoveryGameHint {
  readonly kind: "recover";
  readonly pieceId: PieceId;
  readonly reason: "dead-end";
}

export type GameHint = PlacementGameHint | RecoveryGameHint;

export interface HintSearchOptions {
  /** Maximum number of search-tree nodes, including the root node. */
  readonly maxNodes?: number;
}

export interface HintSearchResult {
  readonly hint: GameHint | null;
  readonly nodesVisited: number;
  readonly solutionCount: number;
  /** True when the node bound stopped the search before every branch was visited. */
  readonly limitReached: boolean;
}

interface RankedSolution {
  readonly placements: PlacementMap;
  readonly hrScore: number;
  readonly stableKey: string;
}

const freezeCell = ({ x, y }: Cell): Cell => Object.freeze({ x, y });
const cellKey = ({ x, y }: Cell): string => `${x},${y}`;

function compareCells(a: Cell, b: Cell): number {
  return a.y - b.y || a.x - b.x;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function validatedNodeLimit(options: HintSearchOptions): number {
  const limit = options.maxNodes ?? DEFAULT_HINT_SEARCH_NODE_LIMIT;
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError("Hint search maxNodes must be a positive safe integer.");
  }
  return limit;
}

function candidatePlacements(state: GameState): ReadonlyMap<PieceId, readonly PiecePlacement[]> {
  const targetKeys = new Set(state.level.targetCells.map(cellKey));
  const blockedKeys = new Set(state.level.blockedCells.map(cellKey));
  const candidates = new Map<PieceId, readonly PiecePlacement[]>();

  for (const piece of state.level.pieces) {
    const pieceCandidates: PiecePlacement[] = [];

    for (const rotation of ROTATIONS) {
      const relativeCells = getRotatedCells(piece, rotation);
      const width = Math.max(...relativeCells.map(({ x }) => x)) + 1;
      const height = Math.max(...relativeCells.map(({ y }) => y)) + 1;

      for (let y = 0; y <= state.level.grid.height - height; y += 1) {
        for (let x = 0; x <= state.level.grid.width - width; x += 1) {
          const cells = Object.freeze(
            relativeCells
              .map((cell) => freezeCell({ x: cell.x + x, y: cell.y + y }))
              .sort(compareCells),
          );

          if (
            cells.every(
              (cell) => targetKeys.has(cellKey(cell)) && !blockedKeys.has(cellKey(cell)),
            )
          ) {
            pieceCandidates.push(
              Object.freeze({
                pieceId: piece.id,
                origin: freezeCell({ x, y }),
                rotation,
                cells,
              }),
            );
          }
        }
      }
    }

    candidates.set(piece.id, Object.freeze(pieceCandidates));
  }

  return candidates;
}

function solutionState(state: GameState, placements: PlacementMap): GameState {
  return Object.freeze({
    level: state.level,
    placements,
    history: Object.freeze([]),
    actionLog: Object.freeze([]),
  });
}

function solutionKey(state: GameState, placements: PlacementMap): string {
  return state.level.pieces
    .map(({ id }) => {
      const placement = placements[id];
      if (!placement) return `${id}:missing`;
      return [
        id,
        String(placement.rotation).padStart(3, "0"),
        String(placement.origin.y).padStart(4, "0"),
        String(placement.origin.x).padStart(4, "0"),
      ].join(":");
    })
    .join("|");
}

function samePlacement(a: PiecePlacement | undefined, b: PiecePlacement | undefined): boolean {
  if (!a || !b) return a === b;
  if (
    a.pieceId !== b.pieceId ||
    a.rotation !== b.rotation ||
    a.origin.x !== b.origin.x ||
    a.origin.y !== b.origin.y ||
    a.cells.length !== b.cells.length
  ) {
    return false;
  }

  const aCells = [...a.cells].sort(compareCells);
  const bCells = [...b.cells].sort(compareCells);
  return aCells.every(
    (cell, index) => cell.x === bCells[index]?.x && cell.y === bCells[index]?.y,
  );
}

function matchingPlacementCount(state: GameState, solution: PlacementMap): number {
  return state.level.pieces.reduce(
    (count, { id }) => count + (samePlacement(state.placements[id], solution[id]) ? 1 : 0),
    0,
  );
}

function currentPlacementCount(state: GameState): number {
  return state.level.pieces.reduce(
    (count, { id }) => count + (state.placements[id] ? 1 : 0),
    0,
  );
}

function placementHint(placement: PiecePlacement): PlacementGameHint {
  return Object.freeze({
    kind: "placement",
    pieceId: placement.pieceId,
    origin: freezeCell(placement.origin),
    rotation: placement.rotation,
    cells: Object.freeze(placement.cells.map(freezeCell).sort(compareCells)),
  });
}

function recoveryHint(pieceId: PieceId): RecoveryGameHint {
  return Object.freeze({ kind: "recover", pieceId, reason: "dead-end" });
}

function selectHint(state: GameState, rankedSolutions: readonly RankedSolution[]): GameHint | null {
  if (rankedSolutions.length === 0) return null;

  const placedCount = currentPlacementCount(state);
  const rankedByProgress = [...rankedSolutions].sort((a, b) => {
    const progressDifference =
      matchingPlacementCount(state, b.placements) -
      matchingPlacementCount(state, a.placements);
    return (
      progressDifference ||
      a.hrScore - b.hrScore ||
      compareText(a.stableKey, b.stableKey)
    );
  });
  const selected = rankedByProgress[0];
  const preservedCount = matchingPlacementCount(state, selected.placements);

  if (preservedCount < placedCount) {
    const blockingPiece = state.level.pieces.find(
      ({ id }) =>
        Boolean(state.placements[id]) &&
        !samePlacement(state.placements[id], selected.placements[id]),
    );
    return blockingPiece ? recoveryHint(blockingPiece.id) : null;
  }

  const nextPiece = state.level.pieces.find(({ id }) => !state.placements[id]);
  if (!nextPiece) return null;
  const placement = selected.placements[nextPiece.id];
  return placement ? placementHint(placement) : null;
}

/**
 * Search for an exact target cover without mutating the live game state.
 *
 * Complete layouts are ranked by how much compatible player work they retain,
 * then by arrangement-only HR score, then by a stable author-defined piece order.
 */
export function findGameHint(
  state: GameState,
  options: HintSearchOptions = {},
): HintSearchResult {
  const maxNodes = validatedNodeLimit(options);
  const targetKeys = new Set(state.level.targetCells.map(cellKey));
  const candidates = candidatePlacements(state);
  const levelOrder = new Map(
    state.level.pieces.map(({ id }, index) => [id, index] as const),
  );
  const searchPieces = [...state.level.pieces].sort((a, b) => {
    const candidateDifference =
      (candidates.get(a.id)?.length ?? 0) - (candidates.get(b.id)?.length ?? 0);
    return candidateDifference || (levelOrder.get(a.id) ?? 0) - (levelOrder.get(b.id) ?? 0);
  });
  const occupied = new Set<string>();
  const selected: Partial<Record<PieceId, PiecePlacement>> = {};
  const solutions: RankedSolution[] = [];
  let nodesVisited = 0;
  let limitReached = false;

  const visit = (depth: number): void => {
    if (nodesVisited >= maxNodes) {
      limitReached = true;
      return;
    }
    nodesVisited += 1;

    if (depth === searchPieces.length) {
      if (occupied.size !== targetKeys.size) return;
      const placements: PlacementMap = Object.freeze({ ...selected });
      solutions.push(
        Object.freeze({
          placements,
          hrScore: evaluateHr(solutionState(state, placements)).score,
          stableKey: solutionKey(state, placements),
        }),
      );
      return;
    }

    const piece = searchPieces[depth];
    for (const candidate of candidates.get(piece.id) ?? []) {
      if (candidate.cells.some((cell) => occupied.has(cellKey(cell)))) continue;

      selected[piece.id] = candidate;
      for (const cell of candidate.cells) occupied.add(cellKey(cell));
      visit(depth + 1);
      for (const cell of candidate.cells) occupied.delete(cellKey(cell));
      delete selected[piece.id];

      if (limitReached) return;
    }
  };

  visit(0);
  const rankedSolutions = Object.freeze(
    [...solutions].sort(
      (a, b) => a.hrScore - b.hrScore || compareText(a.stableKey, b.stableKey),
    ),
  );

  return Object.freeze({
    hint: selectHint(state, rankedSolutions),
    nodesVisited,
    solutionCount: rankedSolutions.length,
    limitReached,
  });
}

/** Convenience API for UI consumers that do not need search diagnostics. */
export function getGameHint(
  state: GameState,
  options: HintSearchOptions = {},
): GameHint | null {
  return findGameHint(state, options).hint;
}
