import { describe, expect, it, vi } from "vitest";
import {
  TUTORIAL_STORAGE_KEY,
  markTutorialSeen,
  shouldShowTutorial,
} from "../lib/tutorial";
import {
  buildSharePayload,
  buildSiteSharePayload,
  compareChallengeResult,
  deliverShare,
  parseChallengeTarget,
} from "../lib/share";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe("first-run tutorial storage", () => {
  it("shows on first run, records the versioned marker, and stays dismissed", () => {
    const storage = memoryStorage();

    expect(TUTORIAL_STORAGE_KEY).toBe("fyc:tutorial:v1");
    expect(shouldShowTutorial(storage)).toBe(true);
    expect(markTutorialSeen(storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY, "seen");
    expect(shouldShowTutorial(storage)).toBe(false);
  });

  it("does not treat an obsolete or unexpected marker as the current tutorial", () => {
    const storage = memoryStorage({
      "fyc:tutorial:v0": "seen",
      [TUTORIAL_STORAGE_KEY]: "unexpected-value",
    });

    expect(shouldShowTutorial(storage)).toBe(true);
  });

  it("fails open when reads are unavailable and does not crash when writes fail", () => {
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error("storage blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("storage blocked");
      }),
    };

    expect(shouldShowTutorial(unavailableStorage)).toBe(true);
    expect(markTutorialSeen(unavailableStorage)).toBe(false);
    expect(shouldShowTutorial(null)).toBe(true);
    expect(markTutorialSeen(null)).toBe(false);
  });
});

