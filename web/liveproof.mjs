// Live-proof probe: loads the production URL in real Chrome and reports exactly what a
// visitor experiences. Screenshots whatever renders. Exit 0 only if the GAME is live.
//   node web/liveproof.mjs [url]
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(here, "proof");
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

const URLS = [process.argv[2] || "https://fireyourcoworkers.com",
              "http://fireyourcoworkers.com"];

const CHROME = [
  `${process.env["ProgramFiles"]}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
].find(p => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 860, deviceScaleFactor: 2 });

let live = false;
for (const url of URLS) {
  process.stdout.write(`\nVISITOR TEST: ${url}\n`);
  try {
    const res = await page.goto(url, { waitUntil: "load", timeout: 25000 });
    console.log(`  HTTP ${res.status()} ${res.statusText()} from ${res.url()}`);
    const title = await page.title();
    console.log(`  <title>: ${JSON.stringify(title)}`);
    const hasGame = await page.evaluate(() => !!(window.__FYC__ && window.__FYC__.debug)).catch(() => false);
    console.log(`  game seam present: ${hasGame}`);
    const shot = join(SHOTS, "live-" + url.replace(/[^a-z0-9]+/gi, "_") + ".png");
    await page.screenshot({ path: shot });
    console.log(`  screenshot: ${shot}`);
    if (res.ok() && hasGame) { live = true; break; }
  } catch (e) {
    console.log(`  RESULT: ${e.message.split("\n")[0]}`);
  }
}
await browser.close();
console.log(live
  ? "\nVERDICT: LIVE — the game is being served at the domain."
  : "\nVERDICT: NOT LIVE — no server is answering for this domain yet.");
process.exit(live ? 0 : 1);
