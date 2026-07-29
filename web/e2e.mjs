// End-to-end + stress harness. Drives the real game in a real Chrome through real
// pointer events — no internal shortcuts, no mocked input.
//
//   node web/e2e.mjs            headless, representative floor sample
//   node web/e2e.mjs --all      play every one of the 30 floors (slow)
//   node web/e2e.mjs --headed   watch it play
import puppeteer from "puppeteer-core";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// Point FYC_URL at production to run this whole harness against the live site.
const GAME = process.env.FYC_URL || pathToFileURL(join(here, "index.html")).href;
const SHOTS = join(here, "proof");
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

const CHROME = [
  `${process.env["ProgramFiles"]}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["LOCALAPPDATA"]}\\Google\\Chrome\\Application\\chrome.exe`,
].find(p => existsSync(p));
if (!CHROME) { console.error("FAIL: no chrome.exe found"); process.exit(1); }

const HEADED = process.argv.includes("--headed");
const PLAY_ALL = process.argv.includes("--all");

let pass = 0, fail = 0;
const failures = [];
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push(name + (extra ? ` -> ${extra}` : "")); console.log(`  FAIL  ${name}${extra ? " -> " + extra : ""}`); }
};

/* ---- shape maths, mirrors the game ---- */
const norm = c => { let mx = Infinity, my = Infinity; for (const p of c) { if (p[0] < mx) mx = p[0]; if (p[1] < my) my = p[1]; } return c.map(p => [p[0] - mx, p[1] - my]); };
const rotCW = c => norm(c.map(([x, y]) => [y, -x]));
const rotN = (c, n) => { let s = norm(c); for (let i = 0; i < ((n % 4) + 4) % 4; i++) s = rotCW(s); return s; };
const ext = c => { let w = 0, h = 0; for (const [x, y] of c) { if (x + 1 > w) w = x + 1; if (y + 1 > h) h = y + 1; } return [w, h]; };
const skey = s => s.map(p => p.join(",")).sort().join("|");

/* ---- browser driving ---- */
const D = page => page.evaluate(() => window.__FYC__.debug());

async function tapAt(page, x, y) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 40));
}

/** Taps a cell the piece actually fills — a T or Z has empty corners in its box. */
async function tapPieceCell(page, p) {
  const [, h] = ext(p.shape), [sx, sy] = p.shape[0];
  await tapAt(page,
    p.rect.left + (sx + 0.5) * p.unit,
    p.rect.top + (h - 1 - sy + 0.5) * p.unit);
}

/**
 * The solution stores the rotation the SOLVER applied to the base shape. The game's
 * tap-rotate also rotates the base shape, so tapping until p.rot === r reproduces the
 * exact same cell set.
 */
async function rotateTo(page, uid, targetRot) {
  const want = ((targetRot % 4) + 4) % 4;
  for (let i = 0; i < 6; i++) {
    const st = await D(page);
    const p = st.pieces.find(q => q.uid === uid);
    if (!p || p.rot === want) return;
    await tapPieceCell(page, p);
  }
}

/** Drags a piece so its cell `shape[0]` lands on grid cell (ax+sx, ay+sy). */
async function dragPiece(page, uid, ax, ay) {
  const st = await D(page);
  const p = st.pieces.find(q => q.uid === uid);
  if (!p) throw new Error(`piece ${uid} not found`);
  const [, h] = ext(p.shape);
  const [sx, sy] = p.shape[0];

  const downX = p.rect.left + (sx + 0.5) * p.unit;
  const downY = p.rect.top + (h - 1 - sy) * p.unit + p.unit * 0.5;
  const upX = st.shaft.left + (ax + sx + 0.5) * st.cellPx;
  const upY = st.shaft.top + (st.dims.h - 1 - (ay + sy) + 0.5) * st.cellPx;

  await page.mouse.move(downX, downY);
  await page.mouse.down();
  await page.mouse.move(downX + 14, downY + 14);          // exceed the 7px drag threshold
  await page.mouse.move((downX + upX) / 2, (downY + upY) / 2);
  await page.mouse.move(upX, upY);
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 70));
}

