import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PIECE_IDS } from "../game";
import { SHIFTS } from "../game/cast";

const webRoot = resolve(import.meta.dirname, "..");
const playableSource = readFileSync(
  resolve(webRoot, "components/game/PlayableElevator.tsx"),
  "utf8",
);
const reviewSource = readFileSync(
  resolve(webRoot, "components/share/PerformanceReviewActions.tsx"),
  "utf8",
);
const gameCss = readFileSync(resolve(webRoot, "app/game.css"), "utf8");

describe("fictional termination payoff", () => {
  it("defines exactly two fireable coworkers and one equipment exhibit per shift", () => {
    for (const shift of SHIFTS) {
      const coworkers = PIECE_IDS.filter((pieceId) => shift.cast[pieceId].kind === "coworker");
      const equipment = PIECE_IDS.filter((pieceId) => shift.cast[pieceId].kind === "equipment");
      expect(coworkers).toHaveLength(2);
      expect(equipment).toHaveLength(1);
      for (const pieceId of coworkers) {
        const member = shift.cast[pieceId];
        expect(member.terminationReason.length).toBeGreaterThan(12);
        expect(member.terminationLine.length).toBeGreaterThan(12);
      }
    }
  });

  it("requires a fictional cast choice before exposing the dominant share action", () => {
    expect(playableSource).toContain("THE HAZARD CAUSED THE MESS. HR STILL NEEDS A HUMAN NAME.");
    expect(playableSource).toContain('kind === "coworker"');
    expect(playableSource).toContain("EXHIBIT A · NOT AN EMPLOYEE");
    expect(playableSource).toContain("Machines get repaired. People get blamed.");
    expect(playableSource).toContain('data-testid={`fire-${pieceId}`}');
    expect(playableSource).toContain("Only fictional coworkers can be fired");
    expect(playableSource).toContain("firedPieceId={firedPieceId}");
    expect(playableSource).toContain("elapsedMs={completedElapsedMs ?? 1}");
  });

  it("turns the selected character into the share-card story", () => {
    expect(reviewSource).toContain('context.fillText("I FIRED THE"');
    expect(reviewSource).toContain("firedMember.shortName.toUpperCase()");
    expect(reviewSource).not.toContain("firedMember.publicName.toUpperCase()");
    expect(reviewSource).toContain('context.fillText("FIRED"');
    expect(reviewSource).toContain("firedMember.terminationReason");
    expect(reviewSource).toContain("firedPieceId,");
    expect(reviewSource).toContain("elapsedMs,");
    expect(reviewSource).toContain('aria-label="Exact challenge link"');
    expect(reviewSource).toContain("setManualUrl(challengeUrl)");
  });

  it("starts the challenge clock on first interaction and keeps onboarding available", () => {
    expect(playableSource).not.toContain("if (incomingChallenge) return;");
    expect(playableSource).not.toContain("Date.now()");
    expect(playableSource).toContain("const startedAt = window.performance.now();");
    expect(playableSource).toContain("startedAtRef.current = startedAt;");
    expect(playableSource).toContain("setRunStartedAt(startedAt);");
    expect(playableSource).toContain("ensureRunStarted(selectedPiece);");
    expect(playableSource).toContain("ensureRunStarted(pieceId);");
    expect(playableSource).toContain("firstPieceRef.current?.focus");
  });

  it("contains and animates the termination moment", () => {
    expect(gameCss).toMatch(/\.playable-termination\s*\{[^}]*overflow:\s*hidden;/s);
    expect(gameCss).toContain("@keyframes playable-fired-exit");
    expect(gameCss).toContain("@keyframes playable-termination-flash");
  });
});
