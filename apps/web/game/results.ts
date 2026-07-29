export type RunVerdictTone = "precision" | "chaos" | "warning" | "legal";

export type RunVerdictId =
  | "chief-compression-officer"
  | "chaotic-compliance"
  | "middle-management-menace"
  | "liability-with-leadership-potential"
  | "legals-favorite-client";

export interface RunVerdictInput {
  score: number;
  moves: number;
  lawsuit: boolean;
  topViolationId?: string;
  equipmentLabel?: "copier" | "coffee machine";
}

export interface RunVerdict {
  id: RunVerdictId;
  title: string;
  kicker: string;
  caption: string;
  tone: RunVerdictTone;
}

const VIOLATION_PUNCHLINES: Readonly<Record<string, string>> = {
  "improper-employee-orientation": "The orientation memo is now horizontal.",
  "unsafe-equipment-stacking": "The copier has been promoted to load-bearing.",
  "unscheduled-executive-contact": "Executive contact occurred without a calendar invite.",
  "repeated-invalid-employee-drop": "HR counted every enthusiastic retry.",
};

const FLOOR_ONE_GOLD_SCORE = 28;

function assertRunMetrics(score: number, moves: number): void {
  if (!Number.isSafeInteger(score) || score < 0 || score > 100) {
    throw new RangeError("score must be an integer from 0 through 100");
  }

  if (!Number.isSafeInteger(moves) || moves < 0) {
    throw new RangeError("moves must be a non-negative integer");
  }
}

function metricsKicker(score: number, moves: number): string {
  return `${moves} ${moves === 1 ? "MOVE" : "MOVES"} · ${score}% HR EXPOSURE`;
}

function punchline(
  topViolationId: string | undefined,
  fallback: string,
  equipmentLabel: RunVerdictInput["equipmentLabel"],
): string {
  if (topViolationId === "unsafe-equipment-stacking" && equipmentLabel) {
    return `The ${equipmentLabel} has been promoted to load-bearing.`;
  }
  return (topViolationId && VIOLATION_PUNCHLINES[topViolationId]) || fallback;
}

/**
 * Maps final run metrics to one stable, share-friendly workplace verdict.
 * Inputs are deliberately limited to deterministic run state; no time, random,
 * browser, or persistence state can change the result.
 */
export function deriveRunVerdict({
  score,
  moves,
  lawsuit,
  topViolationId,
  equipmentLabel,
}: RunVerdictInput): RunVerdict {
  assertRunMetrics(score, moves);

  const kicker = metricsKicker(score, moves);

  if (lawsuit || score === 100) {
    return {
      id: "legals-favorite-client",
      title: "LEGAL'S FAVORITE CLIENT",
      kicker,
      caption: punchline(topViolationId, "The elevator is full. Legal's inbox is fuller.", equipmentLabel),
      tone: "legal",
    };
  }

  if (score >= 75) {
    return {
      id: "liability-with-leadership-potential",
      title: "LIABILITY WITH LEADERSHIP POTENTIAL",
      kicker,
      caption: punchline(topViolationId, "Bold placement. Legal opened a calendar invite.", equipmentLabel),
      tone: "warning",
    };
  }

  if (score >= 50) {
    return {
      id: "middle-management-menace",
      title: "MIDDLE-MANAGEMENT MENACE",
      kicker,
      caption: punchline(topViolationId, "The org chart moved. Productivity stayed for the meeting.", equipmentLabel),
      tone: "chaos",
    };
  }

  if ((score === 0 || score === FLOOR_ONE_GOLD_SCORE) && moves === 3) {
    return {
      id: "chief-compression-officer",
      title: "CHIEF COMPRESSION OFFICER",
      kicker: score === 0
        ? "CLEAN RUN · 3 MOVES"
        : `GOLD RUN · 3 MOVES · ${score}% HR EXPOSURE`,
      caption: score === 0
        ? "Zero HR drama. The elevator never saw it coming."
        : punchline(topViolationId, "Gold-standard packing. Technically still employed.", equipmentLabel),
      tone: "precision",
    };
  }

  return {
    id: "chaotic-compliance",
    title: "CHAOTIC COMPLIANCE",
    kicker,
    caption: punchline(topViolationId, "Compliance survived on a technicality.", equipmentLabel),
    tone: "chaos",
  };
}