async function resetPointer(page) {
  try { await page.mouse.up(); } catch {}
  await page.mouse.move(5, 5);
  await new Promise(r => setTimeout(r, 40));
}

/** The invariant that matters: cosmetics and abuse must never corrupt occupancy. */
function gridIntact(st) {
  const owned = new Map();
  for (let y = 0; y < st.grid.length; y++)
    for (let x = 0; x < st.grid[y].length; x++) {
      const v = st.grid[y][x];
      if (v === null) continue;
      if (!owned.has(v)) owned.set(v, []);
      owned.get(v).push([x, y]);
    }
  for (const [uid, cells] of owned) {
    const p = st.pieces.find(q => q.uid === uid);
    if (!p) return `grid cells owned by unknown piece ${uid}`;
    if (!p.placed) return `piece ${uid} holds cells but is not placed`;
    if (cells.length !== p.shape.length) return `piece ${uid} holds ${cells.length} cells, shape has ${p.shape.length}`;
    const want = new Set(p.shape.map(([x, y]) => `${p.anchor[0] + x},${p.anchor[1] + y}`));
    for (const [x, y] of cells) if (!want.has(`${x},${y}`)) return `piece ${uid} occupies stray cell ${x},${y}`;
  }
  for (const p of st.pieces) {
    if (p.placed && !owned.has(p.uid)) return `piece ${p.uid} marked placed but owns no cells`;
    if (!p.placed && owned.has(p.uid)) return `unplaced piece ${p.uid} still owns cells`;
  }
  return null;
}

/* ---- run ---- */
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: !HEADED,
  args: ["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 860, deviceScaleFactor: 2 });

const pageErrors = [], consoleErrors = [];
page.on("pageerror", e => pageErrors.push(e.message));
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });

await page.goto(GAME, { waitUntil: "load", timeout: 60000 });
await page.waitForFunction(() => window.__FYC__ && window.__FYC__.debug, { timeout: 60000 })
  .catch(async e => {
    console.error(`FATAL: game seam never appeared at ${page.url()} — title=${JSON.stringify(await page.title())}`);
    throw e;
  });

console.log(`\nFire Your Coworkers — end-to-end in real Chrome\nTarget: ${GAME}\n`);
console.log("Boot");
const boot = await D(page);
ok("game boots and exposes state", !!boot && boot.dims.w > 0);
ok("no uncaught exceptions on load", pageErrors.length === 0, pageErrors[0]);
ok("floor 1 starts with an empty grid", boot.grid.flat().every(v => v === null));
ok("all pieces start in the tray", boot.pieces.every(p => !p.placed));
ok("wallet starts empty on a fresh profile", boot.wallet.coins === 0 && boot.wallet.skin === "classic");

const LEVELS = await page.evaluate(() => window.__FYC__.LEVELS);
ok("30 floors shipped", LEVELS.length === 30, String(LEVELS.length));
ok("every floor carries an embedded solution", LEVELS.every(l => Array.isArray(l.solution) && l.solution.length === l.cast.length));

