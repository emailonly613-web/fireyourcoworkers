import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = resolve(import.meta.dirname, "..");
const playableSource = readFileSync(
  resolve(webRoot, "components/game/PlayableElevator.tsx"),
  "utf8",
);
const pieceShapeSource = readFileSync(
  resolve(webRoot, "components/game/PieceShape.tsx"),
  "utf8",
);
const tutorialSource = readFileSync(
  resolve(webRoot, "components/game/GameTutorial.tsx"),
  "utf8",
);
const doorPressureSource = readFileSync(
  resolve(webRoot, "game/door-pressure.ts"),
  "utf8",
);
const gameCss = readFileSync(resolve(webRoot, "app/game.css"), "utf8");

function sourceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("living puzzle UX contract", () => {
  it("starts with no silent preselection and makes shape choice the first action", () => {
    expect(playableSource).toContain(
      "const [selectedPiece, setSelectedPiece] = useState<PieceId | null>(null);",
    );
    expect(playableSource).toContain("const recommended = !selectedPiece && index === 0;");
    expect(playableSource).toContain('recommended ? "1 · TAP THIS SHAPE"');
    expect(playableSource).toContain("disabled={blocked || inputLocked || !selectedPiece}");
    expect(playableSource).toContain("disabled={inputLocked || !selectedPiece}");
  });

  it("shows exact occupied-cell footprints wherever the player chooses or holds a piece", () => {
    expect(pieceShapeSource).toContain(
      "getRotatedCells(getPieceDefinition(pieceId), normalizedRotation)",
    );
    expect(pieceShapeSource).toContain('className="piece-shape__cell"');
    expect(pieceShapeSource).toContain("gridColumnStart: x + 1");
    expect(pieceShapeSource).toContain("gridRowStart: y + 1");

    expect(playableSource).toContain('className="playable-tray-piece__shape"');
    expect(playableSource).toContain('className="playable-selection-status__shape"');
    expect(playableSource).toContain('className="playable-empty-guide__shape"');
    expect(pieceShapeSource).toContain("var(--shape-cell, 8px)");
    expect(gameCss).toMatch(/\.piece-shape__cell\s*\{[^}]*aspect-ratio:\s*1;[^}]*height:\s*var\(--shape-cell\);[^}]*width:\s*var\(--shape-cell\);/s);
    expect(gameCss).toMatch(/\.playable-tray-piece__shape\s*\{[^}]*--shape-cell:\s*8px;/s);
  });

  it("previews the real character and footprint before committing a placement", () => {
    const previewSource = sourceBetween(
      playableSource,
      "function PreviewPiece(",
      "export function PlayableElevator()",
    );

    expect(previewSource).toContain("<PieceCellMask placement={placement} />");
    expect(previewSource).toContain("<PieceArt pieceId={preview.pieceId} shiftId={shiftId} />");
    expect(previewSource).toContain('violationReason === "collision"');
    expect(previewSource).toContain('"PERSONAL SPACE DENIED"');
    expect(playableSource).toContain("onPointerEnter={() => inspectCell(cell)}");
    expect(playableSource).toContain("onFocus={() => inspectCell(cell)}");
    expect(gameCss).toMatch(/\.playable-preview__art-clip\s*\{[^}]*opacity:\s*0\.98;[^}]*overflow:\s*hidden;/s);
  });

  it("states the actual fire-one win and HR-fires-you loss proposition", () => {
    expect(playableSource).toContain("Pack two coworkers and one hazard. Fire one coworker. Keep your job.");
    expect(playableSource).toContain("PACK 2 PEOPLE + 1 HAZARD");
    expect(playableSource).toContain("FIRE 1 PERSON");
    expect(playableSource).toContain("HR 100% → YOU&apos;RE FIRED");
    expect(playableSource).toContain('id="lawsuit-title">YOU&apos;RE FIRED.');
    expect(tutorialSource).toContain("Pack two coworkers and one workplace hazard.");
    expect(tutorialSource).toContain("If HR reaches 100%, HR fires you.");
    expect(tutorialSource).toContain("Fire a coworker—or get fired");
  });

  it("exposes one honest hint control and applies one fixed five-second penalty", () => {
    expect(playableSource).toContain('data-testid="hint-control"');
    expect(playableSource).toContain("disabled={inputLocked || hintUsed}");
    expect(playableSource).toContain('hintUsed ? "HR USED" : "ASK HR"');
    expect(playableSource).toContain('hintUsed ? "+5.0s filed" : "Hint · +5.0s"');
    expect(playableSource).toContain("applyHintTimePenalty(rawElapsedMs, hintUsedRef.current)");
    expect(doorPressureSource).toContain("export const HINT_TIME_PENALTY_MS = 5_000;");
    expect(doorPressureSource).toContain("hintUsed ? HINT_TIME_PENALTY_MS : 0");
    expect(gameCss).toMatch(/\.playable-controls \.playable-controls__hint\s*\{[^}]*background:/s);
  });

  it("keeps the living doors cosmetic and unable to block puzzle input", () => {
    expect(playableSource).toContain(
      "const inputLocked = solved || hr.lawsuit || placementPending;",
    );
    expect(playableSource).toContain('className={`playable-live-doors playable-live-doors--${doorPressure.phase}');
    expect(doorPressureSource).toContain("export const MAX_IN_PLAY_DOOR_CLOSURE = 0.2;");
    expect(doorPressureSource).toContain("readonly blocksInput: false;");
    expect(doorPressureSource).toContain("readonly failed: false;");
    expect(gameCss).toMatch(/\.playable-live-doors\s*\{[^}]*pointer-events:\s*none;/s);
  });

  it("gives invalid placements a visible recoil and an authored character reaction", () => {
    const previewSource = sourceBetween(
      playableSource,
      "function PreviewPiece(",
      "export function PlayableElevator()",
    );

    expect(playableSource).toContain("setRejectedPreview(candidate);");
    expect(playableSource).toContain('line: reactionFor(member, "failure"');
    expect(previewSource).toContain("reaction?.pieceId === preview.pieceId");
    expect(previewSource).toContain("playable-piece__reaction--${reaction.tone}");
    expect(gameCss).toMatch(/\.playable-preview--invalid \.playable-piece__art-wrap\s*\{[^}]*animation:\s*playable-preview-art-recoil/s);
    expect(gameCss).toContain("@keyframes playable-preview-art-recoil");
    expect(gameCss).toMatch(/\.playable-preview \.playable-piece__reaction\s*\{[^}]*position:\s*absolute;/s);
  });
});
