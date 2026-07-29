import type { PieceId } from "./types";

export const SHIFT_IDS = ["founders-floor", "after-hours-engineering"] as const;

export type ShiftId = (typeof SHIFT_IDS)[number];

export type CastArtKey =
  | "sleeping-intern"
  | "micro-managing-ceo"
  | "broken-copy-machine"
  | "burned-out-engineer"
  | "reply-all-director"
  | "coffee-machine";

export interface CastMember {
  readonly id: CastArtKey;
  readonly slot: PieceId;
  readonly publicName: string;
  readonly shortName: string;
  readonly note: string;
  readonly department: string;
  readonly successLines: readonly string[];
  readonly failureLines: readonly string[];
}

export interface ShiftDefinition {
  readonly id: ShiftId;
  readonly title: string;
  readonly shortTitle: string;
  readonly memo: string;
  readonly cast: Readonly<Record<PieceId, CastMember>>;
}

const FOUNDERS_FLOOR: ShiftDefinition = Object.freeze({
  id: "founders-floor",
  title: "Founders Floor",
  shortTitle: "Founders",
  memo: "Executive alignment, entry-level exhaustion, and one machine nobody budgeted to replace.",
  cast: Object.freeze({
    "sleeping-intern": Object.freeze({
      id: "sleeping-intern",
      slot: "sleeping-intern",
      publicName: "Sleeping Intern",
      shortName: "Intern",
      note: "Long, sleepy, surprisingly load-bearing.",
      department: "Unpaid horizontal specialist",
      successLines: Object.freeze([
        "…wake me when we get there.",
        "This counts as professional development.",
        "My camera is technically on.",
      ]),
      failureLines: Object.freeze([
        "Is my internship over?",
        "I was told this was remote.",
      ]),
    }),
    "micro-managing-ceo": Object.freeze({
      id: "micro-managing-ceo",
      slot: "micro-managing-ceo",
      publicName: "Micro-Managing CEO",
      shortName: "CEO",
      note: "Wide stance. Wider liability radius.",
      department: "Executive obstruction department",
      successLines: Object.freeze([
        "Exactly where I delegated myself.",
        "Great fit. My idea, obviously.",
        "Let's add twelve stakeholders.",
      ]),
      failureLines: Object.freeze([
        "This is not an aligned fit.",
        "Who approved these dimensions?",
      ]),
    }),
    "broken-copy-machine": Object.freeze({
      id: "broken-copy-machine",
      slot: "broken-copy-machine",
      publicName: "Broken Copy Machine",
      shortName: "Copier",
      note: "Rigid equipment. Zero spatial awareness.",
      department: "Operational equipment concern",
      successLines: Object.freeze([
        "PLACEMENT ACCEPTED. PAPERWORK PENDING.",
        "PC LOAD LETTER. CAREER LOAD LETTER.",
        "JAM CLEARED. NEW JAM CREATED.",
      ]),
      failureLines: Object.freeze([
        "ERROR: PERSONAL SPACE UNAVAILABLE.",
        "PLEASE REMOVE EXECUTIVE AND RETRY.",
      ]),
    }),
  }),
});

const AFTER_HOURS_ENGINEERING: ShiftDefinition = Object.freeze({
  id: "after-hours-engineering",
  title: "After-Hours Engineering",
  shortTitle: "After Hours",
  memo: "One deadline, forty-seven unread messages, and a coffee machine doing management's job.",
  cast: Object.freeze({
    "sleeping-intern": Object.freeze({
      id: "burned-out-engineer",
      slot: "sleeping-intern",
      publicName: "Burned-Out Engineer",
      shortName: "Engineer",
      note: "Horizontally scaling since 2:14 a.m.",
      department: "Production incident furniture",
      successLines: Object.freeze([
        "Ship it before I regain judgment.",
        "That passed locally.",
        "Wake me for the rollback.",
      ]),
      failureLines: Object.freeze([
        "Cannot reproduce.",
        "That's a feature in staging.",
      ]),
    }),
    "micro-managing-ceo": Object.freeze({
      id: "reply-all-director",
      slot: "micro-managing-ceo",
      publicName: "Reply-All Director",
      shortName: "Director",
      note: "Copies the whole company. Occupies the whole row.",
      department: "Strategic inbox amplification",
      successLines: Object.freeze([
        "Looping in the elevator.",
        "Adding visibility and seventeen people.",
        "Per my last six emails…",
      ]),
      failureLines: Object.freeze([
        "Re-forwarding for awareness.",
        "Please advise on elevator width.",
      ]),
    }),
    "broken-copy-machine": Object.freeze({
      id: "coffee-machine",
      slot: "broken-copy-machine",
      publicName: "Office Coffee Machine",
      shortName: "Coffee",
      note: "Square, essential, and one warning light from mutiny.",
      department: "Employee retention infrastructure",
      successLines: Object.freeze([
        "MORALE DISPENSED. CUP NOT INCLUDED.",
        "PRODUCTIVITY MODE: QUESTIONABLE.",
        "DOUBLE SHOT. SINGLE EXIT.",
      ]),
      failureLines: Object.freeze([
        "DESCALE TEAM BEFORE RETRYING.",
        "OUT OF SPACE. ALSO OAT MILK.",
      ]),
    }),
  }),
});

export const SHIFTS: readonly ShiftDefinition[] = Object.freeze([
  FOUNDERS_FLOOR,
  AFTER_HOURS_ENGINEERING,
]);

export const DEFAULT_SHIFT_ID: ShiftId = "founders-floor";

export function isShiftId(value: unknown): value is ShiftId {
  return (SHIFT_IDS as readonly unknown[]).includes(value);
}

export function getShift(id: ShiftId): ShiftDefinition {
  const shift = SHIFTS.find((candidate) => candidate.id === id);
  if (!shift) throw new RangeError(`Unknown shift id: ${id}`);
  return shift;
}

export function getCastMember(shiftId: ShiftId, pieceId: PieceId): CastMember {
  return getShift(shiftId).cast[pieceId];
}

export function getNextShiftId(current: ShiftId): ShiftId {
  const index = SHIFT_IDS.indexOf(current);
  return SHIFT_IDS[(index + 1) % SHIFT_IDS.length] ?? DEFAULT_SHIFT_ID;
}

export function reactionFor(
  member: CastMember,
  tone: "success" | "failure",
  sequence: number,
): string {
  const lines = tone === "success" ? member.successLines : member.failureLines;
  return lines[Math.abs(sequence) % lines.length] ?? lines[0] ?? "Noted by HR.";
}