/* ---- Play floors to completion using each floor's embedded, pre-validated solution ---- */
const SAMPLE = PLAY_ALL ? [...LEVELS.keys()] : [0, 1, 3, 14, 29];
for (const i of SAMPLE) {
  const lv = LEVELS[i];
  console.log(`\nFloor ${i + 1} "${lv.name}" (${lv.w}x${lv.h}, ${lv.cast.length} coworkers${lv.premium ? ", premium" : ""})`);
  await resetPointer(page);
  await page.evaluate(n => window.__FYC__.goto(n), i);
  await new Promise(r => setTimeout(r, 300));

  await page.screenshot({ path: join(SHOTS, `floor${i + 1}-start.png`) });

  let placedAll = true;
  for (let k = 0; k < lv.cast.length; k++) {
    const uid = k + 1, { r, x, y } = lv.solution[k];
    await rotateTo(page, uid, r);
    const afterRot = (await D(page)).pieces.find(p => p.uid === uid);
    if (!afterRot || afterRot.rot !== ((r % 4) + 4) % 4) {
      placedAll = false;
      ok(`floor ${i + 1}: piece ${uid} reached rotation ${r}`, false, `rot=${afterRot && afterRot.rot}`);
      break;
    }
    await dragPiece(page, uid, x, y);
    const st = await D(page);
    const p = st.pieces.find(q => q.uid === uid);
    if (!p.placed || p.anchor[0] !== x || p.anchor[1] !== y) {
      placedAll = false;
      ok(`floor ${i + 1}: piece ${uid} (${p.id}) landed at ${x},${y}`, false,
        `placed=${p.placed} anchor=${JSON.stringify(p.anchor)}`);
      break;
    }
    const bad = gridIntact(st);
    if (bad) { placedAll = false; ok(`floor ${i + 1}: grid intact after piece ${uid}`, false, bad); break; }
  }
  ok(`floor ${i + 1}: every coworker placed by real drag`, placedAll);

  await new Promise(r => setTimeout(r, 1400));   // doors close, then the overlay
  const done = await D(page);
  ok(`floor ${i + 1}: win screen shown`, done.over && /fits/i.test(done.overTitle), done.overTitle);
  ok(`floor ${i + 1}: score accumulated`, done.score > 0, String(done.score));
  ok(`floor ${i + 1}: coins paid out`, done.wallet.coins > 0, String(done.wallet.coins));
  ok(`floor ${i + 1}: grid consistent at win`, gridIntact(done) === null, gridIntact(done));
  await page.screenshot({ path: join(SHOTS, `floor${i + 1}-win.png`) });
}

/* ---- Rules under abuse ---- */
console.log("\nRule enforcement");
await resetPointer(page);
await page.evaluate(() => window.__FYC__.goto(0));
await new Promise(r => setTimeout(r, 300));

await dragPiece(page, 1, 0, 0);
let st = await D(page);
ok("a valid drop is accepted", st.pieces[0].placed);

await dragPiece(page, 2, 0, 0);
st = await D(page);
ok("overlapping drop is rejected", !st.pieces[1].placed);
ok("rejected drop leaves the first piece untouched", st.pieces[0].placed && gridIntact(st) === null);

{
  const s = await D(page);
  const p = s.pieces.find(q => q.uid === 2);
  await page.mouse.move(p.rect.left + 8, p.rect.top + 8);
  await page.mouse.down();
  await page.mouse.move(10, 850);
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 70));
}
st = await D(page);
ok("out-of-bounds drop is rejected", !st.pieces[1].placed);
ok("grid intact after out-of-bounds drop", gridIntact(st) === null, gridIntact(st));

const before = await D(page);
await page.click("#btnUndo");
await new Promise(r => setTimeout(r, 90));
st = await D(page);
ok("undo unplaces the last piece", !st.pieces[0].placed);
ok("undo frees its cells", st.grid.flat().every(v => v === null));
ok("undo reduces the score", st.score < before.score || before.score === 0);
ok("undo button disables when history is empty", await page.$eval("#btnUndo", b => b.disabled));

