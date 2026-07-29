// Production snapshot at the two sizes the operator rendered: desktop + mobile.
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = [`${process.env["ProgramFiles"]}\\Google\\Chrome\\Application\\chrome.exe`].find(existsSync);
const URL = process.argv[2] || "https://fireyourcoworkers.com";

const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--mute-audio"] });
for (const [name, vp] of [
  ["desktop-1440x900", { width: 1440, height: 900, deviceScaleFactor: 1 }],
  ["mobile-390x844",   { width: 390,  height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
]) {
  const p = await b.newPage();
  await p.setViewport(vp);
  const res = await p.goto(URL, { waitUntil: "load", timeout: 45000 });
  await new Promise(r => setTimeout(r, 900));
  const shot = join(here, "proof", `prod-${name}.png`);
  await p.screenshot({ path: shot });
  console.log(`${name}: HTTP ${res.status()}  seam=${await p.evaluate(() => !!window.__FYC__).catch(()=>false)}  -> ${shot}`);
  await p.close();
}
await b.close();
