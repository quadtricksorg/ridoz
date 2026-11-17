// Real RIDOZ product photos → optimised, tightly-trimmed WebP cut-outs.
//
// Usage: node scratch/generate-product-images.mjs <dir-with-source-pngs>
// Every <name>.png in the folder becomes src/assets/products/<name>.webp
// (long edge 800px, stray specks removed, transparent background).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
const OUT = "src/assets/products";
const LONG_EDGE = 800;
fs.mkdirSync(OUT, { recursive: true });

/** Keep only the largest opaque blob (drops specks / halo islands), trim to the garment. */
async function cleanCutout(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const label = new Int32Array(W * H).fill(-1);
  const sizes = [];
  const stack = new Int32Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (label[s] !== -1 || data[s * 4 + 3] < 24) continue;
    const id = sizes.length;
    let n = 0, top = 0;
    stack[top++] = s;
    label[s] = id;
    while (top) {
      const p = stack[--top];
      n++;
      const x = p % W, y = (p / W) | 0;
      if (x > 0 && label[p - 1] === -1 && data[(p - 1) * 4 + 3] >= 24) { label[p - 1] = id; stack[top++] = p - 1; }
      if (x < W - 1 && label[p + 1] === -1 && data[(p + 1) * 4 + 3] >= 24) { label[p + 1] = id; stack[top++] = p + 1; }
      if (y > 0 && label[p - W] === -1 && data[(p - W) * 4 + 3] >= 24) { label[p - W] = id; stack[top++] = p - W; }
      if (y < H - 1 && label[p + W] === -1 && data[(p + W) * 4 + 3] >= 24) { label[p + W] = id; stack[top++] = p + W; }
    }
    sizes.push(n);
  }
  const keep = sizes.indexOf(Math.max(...sizes));
  // keep the garment plus its soft edge (partially transparent pixels adjacent to it)
  for (let p = 0; p < W * H; p++) {
    if (label[p] === keep) continue;
    const a = data[p * 4 + 3];
    if (a === 0) continue;
    const x = p % W;
    const near =
      (x > 0 && label[p - 1] === keep) || (x < W - 1 && label[p + 1] === keep) ||
      (p >= W && label[p - W] === keep) || (p + W < W * H && label[p + W] === keep);
    if (!near) data[p * 4 + 3] = 0;
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 0 }).png().toBuffer();
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png")).sort();
let total = 0;
for (const f of files) {
  const name = path.basename(f, ".png");
  const cut = await cleanCutout(path.join(SRC, f));
  const out = path.join(OUT, `${name}.webp`);
  const info = await sharp(cut)
    .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 90, effort: 6, smartSubsample: true })
    .toFile(out);
  total += info.size;
  console.log(`${name.padEnd(22)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
}
console.log(`total ${(total / 1024).toFixed(0)} KB for ${files.length} images`);
