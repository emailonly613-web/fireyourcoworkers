import {
  MANDATORY_ELEVATOR_MEETING_LEVEL,
  getPieceDefinition,
  isPieceId,
} from "./level";
import type {
  Cell,
  GameActionResult,
  GameState,
  LevelDefinition,
  LoggedGameAction,
  PieceDefinition,
  PieceId,
  PiecePlacement,
  PlacementCandidate,
  PlacementMap,
  PlacementPreview,
  PlacementViolation,
  Rotation,
  SerializedActionLog,
  StableGameSnapshot,
  StableOccupiedCell,
  StablePlacementSnapshot,
} from "./types";

const EMPTY_PLACEMENTS: PlacementMap = Object.freeze({});

type WithoutSequence<T> = T extends unknown ? Omit<T, "sequence"> : never;
type UnsequencedGameAction = WithoutSequence<LoggedGameAction>;

const freezeCell = ({ x, y }: Cell): Cell => Object.freeze({ x, y });
const cellKey = ({ x, y }: Cell): string => `${x},${y}`;
const compareCells = (a: Cell, b: Cell): number => a.y - b.y || a.x - b.x;
const comparePieceIds = (a: PieceId, b: PieceId): number => (a < b ? -1 : a > b ? 1 : 0);

function freezePlacementMap(placements: Partial<Record<PieceId, PiecePlacement>>): PlacementMap {
  return Object.freeze({ ...placements });
}

function nextSequence(state: GameState): number {
  return state.actionLog.length + 1;
}

function nextState(
  state: GameState,
  placements: PlacementMap,
  action: UnsequencedGameAction,
  history: readonly PlacementMap[] = [...state.history, state.placements],
): GameState {
  return Object.freeze({
    level: state.level,
    placements,
    history: Object.freeze([...history]),
    actionLog: Object.freeze([
      ...state.actionLog,
      Object.freeze({ sequence: nextSequence(state), ...action }) as LoggedGameAction,
    ]),
  });
}

export function createInitialState(
  level: LevelDefinition = MANDATORY_ELEVATOR_MEETING_LEVEL,
): GameState {
  return Object.freeze({
    level,
    placements: EMPTY_PLACEMENTS,
    history: Object.freeze([]),
    actionLog: Object.freeze([]),
  });
}

/** Normalize any integral multiple of 90 into the range 0..270. */
export function normalizeRotation(degrees: number): Rotation {
  if (!Number.isFinite(degrees) || !Number.isInteger(degrees) || degrees % 90 !== 0) {
    throw new RangeError("Rotation must be an integral multiple of 90 degrees.");
  }

  return (((degrees % 360) + 360) % 360) as Rotation;
}

/** Rotate clockwise around the piece origin, then normalize to a top-left anchor. */
export function getRotatedCells(
  piece: PieceDefinition,
  rotationDegrees: number,
): readonly Cell[] {
  const rotation = normalizeRotation(rotationDegrees);
  const turns = rotation / 90;
  let cells = piece.baseCells.map(({ x, y }) => ({ x, y }));

  for (let turn = 0; turn < turns; turn += 1) {
    cells = cells.map(({ x, y }) => ({ x: -y, y: x }));
  }

  const minX = Math.min(...cells.map(({ x }) => x));
  const minY = Math.min(...cells.map(({ y }) => y));

  return Object.freeze(
    cells
      .map(({ x, y }) => freezeCell({ x: x - minX, y: y - minY }))
      .sort(compareCells),
  );
}

function collisionOwner(state: GameState, movingPieceId: PieceId, candidateCell: Cell): PieceId | undefined {
  for (const [pieceId, placement] of Object.entries(state.placements) as [
    PieceId,
    PiecePlacement,
  ][]) {
    if (pieceId === movingPieceId) continue;
    if (placement.cells.some((occupiedCell) => cellKey(occupiedCell) === cellKey(candidateCell))) {
      return pieceId;
    }
  }
  return undefined;
}

