import { getPieceDefinition } from "./level";
import type {
  Cell,
  GameState,
  PieceId,
  PiecePlacement,
  PlacementCandidate,
  PlacementViolationReason,
} from "./types";

export type HrRuleId =
  | "improper-employee-orientation"
  | "unsafe-equipment-stacking"
  | "unscheduled-executive-contact"
  | "repeated-invalid-employee-drop";

export type HrRuleCategory =
  | "employee-conduct"
  | "equipment-safety"
  | "executive-contact"
  | "action-history";

export type HrRulePersistence = "arrangement" | "persistent-action";

export type HrStatusBand =
  | "Acceptable"
  | "Concerning"
  | "Formal Warning"
  | "Legal Is Typing"
  | "Lawsuit";

export type HrCompletionRating =
  | "Perfectly Compliant"
  | "Technically Legal"
  | "HR Will Follow Up";

export interface HrRuleDefinition {
  readonly id: HrRuleId;
  readonly publicLabel: string;
  readonly category: HrRuleCategory;
  /** Base score. The repeated-drop rule applies this per repeat, capped at 34. */
  readonly score: number;
  readonly persistence: HrRulePersistence;
}

export const HR_RULE_DEFINITIONS: readonly HrRuleDefinition[] = Object.freeze([
  Object.freeze({
    id: "improper-employee-orientation",
    publicLabel: "Improper Employee Orientation",
    category: "employee-conduct",
    score: 18,
    persistence: "arrangement",
  }),
  Object.freeze({
    id: "unsafe-equipment-stacking",
    publicLabel: "Unsafe Equipment Stacking",
    category: "equipment-safety",
    score: 28,
    persistence: "arrangement",
  }),
  Object.freeze({
    id: "unscheduled-executive-contact",
    publicLabel: "Unscheduled Executive Contact",
    category: "executive-contact",
    score: 20,
    persistence: "arrangement",
  }),
  Object.freeze({
    id: "repeated-invalid-employee-drop",
    publicLabel: "Repeated Invalid Employee Drop",
    category: "action-history",
    score: 11,
    persistence: "persistent-action",
  }),
]);

export type EmployeePieceId = Exclude<PieceId, "broken-copy-machine">;

export interface HrAttempt {
  readonly type: "invalid-employee-drop";
  /** Stable identifier supplied by the input layer for one completed drop attempt. */
  readonly occurrenceKey: string;
  readonly pieceId: EmployeePieceId;
  readonly candidate: PlacementCandidate;
  readonly reason: PlacementViolationReason;
}

export interface HrPersistentState {
  readonly schemaVersion: 1;
  readonly invalidEmployeeDrops: readonly HrAttempt[];
}

export interface HrViolationEvidence {
  readonly summary: string;
  readonly pieceIds: readonly PieceId[];
  readonly cells: readonly Cell[];
  readonly occurrenceKeys: readonly string[];
}

export interface HrViolation {
  readonly id: HrRuleId;
  readonly publicLabel: string;
  readonly category: HrRuleCategory;
  readonly score: number;
  readonly persistence: HrRulePersistence;
  readonly evidence: HrViolationEvidence;
}

export interface HrEvaluationContext {
  readonly persistentState?: HrPersistentState;
  readonly attempt?: HrAttempt;
  readonly attempts?: readonly HrAttempt[];
}

export interface HrEvaluation {
  readonly score: number;
  readonly statusBand: HrStatusBand;
  readonly completionRating: HrCompletionRating;
  readonly activeViolations: readonly HrViolation[];
  readonly persistentState: HrPersistentState;
  readonly lawsuit: boolean;
}

export interface HrLawsuitFixture {
  readonly placements: readonly {
    readonly pieceId: PieceId;
    readonly candidate: PlacementCandidate;
  }[];
  readonly attempts: readonly HrAttempt[];
}

const frozenCell = ({ x, y }: Cell): Cell => Object.freeze({ x, y });
const cellKey = ({ x, y }: Cell): string => `${x},${y}`;
const compareCells = (a: Cell, b: Cell): number => a.y - b.y || a.x - b.x;
const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const definitionById = new Map(
  HR_RULE_DEFINITIONS.map((definition) => [definition.id, definition] as const),
);

function ruleDefinition(id: HrRuleId): HrRuleDefinition {
  const definition = definitionById.get(id);
  if (!definition) throw new RangeError(`Unknown HR rule id: ${id}`);
  return definition;
}

