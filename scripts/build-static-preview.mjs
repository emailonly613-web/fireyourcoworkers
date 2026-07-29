import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const outputDir = resolve(repoRoot, "public-preview");
const webRoot = resolve(repoRoot, "apps/web");
const appOutput = resolve(webRoot, ".next/server/app");

function pngAsIco(png, width, height) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(width >= 256 ? 0 : width, 6);
  header.writeUInt8(height >= 256 ? 0 : height, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

if (dirname(outputDir) !== repoRoot || outputDir === repoRoot) {
  throw new Error(`Refusing to replace unsafe static output path: ${outputDir}`);
}

const productionOrigin = "https://fireyourcoworkers.com";
const publicOrigin =
  process.env.FYC_PUBLIC_ORIGIN ??
  process.env.FYC_PREVIEW_ORIGIN ??
  productionOrigin;
const indexHtml = (await readFile(resolve(appOutput, "index.html"), "utf8")).replaceAll(
  productionOrigin,
  publicOrigin,
);
const notFoundHtml = (
  await readFile(resolve(appOutput, "_not-found.html"), "utf8")
).replaceAll(productionOrigin, publicOrigin);
const manifest = await readFile(
  resolve(appOutput, "manifest.webmanifest.body"),
);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, "index.html"), indexHtml);
await writeFile(resolve(outputDir, "404.html"), notFoundHtml);
await writeFile(resolve(outputDir, "manifest.webmanifest"), manifest);
await cp(resolve(webRoot, ".next/static"), resolve(outputDir, "_next/static"), {
  recursive: true,
});
await cp(resolve(webRoot, "public"), outputDir, { recursive: true });
const faviconPng = await readFile(
  resolve(webRoot, "public/icons/app-icon-192.png"),
);
await writeFile(
  resolve(outputDir, "favicon.ico"),
  pngAsIco(faviconPng, 192, 192),
);

console.log(`Static public artifact assembled at ${outputDir} for ${publicOrigin}`);
