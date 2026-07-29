export type ShareResult = "completed" | "lawsuit";

export interface BuildSharePayloadInput {
  origin: string;
  score: number;
  moves: number;
  result: ShareResult;
}

export interface SharePayload {
  readonly title: string;
  readonly text: string;
  readonly url: string;
}

export interface ChallengeTarget {
  readonly levelId: "mandatory-elevator-meeting";
  readonly floorVersion: "v1";
  readonly moves: number;
  readonly result: ShareResult;
  readonly score: number;
}

export type ChallengeVerdict = "beat" | "tied" | "missed";

export interface ShareDeliveryAdapters {
  nativeShare?: (payload: SharePayload) => void | Promise<void>;
  writeClipboard?: (text: string) => void | Promise<void>;
}

export type ShareDeliveryResult =
  | { outcome: "shared"; method: "web_share" }
  | { outcome: "copied"; method: "clipboard" }
  | { outcome: "canceled"; method: "web_share" }
  | { outcome: "manual"; method: "manual"; manualUrl: string };

const CHALLENGE_SCHEMA = "v1";
const FLOOR_ONE_LEVEL_ID = "mandatory-elevator-meeting";
const FLOOR_ONE_VERSION = "v1";
const MAX_SCORE = 100;
const MAX_MOVES = 100_000;
const SHARE_RESULTS: readonly ShareResult[] = [
  "completed",
  "lawsuit",
];

function clampInteger(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(maximum, Math.max(0, Math.round(value)));
}

function validatedOrigin(value: string): string {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new TypeError("Share origin must use HTTP or HTTPS.");
  }
  return parsed.origin;
}

function resultText(result: ShareResult, score: number, moves: number): string {
  const moveLabel = moves === 1 ? "move" : "moves";

  if (result === "completed") {
    return `I packed Floor 1 in ${moves} ${moveLabel} with ${score}% HR exposure. Can you beat it?`;
  }
  return `My Floor 1 run ended in an HR lawsuit after ${moves} ${moveLabel}. Can you escape Legal?`;
}

export function buildSharePayload(input: BuildSharePayloadInput): SharePayload {
  if (!(SHARE_RESULTS as readonly unknown[]).includes(input.result)) {
    throw new TypeError("Challenge result must be completed or lawsuit.");
  }
  const result = input.result;
  const rawScore = clampInteger(input.score, MAX_SCORE);
  const rawMoves = clampInteger(input.moves, MAX_MOVES);
  const score = result === "lawsuit" ? MAX_SCORE : Math.min(MAX_SCORE - 1, rawScore);
  const moves = Math.max(3, rawMoves);
  const url = new URL("/", validatedOrigin(input.origin));

  url.searchParams.set("c", CHALLENGE_SCHEMA);
  url.searchParams.set("level", FLOOR_ONE_LEVEL_ID);
  url.searchParams.set("floor", FLOOR_ONE_VERSION);
  url.searchParams.set("target_hr", String(score));
  url.searchParams.set("target_moves", String(moves));
  url.searchParams.set("outcome", result);
  url.hash = "play";

  return Object.freeze({
    title: "Fire Your Coworkers — Floor 1",
    text: resultText(result, score, moves),
    url: url.toString(),
  });
}

export function buildSiteSharePayload(origin: string): SharePayload {
  const url = new URL("/", validatedOrigin(origin));
  url.hash = "play";

  return Object.freeze({
    title: "Fire Your Coworkers",
    text: "Pack three office disasters into one elevator, dodge HR, and see whether Legal notices.",
    url: url.toString(),
  });
}

function readSingle(params: URLSearchParams, key: string): string | null {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] ?? null : null;
}

export function parseChallengeTarget(search: string): ChallengeTarget | null {
  const params = new URLSearchParams(search);
  const schema = readSingle(params, "c");
  const level = readSingle(params, "level");
  const floorVersion = readSingle(params, "floor");
  const scoreValue = readSingle(params, "target_hr");
  const movesValue = readSingle(params, "target_moves");
  const resultValue = readSingle(params, "outcome");

  if (
    schema !== CHALLENGE_SCHEMA ||
    level !== FLOOR_ONE_LEVEL_ID ||
    floorVersion !== FLOOR_ONE_VERSION
  ) return null;
  if (!scoreValue || !/^\d{1,3}$/.test(scoreValue)) return null;
  if (!movesValue || !/^\d{1,6}$/.test(movesValue)) return null;
  if (!resultValue || !(SHARE_RESULTS as readonly string[]).includes(resultValue)) return null;

  const score = Number(scoreValue);
  const moves = Number(movesValue);
  if (score > MAX_SCORE || moves > MAX_MOVES) return null;
  if (moves < 3) return null;
  if (resultValue === "completed" && score >= MAX_SCORE) return null;
  if (resultValue === "lawsuit" && score !== MAX_SCORE) return null;

  return Object.freeze({
    floorVersion: FLOOR_ONE_VERSION,
    levelId: FLOOR_ONE_LEVEL_ID,
    moves,
    result: resultValue as ShareResult,
    score,
  });
}

export function compareChallengeResult(
  target: ChallengeTarget,
  candidate: { score: number; moves: number },
): ChallengeVerdict {
  const score = clampInteger(candidate.score, MAX_SCORE);
  const moves = clampInteger(candidate.moves, MAX_MOVES);

  if (score < target.score) return "beat";
  if (score > target.score) return "missed";
  if (moves < target.moves) return "beat";
  if (moves > target.moves) return "missed";
  return "tied";
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export async function deliverShare(
  payload: SharePayload,
  adapters: ShareDeliveryAdapters,
): Promise<ShareDeliveryResult> {
  if (adapters.nativeShare) {
    try {
      await adapters.nativeShare(payload);
      return { outcome: "shared", method: "web_share" };
    } catch (error) {
      if (isAbortError(error)) {
        return { outcome: "canceled", method: "web_share" };
      }
    }
  }

  if (adapters.writeClipboard) {
    try {
      await adapters.writeClipboard(payload.url);
      return { outcome: "copied", method: "clipboard" };
    } catch {
      // A visible manual-copy control is the final, reliable fallback.
    }
  }

  return { outcome: "manual", method: "manual", manualUrl: payload.url };
}