function uniqueCells(cells: readonly Cell[]): readonly Cell[] {
  const byKey = new Map<string, Cell>();
  for (const candidate of cells) byKey.set(cellKey(candidate), frozenCell(candidate));
  return Object.freeze([...byKey.values()].sort(compareCells));
}

function uniquePieceIds(pieceIds: readonly PieceId[]): readonly PieceId[] {
  return Object.freeze([...new Set(pieceIds)].sort(compareText));
}

function evidence(
  summary: string,
  pieceIds: readonly PieceId[],
  cells: readonly Cell[],
  occurrenceKeys: readonly string[] = [],
): HrViolationEvidence {
  return Object.freeze({
    summary,
    pieceIds: uniquePieceIds(pieceIds),
    cells: uniqueCells(cells),
    occurrenceKeys: Object.freeze([...new Set(occurrenceKeys)].sort(compareText)),
  });
}

function violation(
  id: HrRuleId,
  violationEvidence: HrViolationEvidence,
  scoreOverride?: number,
): HrViolation {
  const definition = ruleDefinition(id);
  return Object.freeze({
    ...definition,
    score: scoreOverride ?? definition.score,
    evidence: violationEvidence,
  });
}

function placements(state: GameState): readonly PiecePlacement[] {
  return Object.freeze(
    Object.values(state.placements)
      .filter((placement): placement is PiecePlacement => Boolean(placement))
      .sort((a, b) => compareText(a.pieceId, b.pieceId)),
  );
}

function employeePlacements(state: GameState): readonly PiecePlacement[] {
  return placements(state).filter(
    (placement) => getPieceDefinition(placement.pieceId, state.level).category === "coworker",
  );
}

function evaluateImproperOrientation(state: GameState): HrViolation | undefined {
  const affected = employeePlacements(state).filter(({ rotation }) => rotation === 180);
  if (affected.length === 0) return undefined;

  return violation(
    "improper-employee-orientation",
    evidence(
      "One or more employees are positioned upside down.",
      affected.map(({ pieceId }) => pieceId),
      affected.flatMap(({ cells }) => cells),
    ),
  );
}

function evaluateUnsafeEquipmentStacking(state: GameState): HrViolation | undefined {
  const copier = state.placements["broken-copy-machine"];
  if (!copier) return undefined;

  const matchedCells: Cell[] = [];
  const matchedEmployees: PieceId[] = [];
  for (const employee of employeePlacements(state)) {
    for (const equipmentCell of copier.cells) {
      for (const employeeCell of employee.cells) {
        if (equipmentCell.x === employeeCell.x && equipmentCell.y + 1 === employeeCell.y) {
          matchedCells.push(equipmentCell, employeeCell);
          matchedEmployees.push(employee.pieceId);
        }
      }
    }
  }
  if (matchedEmployees.length === 0) return undefined;

  return violation(
    "unsafe-equipment-stacking",
    evidence(
      "The broken copy machine is directly above an employee.",
      ["broken-copy-machine", ...matchedEmployees],
      matchedCells,
    ),
  );
}

function evaluateExecutiveContact(state: GameState): HrViolation | undefined {
  const ceo = state.placements["micro-managing-ceo"];
  const intern = state.placements["sleeping-intern"];
  if (!ceo || !intern) return undefined;

  const matchedCells: Cell[] = [];
  for (const ceoCell of ceo.cells) {
    for (const internCell of intern.cells) {
      if (Math.abs(ceoCell.x - internCell.x) + Math.abs(ceoCell.y - internCell.y) === 1) {
        matchedCells.push(ceoCell, internCell);
      }
    }
  }
  if (matchedCells.length === 0) return undefined;

  return violation(
    "unscheduled-executive-contact",
    evidence(
      "The CEO is orthogonally adjacent to the intern without a scheduled meeting.",
      ["micro-managing-ceo", "sleeping-intern"],
      matchedCells,
    ),
  );
}

function freezeAttempt(attempt: HrAttempt): HrAttempt {
  if (attempt.occurrenceKey.trim().length === 0) {
    throw new TypeError("HR attempt occurrenceKey must not be empty.");
  }
  return Object.freeze({
    ...attempt,
    candidate: Object.freeze({ ...attempt.candidate }),
  });
}

function mergePersistentState(
  previous: HrPersistentState | undefined,
  incoming: readonly HrAttempt[],
): HrPersistentState {
  const attemptsByKey = new Map<string, HrAttempt>();
  for (const attempt of previous?.invalidEmployeeDrops ?? []) {
    attemptsByKey.set(attempt.occurrenceKey, freezeAttempt(attempt));
  }
  for (const attempt of incoming) {
    if (!attemptsByKey.has(attempt.occurrenceKey)) {
      attemptsByKey.set(attempt.occurrenceKey, freezeAttempt(attempt));
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    invalidEmployeeDrops: Object.freeze(
      [...attemptsByKey.values()].sort((a, b) => compareText(a.occurrenceKey, b.occurrenceKey)),
    ),
  });
}

