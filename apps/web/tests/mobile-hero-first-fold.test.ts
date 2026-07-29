import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = resolve(import.meta.dirname, "..");
const globalsCss = readFileSync(resolve(webRoot, "app/globals.css"), "utf8");

function mediaBlock(query: string): string {
  const start = globalsCss.indexOf(query);
  expect(start, `${query} must exist`).toBeGreaterThanOrEqual(0);
  const openingBrace = globalsCss.indexOf("{", start);
  let depth = 0;

  for (let index = openingBrace; index < globalsCss.length; index += 1) {
    if (globalsCss[index] === "{") depth += 1;
    if (globalsCss[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) return globalsCss.slice(openingBrace + 1, index);
  }

  throw new TypeError(`${query} must have a closing brace`);
}

describe("mobile hero first-fold contract", () => {
  it("does not force short mobile viewports into the former 700px hero", () => {
    expect(globalsCss).not.toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.living-hero\s*\{[^}]*min-height:\s*700px;/,
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.living-hero\s*\{[^}]*height:\s*100svh;[^}]*min-height:\s*100svh;/,
    );
  });

  it("defines an isolated compact-height layout for 320x568 and 343x615", () => {
    const compactRule = mediaBlock("@media (max-width: 430px) and (max-height: 680px)");

    expect(compactRule).toMatch(
      /\.living-hero\s*\{[^}]*height:\s*100svh;[^}]*min-height:\s*100svh;/,
    );
    expect(compactRule).toMatch(
      /\.hero-elevator\s*\{[^}]*bottom:\s*122px;[^}]*top:\s*106px;/,
    );
    expect(compactRule).toMatch(
      /\.hero-pitch\s*\{[^}]*bottom:\s*max\(8px,\s*env\(safe-area-inset-bottom\)\);/,
    );
    expect(compactRule).toMatch(
      /\.play-button\s*\{[^}]*font-size:\s*14px;[^}]*min-height:\s*44px;/,
    );
  });

  it("retains all three character placements in the compact tableau", () => {
    const compactRule = mediaBlock("@media (max-width: 430px) and (max-height: 680px)");

    expect(compactRule).toContain(".hero-piece--ceo");
    expect(compactRule).toContain(".hero-piece--intern");
    expect(compactRule).toContain(".hero-piece--printer");
  });
});
