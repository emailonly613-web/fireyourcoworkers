export const DOOR_CLOSING_START_MS = 15_000;
export const DOOR_OVERTIME_START_MS = 30_000;
export const HINT_TIME_PENALTY_MS = 5_000;
export const MAX_IN_PLAY_DOOR_CLOSURE = 0.2;

export type DoorPressurePhase =
  | "boarding"
  | "doors-closing"
  | "door-hold-overtime"
  | "complete";

export interface DoorPressureOptions {
  readonly completed?: boolean;
  readonly lawsuit?: boolean;
}

export interface DoorPressureState {
  readonly phase: DoorPressurePhase;
  readonly label: "BOARDING" | "DOORS CLOSING" | "DOOR HOLD · OVERTIME" | "COMPLETE";
  readonly elapsedMs: number;
  /** Progress through the current timed phase, normalized to 0..1. */
  readonly phaseProgress: number;
  /** Visual door closure, normalized to 0..1. Never exceeds 0.2 during play. */
  readonly closureRatio: number;
  readonly overtimeMs: number;
  readonly isOvertime: boolean;
  readonly emergency: boolean;
  /** Door pressure is cosmetic and must never disable play. */
  readonly blocksInput: false;
  /** There is no timer-loss state. */
  readonly failed: false;
}

function validateElapsedMs(elapsedMs: number): void {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError("Elapsed time must be a non-negative finite number.");
  }
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Derive visual elevator-door pressure from raw play time.
 * The model is deliberately soft: overtime holds the doors partly open and
 * never blocks input, fails the attempt, or restarts the puzzle.
 */
export function getDoorPressureState(
  elapsedMs: number,
  options: DoorPressureOptions = {},
): DoorPressureState {
  validateElapsedMs(elapsedMs);
  const completed = options.completed === true;
  const emergency = options.lawsuit === true;

  if (completed) {
    return Object.freeze({
      phase: "complete",
      label: "COMPLETE",
      elapsedMs,
      phaseProgress: 1,
      closureRatio: 1,
      overtimeMs: Math.max(0, elapsedMs - DOOR_OVERTIME_START_MS),
      isOvertime: elapsedMs >= DOOR_OVERTIME_START_MS,
      emergency,
      blocksInput: false,
      failed: false,
    });
  }

  if (elapsedMs < DOOR_CLOSING_START_MS) {
    return Object.freeze({
      phase: "boarding",
      label: "BOARDING",
      elapsedMs,
      phaseProgress: clampUnit(elapsedMs / DOOR_CLOSING_START_MS),
      closureRatio: 0,
      overtimeMs: 0,
      isOvertime: false,
      emergency,
      blocksInput: false,
      failed: false,
    });
  }

  if (elapsedMs < DOOR_OVERTIME_START_MS) {
    const closingProgress = clampUnit(
      (elapsedMs - DOOR_CLOSING_START_MS) /
        (DOOR_OVERTIME_START_MS - DOOR_CLOSING_START_MS),
    );
    return Object.freeze({
      phase: "doors-closing",
      label: "DOORS CLOSING",
      elapsedMs,
      phaseProgress: closingProgress,
      closureRatio: closingProgress * MAX_IN_PLAY_DOOR_CLOSURE,
      overtimeMs: 0,
      isOvertime: false,
      emergency,
      blocksInput: false,
      failed: false,
    });
  }

  return Object.freeze({
    phase: "door-hold-overtime",
    label: "DOOR HOLD · OVERTIME",
    elapsedMs,
    phaseProgress: 1,
    closureRatio: MAX_IN_PLAY_DOOR_CLOSURE,
    overtimeMs: elapsedMs - DOOR_OVERTIME_START_MS,
    isOvertime: true,
    emergency,
    blocksInput: false,
    failed: false,
  });
}

/** Add the one-hint fairness penalty to raw completion time exactly once. */
export function applyHintTimePenalty(rawElapsedMs: number, hintUsed: boolean): number {
  validateElapsedMs(rawElapsedMs);
  const adjusted = rawElapsedMs + (hintUsed ? HINT_TIME_PENALTY_MS : 0);
  if (!Number.isFinite(adjusted)) {
    throw new RangeError("Adjusted completion time must be finite.");
  }
  return adjusted;
}