export function createHrPersistentState(): HrPersistentState {
  return Object.freeze({ schemaVersion: 1, invalidEmployeeDrops: Object.freeze([]) });
}

export function clampHrScore(score: number): number {
  if (!Number.isFinite(score)) throw new RangeError("HR score must be finite.");
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getHrStatusBand(rawScore: number): HrStatusBand {
  const score = clampHrScore(rawScore);
  if (score === 100) return "Lawsuit";
  if (score >= 75) return "Legal Is Typing";
  if (score >= 50) return "Formal Warning";
  if (score >= 25) return "Concerning";
  return "Acceptable";
}

export function getCompletionRating(rawScore: number): HrCompletionRating {
  const score = clampHrScore(rawScore);
  if (score === 0) return "Perfectly Compliant";
  if (score < 50) return "Technically Legal";
  return "HR Will Follow Up";
}

export function evaluateHr(
  state: GameState,
  context: HrEvaluationContext = {},
): HrEvaluation {
  const incoming = [
    ...(context.attempt ? [context.attempt] : []),
    ...(context.attempts ?? []),
  ];
  const persistentState = mergePersistentState(context.persistentState, incoming);
  const activeViolations: HrViolation[] = [];

  const arrangementViolations = [
    evaluateImproperOrientation(state),
    evaluateUnsafeEquipmentStacking(state),
    evaluateExecutiveContact(state),
  ];
  for (const active of arrangementViolations) {
    if (active) activeViolations.push(active);
  }

  const invalidDropCount = persistentState.invalidEmployeeDrops.length;
  if (invalidDropCount >= 2) {
    const repeatedDropDefinition = ruleDefinition("repeated-invalid-employee-drop");
    const repeatedDropScore = Math.min(34, (invalidDropCount - 1) * repeatedDropDefinition.score);
    activeViolations.push(
      violation(
        "repeated-invalid-employee-drop",
        evidence(
          `${invalidDropCount} unique invalid employee drops were recorded for this attempt.`,
          persistentState.invalidEmployeeDrops.map(({ pieceId }) => pieceId),
          [],
          persistentState.invalidEmployeeDrops.map(({ occurrenceKey }) => occurrenceKey),
        ),
        repeatedDropScore,
      ),
    );
  }

  const score = clampHrScore(
    activeViolations.reduce((total, active) => total + active.score, 0),
  );
  const statusBand = getHrStatusBand(score);

  return Object.freeze({
    score,
    statusBand,
    completionRating: getCompletionRating(score),
    activeViolations: Object.freeze(activeViolations),
    persistentState,
    lawsuit: statusBand === "Lawsuit",
  });
}

const fixtureAttempt = (occurrenceKey: string, pieceId: EmployeePieceId): HrAttempt =>
  Object.freeze({
    type: "invalid-employee-drop",
    occurrenceKey,
    pieceId,
    candidate: Object.freeze({ x: 5, y: 5, rotation: 180 }),
    reason: "out-of-bounds",
  });

/** Four drops yield 66 + 33 = 99; the fifth yields 66 + 34 = Lawsuit. */
export const HR_LAWSUIT_FIXTURE: HrLawsuitFixture = Object.freeze({
  placements: Object.freeze([
    Object.freeze({
      pieceId: "broken-copy-machine",
      candidate: Object.freeze({ x: 2, y: 0, rotation: 0 }),
    }),
    Object.freeze({
      pieceId: "micro-managing-ceo",
      candidate: Object.freeze({ x: 1, y: 2, rotation: 180 }),
    }),
    Object.freeze({
      pieceId: "sleeping-intern",
      candidate: Object.freeze({ x: 1, y: 4, rotation: 180 }),
    }),
  ]),
  attempts: Object.freeze([
    fixtureAttempt("lawsuit-drop-001", "sleeping-intern"),
    fixtureAttempt("lawsuit-drop-002", "micro-managing-ceo"),
    fixtureAttempt("lawsuit-drop-003", "sleeping-intern"),
    fixtureAttempt("lawsuit-drop-004", "micro-managing-ceo"),
    fixtureAttempt("lawsuit-drop-005", "sleeping-intern"),
  ]),
});
