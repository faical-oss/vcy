// One-time, dev-only: downloads RANDOM placeholder photos for the 20 activity tiles of the preferences wizard, converts them to WebP
// (about 120 KB at most) and saves them in public/images/activities/. The option id is the seed, so each image is stable.
// They do not match the labels: layout testing only (see docs/activity-photo-credits.md). Nothing is loaded from picsum.photos at runtime.
// Run: node scripts/fetch-placeholder-activity-photos.mjs   (needs `sharp`, which Next.js installs)
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const LABELS = [
  "Bike", "Detox", "Dive", "Get fit", "Golf", "Get healthy", "Hike", "Meditate", "Ski", "Be enlightened",
  "Lose weight", "Practice yoga", "Get pampered", "Run", "Have an adventure", "Heal", "Work and play", "Camp", "Surf", "Raft",
];
const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const MAX_BYTES = 120 * 1024;
const outDir = path.join(process.cwd(), "public", "images", "activities");
await mkdir(outDir, { recursive: true });

for (const label of LABELS) {
  const id = slug(label);
  const response = await fetch(`https://picsum.photos/seed/${id}/800/500`, { redirect: "follow" });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  let quality = 80;
  let output = await sharp(source).resize(800, 500, { fit: "cover" }).webp({ quality }).toBuffer();
  while (output.length > MAX_BYTES && quality > 30) {
    quality -= 10;
    output = await sharp(source).resize(800, 500, { fit: "cover" }).webp({ quality }).toBuffer();
  }
  await writeFile(path.join(outDir, `${id}.webp`), output);
  console.log(`${id}.webp  ${(output.length / 1024).toFixed(1)} KB (quality ${quality})`);
}