describe("Floor 1 share payload", () => {
  it("builds a normalized same-origin challenge URL with deterministic copy", () => {
    const payload = buildSharePayload({
      origin: "https://fireyourcoworkers.com/untrusted/path?ignored=yes#ignored",
      score: 98.6,
      moves: 7.4,
      result: "completed",
    });
    const url = new URL(payload.url);

    expect(url.origin).toBe("https://fireyourcoworkers.com");
    expect(url.pathname).toBe("/");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      c: "v1",
      level: "mandatory-elevator-meeting",
      floor: "v1",
      target_hr: "99",
      target_moves: "7",
      outcome: "completed",
    });
    expect(url.hash).toBe("#play");
    expect(payload).toEqual({
      title: "Fire Your Coworkers — Floor 1",
      text: "I packed Floor 1 in 7 moves with 99% HR exposure. Can you beat it?",
      url: "https://fireyourcoworkers.com/?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=99&target_moves=7&outcome=completed#play",
    });
  });

  it("clamps completed challenges into honest playable bounds", () => {
    const payload = buildSharePayload({
      origin: "http://localhost:3000",
      score: 2_000_000_000,
      moves: -12,
      result: "completed",
    });
    const url = new URL(payload.url);

    expect(url.searchParams.get("target_hr")).toBe("99");
    expect(url.searchParams.get("target_moves")).toBe("3");
    expect(url.searchParams.get("outcome")).toBe("completed");
    expect(payload.text).toBe(
      "I packed Floor 1 in 3 moves with 99% HR exposure. Can you beat it?",
    );
    expect(() => buildSharePayload({
      origin: "http://localhost:3000",
      score: 12,
      moves: 3,
      result: "victory" as never,
    })).toThrow(TypeError);
  });

  it("rejects non-web origins and never serializes extra personal or replay data", () => {
    expect(() =>
      buildSharePayload({
        origin: "javascript:alert(1)",
        score: 12,
        moves: 3,
        result: "completed",
      }),
    ).toThrow(TypeError);

    const payload = buildSharePayload({
      origin: "https://person:secret@fireyourcoworkers.com/private",
      score: 12,
      moves: 3,
      result: "lawsuit",
      email: "person@example.com",
      actionLog: [{ pieceId: "micro-managing-ceo" }],
    } as never);
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("actionLog");
    expect(serialized).not.toContain("micro-managing-ceo");
    expect(new URL(payload.url).origin).toBe("https://fireyourcoworkers.com");
  });

  it("parses only a valid versioned Floor 1 target and never hydrates game state", () => {
    const payload = buildSharePayload({
      origin: "https://fireyourcoworkers.com",
      score: 42,
      moves: 3,
      result: "completed",
    });

    expect(parseChallengeTarget(new URL(payload.url).search)).toEqual({
      floorVersion: "v1",
      levelId: "mandatory-elevator-meeting",
      moves: 3,
      result: "completed",
      score: 42,
    });
    expect(parseChallengeTarget("?c=v1&level=other&floor=v1&target_hr=42&target_moves=3&outcome=completed")).toBeNull();
    expect(parseChallengeTarget("?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=101&target_moves=3&outcome=completed")).toBeNull();
    expect(parseChallengeTarget("?c=v1&c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=42&target_moves=3&outcome=completed")).toBeNull();
    expect(parseChallengeTarget("?c=v1&level=mandatory-elevator-meeting&floor=v0&target_hr=42&target_moves=3&outcome=completed")).toBeNull();
    expect(parseChallengeTarget("?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=42&target_moves=2&outcome=completed")).toBeNull();
    expect(parseChallengeTarget("?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=99&target_moves=3&outcome=lawsuit")).toBeNull();
    expect(parseChallengeTarget("?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=100&target_moves=2&outcome=lawsuit")).toBeNull();
    expect(new URL(buildSharePayload({
      origin: "https://fireyourcoworkers.com",
      score: 0,
      moves: 0,
      result: "lawsuit",
    }).url).searchParams.get("target_moves")).toBe("3");
  });

  it("builds a generic pre-result share without a fake zero-score challenge", () => {
    expect(buildSiteSharePayload("https://fireyourcoworkers.com/ignored")).toEqual({
      title: "Fire Your Coworkers",
      text: "Pack three office disasters into one elevator, dodge HR, and see whether Legal notices.",
      url: "https://fireyourcoworkers.com/#play",
    });
  });

  it("preserves the selected cast shift and adds an identity verdict", () => {
    const payload = buildSharePayload({
      origin: "https://fireyourcoworkers.com",
      score: 28,
      moves: 3,
      result: "completed",
      shiftId: "after-hours-engineering",
    });
    const url = new URL(payload.url);

    expect(url.searchParams.get("shift")).toBe("after-hours-engineering");
    expect(payload.text).toContain("CHIEF COMPRESSION OFFICER");
    expect(payload.text).toContain("After Hours shift");
    expect(parseChallengeTarget(url.search)).toMatchObject({
      shiftId: "after-hours-engineering",
    });
    expect(parseChallengeTarget(`${url.search}&shift=untrusted`)).toBeNull();
  });

  it("carries a safe elapsed-time target and the fired fictional cast member", () => {
    const payload = buildSharePayload({
      elapsedMs: 12_650,
      firedPieceId: "micro-managing-ceo",
      moves: 3,
      origin: "https://fireyourcoworkers.com",
      result: "completed",
      score: 28,
      shiftId: "after-hours-engineering",
    });
    const url = new URL(payload.url);

    expect(url.searchParams.get("target_ms")).toBe("12650");
    expect(url.searchParams.get("fired")).toBe("micro-managing-ceo");
    expect(payload.text).toContain("I fired the Director");
    expect(payload.text).not.toContain("the The");
    expect(payload.text).toContain("After Hours shift");
    expect(parseChallengeTarget(url.search)).toEqual({
      elapsedMs: 12_650,
      firedPieceId: "micro-managing-ceo",
      floorVersion: "v1",
      levelId: "mandatory-elevator-meeting",
      moves: 3,
      result: "completed",
      score: 28,
      shiftId: "after-hours-engineering",
    });
  });

  it("keeps elapsed time and fired identity optional for legacy completed links", () => {
    const legacy = parseChallengeTarget(
      "?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=28&target_moves=3&outcome=completed&shift=founders-floor",
    );

    expect(legacy).toEqual({
      floorVersion: "v1",
      levelId: "mandatory-elevator-meeting",
      moves: 3,
      result: "completed",
      score: 28,
      shiftId: "founders-floor",
    });
    expect(legacy).not.toHaveProperty("elapsedMs");
    expect(legacy).not.toHaveProperty("firedPieceId");
  });

  it("rejects duplicate, unsafe, or lawsuit-only elapsed and fired parameters", () => {
    const completed =
      "?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=28&target_moves=3&outcome=completed";
    const lawsuit =
      "?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=100&target_moves=5&outcome=lawsuit";

    expect(parseChallengeTarget(`${completed}&target_ms=12000&target_ms=11999`)).toBeNull();
    expect(parseChallengeTarget(`${completed}&target_ms=0`)).toBeNull();
    expect(parseChallengeTarget(`${completed}&target_ms=12.5`)).toBeNull();
    expect(parseChallengeTarget(`${completed}&target_ms=86400001`)).toBeNull();
    expect(parseChallengeTarget(`${completed}&fired=sleeping-intern&fired=broken-copy-machine`)).toBeNull();
    expect(parseChallengeTarget(`${completed}&fired=untrusted-coworker`)).toBeNull();
    expect(parseChallengeTarget(`${completed}&fired=%3Cscript%3E`)).toBeNull();
    expect(parseChallengeTarget(`${lawsuit}&target_ms=12000`)).toBeNull();
    expect(parseChallengeTarget(`${lawsuit}&fired=micro-managing-ceo`)).toBeNull();

    expect(() => buildSharePayload({
      elapsedMs: 0,
      moves: 3,
      origin: "https://fireyourcoworkers.com",
      result: "completed",
      score: 28,
    })).toThrow(RangeError);
    expect(() => buildSharePayload({
      elapsedMs: 12_000,
      moves: 5,
      origin: "https://fireyourcoworkers.com",
      result: "lawsuit",
      score: 100,
    })).toThrow(TypeError);
    expect(() => buildSharePayload({
      firedPieceId: "real-person" as never,
      moves: 3,
      origin: "https://fireyourcoworkers.com",
      result: "completed",
      score: 28,
    })).toThrow(TypeError);
  });

  it("compares challenge results by lower HR exposure, then fewer moves", () => {
    const target = parseChallengeTarget(
      "?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=42&target_moves=5&outcome=completed",
    );
    expect(target).not.toBeNull();
    expect(compareChallengeResult(target!, { score: 41, moves: 20 })).toBe("beat");
    expect(compareChallengeResult(target!, { score: 42, moves: 4 })).toBe("beat");
    expect(compareChallengeResult(target!, { score: 42, moves: 5 })).toBe("tied");
    expect(compareChallengeResult(target!, { score: 43, moves: 3 })).toBe("missed");
  });

  it("uses elapsed time only after HR exposure and move count tie", () => {
    const target = parseChallengeTarget(
      "?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=28&target_moves=3&target_ms=12000&outcome=completed",
    );
    expect(target).not.toBeNull();

    expect(compareChallengeResult(target!, { score: 28, moves: 3, elapsedMs: 11_999 })).toBe("beat");
    expect(compareChallengeResult(target!, { score: 28, moves: 3, elapsedMs: 12_000 })).toBe("tied");
    expect(compareChallengeResult(target!, { score: 28, moves: 3, elapsedMs: 12_001 })).toBe("missed");
    expect(compareChallengeResult(target!, { score: 27, moves: 20, elapsedMs: 99_999 })).toBe("beat");
    expect(compareChallengeResult(target!, { score: 28, moves: 2, elapsedMs: 99_999 })).toBe("beat");
    expect(compareChallengeResult(target!, { score: 29, moves: 2, elapsedMs: 1 })).toBe("missed");
    expect(compareChallengeResult(target!, { score: 28, moves: 3 })).toBe("tied");

    const legacyTarget = parseChallengeTarget(
      "?c=v1&level=mandatory-elevator-meeting&floor=v1&target_hr=28&target_moves=3&outcome=completed",
    );
    expect(compareChallengeResult(legacyTarget!, {
      elapsedMs: 1,
      moves: 3,
      score: 28,
    })).toBe("tied");
  });
});

