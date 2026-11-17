// Builds the 3-piece box panty assets from the supplied product PNGs.
//   • panty-<name>.webp         full garment (shown when lifted out of the box)
//   • panty-<name>-folded.webp  neatly folded piece (shown resting in the box window)
//
// Usage: node scratch/generate-trio-panties.mjs <dir-with-sources>
// Sources expected in <dir>: rose-clay.png, rani-pink.png, midnight-navy.png,
//                            orchid-mauve.png, cherry-red.png, deep-teal.png
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
const OUT = "src/assets/showcase/trio";
const NAMES = ["rose-clay", "rani-pink", "midnight-navy", "orchid-mauve", "cherry-red", "deep-teal"];

const FULL = { w: 760, h: 560 }; // shared canvas so every panty lifts to the same size
const FOLD = { w: 480, h: 240 };

/** Keep only the largest opaque blob (drops stray specks / fringe), return RGBA raw. */
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
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && label[q] === -1 && data[q * 4 + 3] >= 24) {
          label[q] = id;
          stack[top++] = q;
        }
      }
    }
    sizes.push(n);
  }
  const keep = sizes.indexOf(Math.max(...sizes));
  for (let p = 0; p < W * H; p++) if (label[p] !== keep) data[p * 4 + 3] = 0;
  return sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();
}

/** Folded look: waistband + front panel, legs tucked behind, softly rolled bottom edge. */
async function folded(cut) {
  const { width: W, height: H } = await sharp(cut).metadata();
  const crop = { left: Math.round(W * 0.17), top: 0, width: Math.round(W * 0.66), height: Math.round(H * 0.37) };
  const base = await sharp(cut).extract(crop).resize(FOLD.w, FOLD.h, { fit: "fill" }).png().toBuffer();
  const r = 26;
  const shape = Buffer.from(
    `<svg width="${FOLD.w}" height="${FOLD.h}"><rect x="0" y="0" width="${FOLD.w}" height="${FOLD.h}" rx="${r}" ry="${r}" fill="#fff"/><rect x="0" y="0" width="${FOLD.w}" height="${r}" fill="#fff"/></svg>`,
  );
  const shade = Buffer.from(
    `<svg width="${FOLD.w}" height="${FOLD.h}">
      <defs>
        <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.68" stop-color="#000" stop-opacity="0"/>
          <stop offset="0.86" stop-color="#000" stop-opacity="0.16"/>
          <stop offset="1" stop-color="#000" stop-opacity="0.42"/>
        </linearGradient>
        <linearGradient id="h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity="0.22"/>
          <stop offset="0.09" stop-color="#000" stop-opacity="0"/>
          <stop offset="0.91" stop-color="#000" stop-opacity="0"/>
          <stop offset="1" stop-color="#000" stop-opacity="0.22"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
      <rect width="100%" height="100%" fill="url(#h)"/>
    </svg>`,
  );
  return sharp(base)
    .composite([
      { input: shade, blend: "atop" },
      { input: shape, blend: "dest-in" },
    ])
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toBuffer();
}

for (let i = 0; i < NAMES.length; i++) {
  const name = NAMES[i];
  const cut = await cleanCutout(path.join(SRC, `${name}.png`));
  await sharp(cut)
    .resize(FULL.w, FULL.h, { fit: "contain", position: "bottom", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(path.join(OUT, `panty-${name}.webp`));
  await sharp(await folded(cut)).toFile(path.join(OUT, `panty-${name}-folded.webp`));
  // average colour of the body for the swatch
  const s = await sharp(cut).flatten({ background: "#888" }).extract(await centre(cut)).stats();
  const hex = "#" + s.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("");
  console.log(name, hex);
}

async function centre(buf) {
  const { width: W, height: H } = await sharp(buf).metadata();
  return { left: Math.round(W * 0.4), top: Math.round(H * 0.4), width: Math.round(W * 0.2), height: Math.round(H * 0.2) };
}
