import { describe, expect, it } from "vitest";
import {
  HERO_CHARACTERS,
  HERO_SENTENCE,
  HERO_STEPS,
  PUBLIC_BRAND,
} from "../components/hero-content";

const prohibitedPublicMarks = ["corporate " + "tetris", "tetri" + "mino"];

describe("living hero content contract", () => {
  it("uses the approved public brand", () => {
    expect(PUBLIC_BRAND).toBe("Fire Your Coworkers");
  });

  it("contains all three required living characters", () => {
    expect(HERO_CHARACTERS.map((character) => character.name)).toEqual([
      "Sleeping Intern",
      "Micro-Managing CEO",
      "Broken Copy Machine",
    ]);
  });

  it("keeps pre-interaction copy to one sentence", () => {
    expect(HERO_SENTENCE.match(/[.!?](?:\s|$)/g)).toHaveLength(1);
  });

  it("contains the approved three-beat visual story", () => {
    expect(HERO_STEPS).toEqual(["DRAG & FIT", "HR OBJECTS", "SHARE THE CHAOS"]);
  });

  it("does not expose prohibited historical naming", () => {
    const publicCopy = JSON.stringify({ PUBLIC_BRAND, HERO_SENTENCE, HERO_CHARACTERS, HERO_STEPS }).toLowerCase();
    for (const mark of prohibitedPublicMarks) expect(publicCopy).not.toContain(mark);
  });
});
