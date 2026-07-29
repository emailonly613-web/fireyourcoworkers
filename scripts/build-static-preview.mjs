import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const outputDir = resolve(repoRoot, "public-preview");
const webRoot = resolve(repoRoot, "apps/web");
const appOutput = resolve(webRoot, ".next/server/app");

if (dirname(outputDir) !== repoRoot || outputDir === repoRoot) {
  throw new Error(`Refusing to replace unsafe static output path: ${outputDir}`);
}

const productionOrigin = "https://fireyourcoworkers.com";
const previewOrigin =
  process.env.FYC_PREVIEW_ORIGIN ??
  "https://fireyourcoworkers-codex-preview-hxnxm.ondigitalocean.app";
const indexHtml = (await readFile(resolve(appOutput, "index.html"), "utf8")).replaceAll(
  productionOrigin,
  previewOrigin,
);
const notFoundHtml = (
  await readFile(resolve(appOutput, "_not-found.html"), "utf8")
).replaceAll(productionOrigin, previewOrigin);
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

console.log(`Static preview assembled at ${outputDir}`);
