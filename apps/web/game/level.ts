import type { Cell, LevelDefinition, PieceDefinition, PieceId } from "./types";

const cell = (x: number, y: number): Cell => Object.freeze({ x, y });

export const SLEEPING_INTERN: PieceDefinition = Object.freeze({
  id: "sleeping-intern",
  publicName: "Sleeping Intern",
  category: "coworker",
  baseCells: Object.freeze([cell(0, 0), cell(1, 0), cell(2, 0)]),
});

export const MICRO_MANAGING_CEO: PieceDefinition = Object.freeze({
  id: "micro-managing-ceo",
  publicName: "Micro-Managing CEO",
  category: "coworker",
  baseCells: Object.freeze([
    cell(0, 0),
    cell(1, 0),
    cell(2, 0),
    cell(1, 1),
  ]),
});

export const BROKEN_COPY_MACHINE: PieceDefinition = Object.freeze({
  id: "broken-copy-machine",
  publicName: "Broken Copy Machine",
  category: "equipment",
  baseCells: Object.freeze([
    cell(0, 0),
    cell(1, 0),
    cell(0, 1),
    cell(1, 1),
  ]),
});

/**
 * Launch-level silhouette. The target cells form a cramped elevator load:
 * the CEO spans the top, the copier locks the left side, and the intern must
 * finally fit along the floor. Other legal cells remain available for staging.
 */
const TARGET_CELLS = Object.freeze([
  cell(1, 0),
  cell(2, 0),
  cell(3, 0),
  cell(0, 1),
  cell(1, 1),
  cell(2, 1),
  cell(0, 2),
  cell(1, 2),
  cell(1, 3),
  cell(2, 3),
  cell(3, 3),
]);

export const MANDATORY_ELEVATOR_MEETING_LEVEL: LevelDefinition = Object.freeze({
  id: "mandatory-elevator-meeting",
  publicBrand: "Fire Your Coworkers",
  title: "Mandatory Elevator Meeting",
  briefing:
    "Pack two coworkers and one workplace hazard into the elevator. The hazard becomes evidence; HR still makes you fire one coworker. Reach 100% exposure and HR fires you.",
  completionLine: "Elevator full. The equipment is evidence. Pick a coworker to fire.",
  grid: Object.freeze({ width: 6, height: 6 }),
  blockedCells: Object.freeze([
    cell(5, 0),
    cell(0, 5),
    cell(1, 5),
    cell(5, 5),
  ]),
  targetCells: TARGET_CELLS,
  pieces: Object.freeze([
    SLEEPING_INTERN,
    MICRO_MANAGING_CEO,
    BROKEN_COPY_MACHINE,
  ]),
});

export function isPieceId(value: unknown): value is PieceId {
  return (
    value === "sleeping-intern" ||
    value === "micro-managing-ceo" ||
    value === "broken-copy-machine"
  );
}

export function getPieceDefinition(
  id: PieceId,
  level: LevelDefinition = MANDATORY_ELEVATOR_MEETING_LEVEL,
): PieceDefinition {
  const piece = level.pieces.find((candidate) => candidate.id === id);
  if (!piece) throw new RangeError(`Unknown piece id: ${id}`);
  return piece;
}
