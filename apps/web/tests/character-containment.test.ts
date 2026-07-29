import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = resolve(import.meta.dirname, "..");
const gameCss = readFileSync(resolve(webRoot, "app/game.css"), "utf8");
const siteCss = readFileSync(resolve(webRoot, "app/site-sections.css"), "utf8");
const playable = readFileSync(resolve(webRoot, "components/game/PlayableElevator.tsx"), "utf8");

describe("character artwork containment contract", () => {
  it("clips placed artwork independently from reactions and records rotation", () => {
    expect(playable).toContain('data-rotation={placement.rotation}');
    expect(playable).toContain('className="playable-piece__art-clip"');
    expect(gameCss).toMatch(/\.playable-piece__art-clip\s*\{[^}]*overflow:\s*hidden;/s);
  });

  it("defines an exact occupied-cell clip for every CEO-slot rotation", () => {
    for (const rotation of [0, 90, 180, 270]) {
      expect(gameCss).toContain(
        `.playable-piece--micro-managing-ceo[data-rotation="${rotation}"] .playable-piece__art-clip`,
      );
    }
  });

  it("limits CEO-slot pointer input to the occupied T cells", () => {
    expect(gameCss).toMatch(
      /\.playable-piece--micro-managing-ceo:not\(:disabled\)\s*\{[^}]*pointer-events:\s*none;/s,
    );
    expect(gameCss).toMatch(
      /\.playable-piece--micro-managing-ceo:not\(:disabled\) \.playable-piece__art-clip\s*\{[^}]*pointer-events:\s*auto;/s,
    );
  });

  it("contains artwork in every other boxed presentation", () => {
    expect(gameCss).toMatch(/\.playable-tray-piece__art\s*\{[^}]*overflow:\s*hidden;/s);
    expect(gameCss).toMatch(/\.playable-complete__cast svg\s*\{[^}]*overflow:\s*hidden;/s);
    expect(siteCss).toMatch(/\.site-character-roster__art\s*\{[^}]*overflow:\s*hidden;/s);
  });
});
