// Run with: node download-assets.js
// Requires Node 18+ (built-in fetch). Pulls every asset in
// eye-illustration-manifest.json into ./assets/eyes/<step>/<layer>.svg
//
// Run this soon — Figma's asset URLs expire ~7 days after they were
// generated (2026-08-05).

import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const slugify = (s) =>
  s.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const manifest = JSON.parse(
    await readFile(new URL("./eye-illustration-manifest.json", import.meta.url))
  );

  for (const [stepName, layers] of Object.entries(manifest.steps)) {
    const dir = path.join("assets", "eyes", stepName);
    await mkdir(dir, { recursive: true });

    for (const [layerName, url] of Object.entries(layers)) {
      if (layerName.startsWith("_")) continue; // skip _note fields
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed ${stepName}/${layerName}: ${res.status}`);
        continue;
      }
      const svg = await res.text();
      const filename = `${slugify(layerName)}.svg`;
      await writeFile(path.join(dir, filename), svg);
      console.log(`Saved ${stepName}/${filename}`);
    }
  }
  console.log("Done.");
}

main().catch(console.error);