export function previewPlacement(
  state: GameState,
  pieceId: PieceId,
  candidate: PlacementCandidate,
): PlacementPreview {
  const origin = freezeCell(candidate);
  let rotation: Rotation;
  let relativeCells: readonly Cell[];

  try {
    rotation = normalizeRotation(candidate.rotation);
    relativeCells = getRotatedCells(getPieceDefinition(pieceId, state.level), rotation);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    const invalidRotation: PlacementViolation = Object.freeze({
      reason: "invalid-rotation",
    });
    return Object.freeze({
      pieceId,
      origin,
      rotation: null,
      cells: Object.freeze([]),
      valid: false,
      violations: Object.freeze([invalidRotation]),
    });
  }

  const cells = Object.freeze(
    relativeCells
      .map(({ x, y }) => freezeCell({ x: x + origin.x, y: y + origin.y }))
      .sort(compareCells),
  );
  const blocked = new Set(state.level.blockedCells.map(cellKey));
  const violations: PlacementViolation[] = [];

  for (const occupiedCell of cells) {
    if (
      occupiedCell.x < 0 ||
      occupiedCell.y < 0 ||
      occupiedCell.x >= state.level.grid.width ||
      occupiedCell.y >= state.level.grid.height
    ) {
      violations.push(Object.freeze({ reason: "out-of-bounds", cell: occupiedCell }));
      continue;
    }

    if (blocked.has(cellKey(occupiedCell))) {
      violations.push(Object.freeze({ reason: "blocked-cell", cell: occupiedCell }));
    }

    const occupiedBy = collisionOwner(state, pieceId, occupiedCell);
    if (occupiedBy) {
      violations.push(
        Object.freeze({ reason: "collision", cell: occupiedCell, occupiedBy }),
      );
    }
  }

  return Object.freeze({
    pieceId,
    origin,
    rotation,
    cells,
    valid: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

export function placePiece(
  state: GameState,
  pieceId: PieceId,
  candidate: PlacementCandidate,
): GameActionResult {
  const preview = previewPlacement(state, pieceId, candidate);
  if (!preview.valid || preview.rotation === null) {
    return Object.freeze({
      accepted: false,
      state,
      reason: "invalid-placement",
      preview,
    });
  }

  const placement: PiecePlacement = Object.freeze({
    pieceId,
    origin: preview.origin,
    rotation: preview.rotation,
    cells: preview.cells,
  });
  const placements = freezePlacementMap({ ...state.placements, [pieceId]: placement });

  return Object.freeze({
    accepted: true,
    state: nextState(state, placements, {
      type: "place",
      pieceId,
      origin: preview.origin,
      rotation: preview.rotation,
    }),
    preview,
  });
}

export function removePiece(state: GameState, pieceId: PieceId): GameActionResult {
  if (!state.placements[pieceId]) {
    return Object.freeze({ accepted: false, state, reason: "piece-not-placed" });
  }

  const placements = { ...state.placements };
  delete placements[pieceId];

  return Object.freeze({
    accepted: true,
    state: nextState(state, freezePlacementMap(placements), { type: "remove", pieceId }),
  });
}

export function undo(state: GameState): GameActionResult {
  const previous = state.history.at(-1);
  if (!previous) {
    return Object.freeze({ accepted: false, state, reason: "nothing-to-undo" });
  }

  return Object.freeze({
    accepted: true,
    state: nextState(
      state,
      previous,
      { type: "undo" },
      state.history.slice(0, -1),
    ),
  });
}

export function restart(state: GameState): GameActionResult {
  return Object.freeze({
    accepted: true,
    state: nextState(state, EMPTY_PLACEMENTS, { type: "restart" }),
  });
}

function occupiedCells(state: GameState): StableOccupiedCell[] {
  return (Object.entries(state.placements) as [PieceId, PiecePlacement][])
    .flatMap(([pieceId, placement]) =>
      placement.cells.map(({ x, y }) => Object.freeze({ x, y, pieceId })),
    )
    .sort((a, b) => compareCells(a, b) || comparePieceIds(a.pieceId, b.pieceId));
}

export function isSolved(state: GameState): boolean {
  if (Object.keys(state.placements).length !== state.level.pieces.length) return false;

  const occupied = occupiedCells(state);
  const target = [...state.level.targetCells].sort(compareCells);
  if (occupied.length !== target.length) return false;

  return occupied.every((occupiedCell, index) => cellKey(occupiedCell) === cellKey(target[index]));
}

export function getStableSnapshot(state: GameState): StableGameSnapshot {
  const placements = (Object.entries(state.placements) as [PieceId, PiecePlacement][])
    .map(
      ([pieceId, placement]): StablePlacementSnapshot =>
        Object.freeze({
          pieceId,
          x: placement.origin.x,
          y: placement.origin.y,
          rotation: placement.rotation,
          cells: Object.freeze(placement.cells.map(freezeCell).sort(compareCells)),
        }),
    )
    .sort((a, b) => comparePieceIds(a.pieceId, b.pieceId));

  return Object.freeze({
    schemaVersion: 1,
    levelId: state.level.id,
    placements: Object.freeze(placements),
    occupiedCells: Object.freeze(occupiedCells(state)),
    solved: isSolved(state),
  });
}

export const snapshot = getStableSnapshot;

export function serializeSnapshot(state: GameState): string {
  return JSON.stringify(getStableSnapshot(state));
}

export function serializeActionLog(state: GameState): string {
  const payload: SerializedActionLog = {
    schemaVersion: 1,
    levelId: state.level.id,
    actions: state.actionLog,
  };
  return JSON.stringify(payload);
}

function assertSerializedAction(action: unknown, expectedSequence: number): LoggedGameAction {
  if (!action || typeof action !== "object") throw new TypeError("Invalid action log entry.");
  const candidate = action as Record<string, unknown>;
  if (candidate.sequence !== expectedSequence || typeof candidate.type !== "string") {
    throw new TypeError("Action log sequence is invalid.");
  }

  if (candidate.type === "undo" || candidate.type === "restart") {
    return candidate as unknown as LoggedGameAction;
  }

  if (!isPieceId(candidate.pieceId)) throw new TypeError("Action log piece id is invalid.");
  if (candidate.type === "remove") return candidate as unknown as LoggedGameAction;

  if (
    candidate.type !== "place" ||
    !candidate.origin ||
    typeof candidate.origin !== "object" ||
    typeof (candidate.origin as Record<string, unknown>).x !== "number" ||
    typeof (candidate.origin as Record<string, unknown>).y !== "number" ||
    typeof candidate.rotation !== "number"
  ) {
    throw new TypeError("Action log placement is invalid.");
  }
  normalizeRotation(candidate.rotation);
  return candidate as unknown as LoggedGameAction;
}

export function replayActionLog(
  serialized: string,
  level: LevelDefinition = MANDATORY_ELEVATOR_MEETING_LEVEL,
): GameState {
  const parsed = JSON.parse(serialized) as Partial<SerializedActionLog>;
  if (
    parsed.schemaVersion !== 1 ||
    parsed.levelId !== level.id ||
    !Array.isArray(parsed.actions)
  ) {
    throw new TypeError("Action log envelope is invalid for this level.");
  }

  let state = createInitialState(level);
  parsed.actions.forEach((rawAction, index) => {
    const action = assertSerializedAction(rawAction, index + 1);
    let result: GameActionResult;

    switch (action.type) {
      case "place":
        result = placePiece(state, action.pieceId, {
          ...action.origin,
          rotation: action.rotation,
        });
        break;
      case "remove":
        result = removePiece(state, action.pieceId);
        break;
      case "undo":
        result = undo(state);
        break;
      case "restart":
        result = restart(state);
        break;
    }

    if (!result.accepted) throw new TypeError(`Action ${index + 1} cannot be replayed.`);
    state = result.state;
  });

  return state;
}