/* ---- Economy ---- */
console.log("\nEconomy");
await page.click("#btnShop");
await new Promise(r => setTimeout(r, 120));
st = await D(page);
ok("shop opens", st.shopOpen);
{
  // A purchase button must be enabled if-and-only-if the wallet can afford it.
  const coins = (await D(page)).wallet.coins;
  const wrong = await page.$$eval("#shopItems .shopBtn", (btns, c) =>
    btns.filter(b => {
      const m = b.textContent.match(/^(\d+)\s*🪙$/);
      if (!m) return false;                       // owned/equip buttons — not purchases
      return (+m[1] <= c) === b.disabled;         // affordable⇔enabled must hold
    }).length, coins);
  ok(`purchase buttons match affordability (wallet=${coins})`, wrong === 0, `${wrong} mismatched`);
}
{
  // Input must be refused while the shop is open.
  const p = (await D(page)).pieces.find(q => !q.placed);
  await page.mouse.move(p.rect.left + p.rect.width / 2, p.rect.top + p.rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(200, 300);
  await page.mouse.up();
  const after = await D(page);
  ok("dragging is refused while the shop is open", after.pieces.every(q => !q.placed));
}
await page.click("#shopClose");
await new Promise(r => setTimeout(r, 100));
st = await D(page);
ok("shop closes", !st.shopOpen);
ok("input works again after closing the shop", await (async () => {
  await dragPiece(page, 1, 0, 0);
  return (await D(page)).pieces[0].placed;
})());
ok("premium floors exist and are gated data-side", LEVELS.filter(l => l.premium).length === 10);

/* ---- Stress ---- */
console.log("\nStress");
await resetPointer(page);
await page.evaluate(() => window.__FYC__.goto(2));
await new Promise(r => setTimeout(r, 300));

for (let i = 0; i < 40; i++) {
  const s = await D(page);
  const p = s.pieces.find(q => !q.placed);
  if (!p) break;
  await tapPieceCell(page, p);
}
st = await D(page);
ok("40 rapid rotations: no exception", pageErrors.length === 0, pageErrors[0]);
ok("40 rapid rotations: rotation stays in 0..3", st.pieces.every(p => p.rot >= 0 && p.rot < 4));
ok("40 rapid rotations: grid intact", gridIntact(st) === null, gridIntact(st));

for (let i = 0; i < 15; i++) await page.click("#btnUndo").catch(() => {});
st = await D(page);
ok("undo spam past empty history: no exception", pageErrors.length === 0, pageErrors[0]);
ok("undo spam: grid intact", gridIntact(st) === null, gridIntact(st));

let fuzzBad = null;
const rnd = (a, b) => a + Math.random() * (b - a);
for (let i = 0; i < 150; i++) {
  const s = await D(page);
  if (s.over || s.shopOpen) { await page.evaluate(() => window.__FYC__.goto(2)); await new Promise(r => setTimeout(r, 150)); continue; }
  const p = s.pieces[Math.floor(Math.random() * s.pieces.length)];
  await page.mouse.move(p.rect.left + p.rect.width / 2, p.rect.top + p.rect.height / 2);
  await page.mouse.down();
  if (Math.random() < 0.8) {
    await page.mouse.move(rnd(0, 430), rnd(0, 860));
    await page.mouse.move(rnd(0, 430), rnd(0, 860));
  }
  await page.mouse.up();
  const chk = gridIntact(await D(page));
  if (chk) { fuzzBad = `iteration ${i}: ${chk}`; break; }
}
ok("150 random drag/drop/tap events: grid never corrupts", fuzzBad === null, fuzzBad);
ok("fuzz: no uncaught exceptions", pageErrors.length === 0, pageErrors[0]);

await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 250));
st = await D(page);
ok("resize to 360x740: grid intact", gridIntact(st) === null, gridIntact(st));
await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2 });
await new Promise(r => setTimeout(r, 250));
st = await D(page);
ok("resize to tablet: grid intact", gridIntact(st) === null, gridIntact(st));
ok("resize: no uncaught exceptions", pageErrors.length === 0, pageErrors[0]);
await page.setViewport({ width: 430, height: 860, deviceScaleFactor: 2 });

await resetPointer(page);
await page.evaluate(() => window.__FYC__.goto(0));
await new Promise(r => setTimeout(r, 450));
await dragPiece(page, 1, 0, 0);
st = await D(page);
ok("restart precondition: a piece is on the board", st.pieces.some(p => p.placed) && st.score > 0);
await page.click("#btnReset");
await new Promise(r => setTimeout(r, 200));
st = await D(page);
ok("restart clears the grid", st.grid.flat().every(v => v === null));
ok("restart returns every piece to the tray", st.pieces.every(p => !p.placed));
ok("restart zeroes the score", st.score === 0, String(st.score));

/* ---- Lose condition (floor 4 is pinned as the dead-end anchor) ---- */
console.log("\nLose condition");
await resetPointer(page);
await page.evaluate(() => window.__FYC__.goto(3));
await new Promise(r => setTimeout(r, 300));
await rotateTo(page, 1, 0);
await dragPiece(page, 1, 1, 1);   // intern upright mid-column strands the other two
st = await D(page);
if (st.pieces[0].placed) {
  await new Promise(r => setTimeout(r, 600));
  st = await D(page);
  ok("a dead-end arrangement ends the floor", st.over && /failed/i.test(st.overTitle), st.overTitle);
  await page.screenshot({ path: join(SHOTS, "lose-deadend.png") });
} else {
  ok("dead-end setup placed the intern", false, "intern did not place");
}

