// Headless rule check. Extracts the game's own script from index.html, stubs the DOM it
// touches at load time, then verifies content, shape maths, and — decisively — that every
// floor's embedded solution actually places every coworker legally.
// Run: node web/verify.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "index.html"), "utf8");

const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("FAIL: no <script> block found"); process.exit(1); }

// Minimal DOM stub — enough for the module-level load(0) call to complete.
const noop = () => {};
const mkEl = () => {
  const el = {
    style: new Proxy({}, { get: (t, k) => (k === "cssText" ? "" : t[k] ?? ""), set: (t, k, v) => (t[k] = v, true) }),
    classList: { add: noop, remove: noop, contains: () => false },
    children: [], parentNode: null,
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild(c) { return c; }, remove: noop,
    addEventListener: noop, removeEventListener: noop, setPointerCapture: noop,
    querySelector: () => mkEl(), querySelectorAll: () => [],
    closest: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 600, right: 400, bottom: 600 }),
    clientWidth: 360, clientHeight: 640,
    set innerHTML(v) { this.children = []; }, get innerHTML() { return ""; },
    set textContent(v) { this._t = v; }, get textContent() { return this._t ?? ""; },
    set onclick(v) {}, get onclick() { return null; },
    disabled: false,
  };
  return el;
};
const doc = { getElementById: () => mkEl(), createElement: mkEl, querySelector: () => mkEl(), addEventListener: noop, body: mkEl() };
globalThis.document = doc;
globalThis.window = { addEventListener: noop, removeEventListener: noop, AudioContext: undefined, localStorage: undefined };
globalThis.setTimeout = () => 0;
globalThis.clearTimeout = noop;

try { new Function("document", "window", m[1])(doc, globalThis.window); }
catch (e) { console.error("FAIL: game script threw on load:", e.stack || e.message); process.exit(1); }

const G = globalThis.window.__FYC__;
if (!G) { console.error("FAIL: game did not expose its rule functions"); process.exit(1); }

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${extra ? " -> " + extra : ""}`); }
};

console.log("\nFire Your Coworkers — content, rules, and solvability\n");

console.log("Content database");
ok("12 characters loaded", G.CHARACTERS.length === 12, `got ${G.CHARACTERS.length}`);
ok("no duplicate character ids", new Set(G.CHARACTERS.map(c => c.id)).size === G.CHARACTERS.length);
ok("every character has a positive base_score", G.CHARACTERS.every(c => typeof c.base_score === "number" && c.base_score > 0));
ok("every character has all 3 audio triggers",
  G.CHARACTERS.every(c => c.audio_triggers.on_grab && c.audio_triggers.on_success && c.audio_triggers.on_fail));
ok("every character has a kind and color",
  G.CHARACTERS.every(c => c.kind && /^#[0-9a-f]{6}$/i.test(c.color)));
ok("every shape is a non-empty normalized cell list", G.CHARACTERS.every(c => {
  const s = G.normalize(c.shape_matrix);
  return s.length > 0 && Math.min(...s.map(p => p[0])) === 0 && Math.min(...s.map(p => p[1])) === 0;
}));
{
  const keys = G.CHARACTERS.map(c => G.normalize(c.shape_matrix).map(p => p.join(",")).sort().join("|"));
  ok("shape variety: at least 9 distinct silhouettes", new Set(keys).size >= 9, `got ${new Set(keys).size}`);
}

console.log("\nRotation invariants (all 12 characters)");
let rotOK = true, normOK = true, countOK = true;
for (const c of G.CHARACTERS) {
  const base = G.normalize(c.shape_matrix);
  if (!G.sameShape(G.rotateN(base, 4), base)) rotOK = false;
  for (let r = 0; r < 4; r++) {
    const s = G.rotateN(base, r);
    if (s.length !== base.length) countOK = false;
    if (Math.min(...s.map(p => p[0])) !== 0 || Math.min(...s.map(p => p[1])) !== 0) normOK = false;
  }
}
ok("four turns returns every shape to start", rotOK);
ok("rotation preserves cell count for every shape", countOK);
ok("every rotation is normalized to (0,0)", normOK);

console.log("\nLevels");
ok("30 floors present", G.LEVELS.length === 30, `got ${G.LEVELS.length}`);
ok("every floor has a name", G.LEVELS.every(l => typeof l.name === "string" && l.name.length > 0));
ok("every floor references known characters", G.LEVELS.every(l => l.cast.every(id => !!G.byId(id))));
ok("no floor exceeds grid capacity",
  G.LEVELS.every(l => l.cast.reduce((n, id) => n + G.byId(id).shape_matrix.length, 0) <= l.w * l.h));
ok("floors 21-30 are premium, 1-20 are free",
  G.LEVELS.every((l, i) => !!l.premium === (i >= 20)));
ok("floor 1 pinned (3x4, intern+printer)", (() => {
  const l = G.LEVELS[0];
  return l.w === 3 && l.h === 4 && l.cast.join() === "sleeping_intern,broken_printer";
})());
ok("floor 4 pinned (3x4, 92% dead-end anchor)", (() => {
  const l = G.LEVELS[3];
  return l.w === 3 && l.h === 4 && l.cast.join() === "sleeping_intern,broken_printer,micromanager_boss";
})());
ok("difficulty rises: floor 30 denser than floor 1", (() => {
  const d = l => l.cast.reduce((n, id) => n + G.byId(id).shape_matrix.length, 0) / (l.w * l.h);
  return d(G.LEVELS[29]) > d(G.LEVELS[0]);
})());

console.log("\nSolvability — every floor's embedded solution must place every coworker legally");
let allSolve = true;
for (let i = 0; i < G.LEVELS.length; i++) {
  const lv = G.LEVELS[i];
  if (!Array.isArray(lv.solution) || lv.solution.length !== lv.cast.length) { allSolve = false; ok(`floor ${i + 1}: solution present`, false); continue; }
  const grid = Array.from({ length: lv.h }, () => Array(lv.w).fill(false));
  let good = true;
  for (let k = 0; k < lv.cast.length && good; k++) {
    const { r, x, y } = lv.solution[k];
    for (const [cx, cy] of G.rotateN(G.byId(lv.cast[k]).shape_matrix, r)) {
      const gx = x + cx, gy = y + cy;
      if (gx < 0 || gy < 0 || gx >= lv.w || gy >= lv.h || grid[gy][gx]) { good = false; break; }
      grid[gy][gx] = true;
    }
  }
  if (!good) { allSolve = false; ok(`floor ${i + 1} ("${lv.name}"): solution valid`, false); }
}
ok("all 30 embedded solutions place every piece in bounds with no overlap", allSolve);

console.log("\nEconomy");
const src = m[1];
ok("coins are earned on floor completion", /wallet\.coins\s*\+=\s*payout/.test(src));
ok("premium floors gate through the shop, not a dead end", /premium\s*&&\s*!owns\("exec"\)/.test(src));
ok("wallet persists", /fyc_wallet/.test(src));
ok("skins repaint every piece when equipped", /repaintAll/.test(src));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
