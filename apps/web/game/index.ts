export {
  BROKEN_COPY_MACHINE,
  MANDATORY_ELEVATOR_MEETING_LEVEL,
  MICRO_MANAGING_CEO,
  SLEEPING_INTERN,
  getPieceDefinition,
  isPieceId,
} from "./level";
export {
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
  snapshot,
  undo,
} from "./engine";
export { INVALID_PLACEMENT_FIXTURES, VALID_SOLUTION_FIXTURE } from "./fixtures";
export type { PlacementFixture } from "./fixtures";
export {
  DEFAULT_HINT_SEARCH_NODE_LIMIT,
  findGameHint,
  getGameHint,
} from "./hints";
export type {
  GameHint,
  HintSearchOptions,
  HintSearchResult,
  PlacementGameHint,
  RecoveryGameHint,
} from "./hints";
export {
  DOOR_CLOSING_START_MS,
  DOOR_OVERTIME_START_MS,
  HINT_TIME_PENALTY_MS,
  MAX_IN_PLAY_DOOR_CLOSURE,
  applyHintTimePenalty,
  getDoorPressureState,
} from "./door-pressure";
export type {
  DoorPressureOptions,
  DoorPressurePhase,
  DoorPressureState,
} from "./door-pressure";
export {
  HR_LAWSUIT_FIXTURE,
  HR_RULE_DEFINITIONS,
  clampHrScore,
  createHrPersistentState,
  evaluateHr,
  getCompletionRating,
  getHrStatusBand,
} from "./hr";
export type {
  EmployeePieceId,
  HrAttempt,
  HrCompletionRating,
  HrEvaluation,
  HrEvaluationContext,
  HrLawsuitFixture,
  HrPersistentState,
  HrRuleCategory,
  HrRuleDefinition,
  HrRuleId,
  HrRulePersistence,
  HrStatusBand,
  HrViolation,
  HrViolationEvidence,
} from "./hr";
export { PIECE_IDS } from "./types";
export type {
  Cell,
  GameActionFailureReason,
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
  PlacementViolationReason,
  Rotation,
  SerializedActionLog,
  StableGameSnapshot,
  StableOccupiedCell,
  StablePlacementSnapshot,
} from "./types";
