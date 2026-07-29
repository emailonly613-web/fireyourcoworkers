import { describe, expect, it } from "vitest";
import { createInitialState, evaluateHr, isSolved, placePiece } from "../game";
import { deriveRunVerdict } from "../game/results";

describe("deterministic run verdicts", () => {
  it("awards the best clean three-move run", () => {
    expect(deriveRunVerdict({ score: 0, moves: 3, lawsuit: false })).toEqual({
      id: "chief-compression-officer",
      title: "CHIEF COMPRESSION OFFICER",
      kicker: "CLEAN RUN · 3 MOVES",
      caption: "Zero HR drama. The elevator never saw it coming.",
      tone: "precision",
    });
  });

  it("awards the top archetype to the real gold-target solution", () => {
    let state = createInitialState();
    const placements = [
      ["micro-managing-ceo", { x: 1, y: 0, rotation: 0 }],
      ["broken-copy-machine", { x: 0, y: 1, rotation: 0 }],
      ["sleeping-intern", { x: 1, y: 3, rotation: 0 }],
    ] as const;

    for (const [pieceId, candidate] of placements) {
      const result = placePiece(state, pieceId, candidate);
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error(`Expected ${pieceId} to fit the gold solution.`);
      state = result.state;
    }

    const hr = evaluateHr(state);
    expect(isSolved(state)).toBe(true);
    expect(hr.score).toBe(28);
    expect(deriveRunVerdict({
      equipmentLabel: "copier",
      lawsuit: hr.lawsuit,
      moves: state.actionLog.length,
      score: hr.score,
      topViolationId: hr.activeViolations[0]?.id,
    })).toMatchObject({
      id: "chief-compression-officer",
      title: "CHIEF COMPRESSION OFFICER",
      tone: "precision",
    });
  });

  it("keeps non-perfect acceptable runs in chaotic compliance", () => {
    expect(deriveRunVerdict({ score: 0, moves: 4, lawsuit: false }).id).toBe(
      "chaotic-compliance",
    );
    expect(deriveRunVerdict({ score: 24, moves: 3, lawsuit: false }).id).toBe(
      "chaotic-compliance",
    );
  });

  it("applies every score-band boundary", () => {
    const verdictId = (score: number) =>
      deriveRunVerdict({ score, moves: 4, lawsuit: false }).id;

    expect(verdictId(25)).toBe("chaotic-compliance");
    expect(verdictId(49)).toBe("chaotic-compliance");
    expect(verdictId(50)).toBe("middle-management-menace");
    expect(verdictId(74)).toBe("middle-management-menace");
    expect(verdictId(75)).toBe("liability-with-leadership-potential");
    expect(verdictId(99)).toBe("liability-with-leadership-potential");
    expect(verdictId(100)).toBe("legals-favorite-client");
  });

  it("lets lawsuit state override a lower score", () => {
    expect(deriveRunVerdict({ score: 25, moves: 5, lawsuit: true })).toMatchObject({
      id: "legals-favorite-client",
      title: "LEGAL'S FAVORITE CLIENT",
      tone: "legal",
    });
  });

  it("uses only approved behavior-satire punchlines", () => {
    expect(
      deriveRunVerdict({
        score: 75,
        moves: 5,
        lawsuit: false,
        topViolationId: "unsafe-equipment-stacking",
      }).caption,
    ).toBe("The copier has been promoted to load-bearing.");

    expect(
      deriveRunVerdict({
        equipmentLabel: "coffee machine",
        score: 75,
        moves: 5,
        lawsuit: false,
        topViolationId: "unsafe-equipment-stacking",
      }).caption,
    ).toBe("The coffee machine has been promoted to load-bearing.");

    expect(
      deriveRunVerdict({
        score: 50,
        moves: 4,
        lawsuit: false,
        topViolationId: "untrusted-custom-text",
      }).caption,
    ).toBe("The org chart moved. Productivity stayed for the meeting.");
  });

  it("returns identical output for identical input", () => {
    const input = {
      score: 66,
      moves: 4,
      lawsuit: false,
      topViolationId: "unscheduled-executive-contact",
    } as const;

    expect(deriveRunVerdict(input)).toEqual(deriveRunVerdict({ ...input }));
  });

  it("rejects metrics outside the deterministic domain", () => {
    expect(() => deriveRunVerdict({ score: -1, moves: 3, lawsuit: false })).toThrow(RangeError);
    expect(() => deriveRunVerdict({ score: 101, moves: 3, lawsuit: false })).toThrow(RangeError);
    expect(() => deriveRunVerdict({ score: 20.5, moves: 3, lawsuit: false })).toThrow(RangeError);
    expect(() => deriveRunVerdict({ score: 20, moves: -1, lawsuit: false })).toThrow(RangeError);
    expect(() => deriveRunVerdict({ score: 20, moves: 1.5, lawsuit: false })).toThrow(RangeError);
  });
});