/* ---- Viral surface: deep links, share button, HR rating ---- */
console.log("\nViral surface");
await page.goto(GAME + (GAME.includes("?") ? "&" : "?") + "floor=15", { waitUntil: "load" });
await page.waitForFunction(() => window.__FYC__ && window.__FYC__.debug);
st = await D(page);
ok("deep link ?floor=15 lands on floor 15", st.level === 14, `level=${st.level + 1}`);

await page.goto(GAME + (GAME.includes("?") ? "&" : "?") + "floor=25", { waitUntil: "load" });
await page.waitForFunction(() => window.__FYC__ && window.__FYC__.debug);
st = await D(page);
ok("deep link to a locked premium floor opens the store instead",
  st.level === 0 && st.shopOpen, `level=${st.level + 1} shop=${st.shopOpen}`);
await page.click("#shopClose");

// Win a floor and confirm the share button + HR rating are on the win screen.
await page.goto(GAME, { waitUntil: "load" });
await page.waitForFunction(() => window.__FYC__ && window.__FYC__.debug);
await new Promise(r => setTimeout(r, 500));   // let the tray pop-in animation finish
await resetPointer(page);
{
  const lv = LEVELS[0];
  for (let k = 0; k < lv.cast.length; k++) {
    const { r, x, y } = lv.solution[k];
    await rotateTo(page, k + 1, r);
    await dragPiece(page, k + 1, x, y);
    const pp = (await D(page)).pieces.find(q => q.uid === k + 1);
    ok(`share-run: piece ${k + 1} placed`, pp.placed, JSON.stringify(pp.anchor));
  }
  await new Promise(r => setTimeout(r, 1400));
  const win = await D(page);
  ok("win overlay is up for the share checks", win.over, win.overTitle);
  const rating = await page.$eval("#ovRating", el => el.textContent);
  ok("HR Compliance rating shown on win", /HR Compliance/.test(rating), rating);
  const shareVisible = await page.$eval("#ovShare", el => el.offsetParent !== null);
  ok("Challenge-a-coworker share button shown on win", shareVisible);
  await page.screenshot({ path: join(SHOTS, "win-share-rating.png") });
}

/* ---- Mobile touch emulation ---- */
console.log("\nMobile (touch emulation, iPhone-class viewport)");
const touch = await browser.newPage();
await touch.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await touch.goto(GAME, { waitUntil: "load" });
await touch.waitForFunction(() => window.__FYC__ && window.__FYC__.debug);
const tErr = [];
touch.on("pageerror", e => tErr.push(e.message));
const ts = await touch.evaluate(() => window.__FYC__.debug());
ok("mobile viewport boots", !!ts && ts.dims.w > 0);
ok("shaft fits inside a 390x844 screen", ts.shaft.width <= 390 && ts.shaft.height <= 844,
  `${Math.round(ts.shaft.width)}x${Math.round(ts.shaft.height)}`);
{
  const p = ts.pieces[0];
  await touch.touchscreen.tap(p.rect.left + p.rect.width / 2, p.rect.top + p.rect.height / 2);
  await new Promise(r => setTimeout(r, 150));
  const after = await touch.evaluate(() => window.__FYC__.debug());
  ok("touch tap rotates a piece", after.pieces[0].rot !== p.rot, `${p.rot} -> ${after.pieces[0].rot}`);
}
ok("mobile: no uncaught exceptions", tErr.length === 0, tErr[0]);
await touch.screenshot({ path: join(SHOTS, "mobile-390x844.png") });
await touch.close();

/* ---- Wrap ---- */
ok("no console errors across the whole run", consoleErrors.length === 0, consoleErrors[0]);
await browser.close();

console.log(`\nScreenshots: ${SHOTS}`);
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log("\nFailures:"); failures.forEach(f => console.log("  - " + f)); }
process.exit(fail ? 1 : 0);