describe("share delivery", () => {
  const payload = buildSharePayload({
    origin: "https://fireyourcoworkers.com",
    score: 99,
    moves: 7,
    result: "completed",
  });

  it("uses native Web Share without also writing to the clipboard", async () => {
    const nativeShare = vi.fn(async () => undefined);
    const writeClipboard = vi.fn(async () => undefined);

    await expect(deliverShare(payload, { nativeShare, writeClipboard })).resolves.toEqual({
      outcome: "shared",
      method: "web_share",
    });
    expect(nativeShare).toHaveBeenCalledWith(payload);
    expect(writeClipboard).not.toHaveBeenCalled();
  });

  it("treats an aborted native share as cancellation without surprising copy", async () => {
    const abort = Object.assign(new Error("share canceled"), { name: "AbortError" });
    const nativeShare = vi.fn(async () => {
      throw abort;
    });
    const writeClipboard = vi.fn(async () => undefined);

    await expect(deliverShare(payload, { nativeShare, writeClipboard })).resolves.toEqual({
      outcome: "canceled",
      method: "web_share",
    });
    expect(writeClipboard).not.toHaveBeenCalled();
  });

  it("falls back to copying after an unsupported or failed native share", async () => {
    const nativeShare = vi.fn(async () => {
      throw new Error("Web Share unavailable");
    });
    const writeClipboard = vi.fn(async () => undefined);

    await expect(deliverShare(payload, { nativeShare, writeClipboard })).resolves.toEqual({
      outcome: "copied",
      method: "clipboard",
    });
    expect(writeClipboard).toHaveBeenCalledWith(payload.url);
  });

  it("uses clipboard directly when Web Share is absent", async () => {
    const writeClipboard = vi.fn(async () => undefined);

    await expect(deliverShare(payload, { writeClipboard })).resolves.toEqual({
      outcome: "copied",
      method: "clipboard",
    });
    expect(writeClipboard).toHaveBeenCalledWith(payload.url);
  });

  it("returns a manual URL when neither automated delivery path succeeds", async () => {
    const writeClipboard = vi.fn(async () => {
      throw new Error("clipboard blocked");
    });

    await expect(deliverShare(payload, { writeClipboard })).resolves.toEqual({
      outcome: "manual",
      method: "manual",
      manualUrl: payload.url,
    });
    await expect(deliverShare(payload, {})).resolves.toEqual({
      outcome: "manual",
      method: "manual",
      manualUrl: payload.url,
    });
  });
});
