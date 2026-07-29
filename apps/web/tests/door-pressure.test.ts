import { describe, expect, it } from "vitest";
import {
  DOOR_CLOSING_START_MS,
  DOOR_OVERTIME_START_MS,
  HINT_TIME_PENALTY_MS,
  MAX_IN_PLAY_DOOR_CLOSURE,
  applyHintTimePenalty,
  getDoorPressureState,
} from "../game/door-pressure";

describe("soft elevator-door pressure", () => {
  it("keeps the first 15 seconds in boarding with fully open doors", () => {
    expect(getDoorPressureState(0)).toMatchObject({
      phase: "boarding",
      closureRatio: 0,
      isOvertime: false,
      blocksInput: false,
      failed: false,
    });
    expect(getDoorPressureState(DOOR_CLOSING_START_MS - 1).phase).toBe("boarding");
  });

  it("closes only partially between 15 and 30 seconds", () => {
    const start = getDoorPressureState(DOOR_CLOSING_START_MS);
    const midpoint = getDoorPressureState(22_500);
    const nearOvertime = getDoorPressureState(DOOR_OVERTIME_START_MS - 1);

    expect(start).toMatchObject({ phase: "doors-closing", closureRatio: 0 });
    expect(midpoint.phaseProgress).toBe(0.5);
    expect(midpoint.closureRatio).toBe(MAX_IN_PLAY_DOOR_CLOSURE / 2);
    expect(nearOvertime.closureRatio).toBeLessThanOrEqual(MAX_IN_PLAY_DOOR_CLOSURE);
  });

  it("holds partly open in overtime without blocking or failing play", () => {
    expect(getDoorPressureState(DOOR_OVERTIME_START_MS)).toMatchObject({
      phase: "door-hold-overtime",
      closureRatio: MAX_IN_PLAY_DOOR_CLOSURE,
      overtimeMs: 0,
      isOvertime: true,
      blocksInput: false,
      failed: false,
    });
    expect(getDoorPressureState(45_000)).toMatchObject({
      overtimeMs: 15_000,
      closureRatio: MAX_IN_PLAY_DOOR_CLOSURE,
    });
  });

  it("fully closes only after completion and keeps lawsuit styling orthogonal", () => {
    const completed = getDoorPressureState(9_000, { completed: true });
    const emergency = getDoorPressureState(9_000, { lawsuit: true });

    expect(completed).toMatchObject({
      phase: "complete",
      closureRatio: 1,
      blocksInput: false,
      failed: false,
    });
    expect(emergency).toMatchObject({
      phase: "boarding",
      emergency: true,
      closureRatio: 0,
    });
    expect(Object.isFrozen(completed)).toBe(true);
  });

  it("applies one fixed five-second hint penalty to challenge time", () => {
    expect(HINT_TIME_PENALTY_MS).toBe(5_000);
    expect(applyHintTimePenalty(12_345, false)).toBe(12_345);
    expect(applyHintTimePenalty(12_345, true)).toBe(17_345);
  });

  it("rejects invalid timing inputs", () => {
    expect(() => getDoorPressureState(-1)).toThrow(RangeError);
    expect(() => getDoorPressureState(Number.NaN)).toThrow(RangeError);
    expect(() => applyHintTimePenalty(Number.POSITIVE_INFINITY, true)).toThrow(RangeError);
  });
});
