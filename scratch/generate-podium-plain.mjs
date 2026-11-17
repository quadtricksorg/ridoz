/**
 * Cuts the plain stone podium out of its black-background render (no alpha in
 * the source) and adds a soft rose contact shadow that suits the blush page.
 *   node scratch/generate-podium-plain.mjs <source.png>
 * Output: src/assets/showcase/podium/podium-plain.webp
 */
import sharp from "sharp";

const src = process.argv[2];
const OUT = "src/assets/showcase/podium/podium-plain.webp";
const smooth = (t) => t * t * (3 - 2 * t);

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const lum = (i) => (0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2]) / 255;

// Mean stone colour, used for anti-aliased edge pixels (avoids a dark fringe).
let mr = 0, mg = 0, mb = 0, n = 0;
for (let i = 0; i < W * H; i++)
  if (lum(i) > 0.75) { mr += data[i * 3]; mg += data[i * 3 + 1]; mb += data[i * 3 + 2]; n++; }
const mean = [mr / n, mg / n, mb / n];

let minX = W, maxX = 0, minY = H, maxY = 0;
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  // black bg ≈ 0, grey halo ≤ 0.30, stone ≥ 0.74
  const a = smooth(Math.max(0, Math.min(1, (lum(i) - 0.5) / 0.2)));
  const k = a < 0.98 ? 1 - a : 0; // pull edge pixels towards the stone colour
  for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(data[i * 3 + c] * (1 - k) + mean[c] * k);
  rgba[i * 4 + 3] = Math.round(a * 255);
  if (a > 0.5) {
    const x = i % W, y = (i - x) / W;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}

// Soft contact shadow under the base, extending a little beyond the podium.
const pad = Math.round((maxX - minX) * 0.06);
const cx = (minX + maxX) / 2, rx = (maxX - minX) / 2 + pad, ry = (maxY - minY) * 0.13;
const shadow = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
     <defs><filter id="b" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="22"/></filter></defs>
     <ellipse cx="${cx}" cy="${maxY - ry * 0.35}" rx="${rx}" ry="${ry}" fill="#5c2433" fill-opacity="0.32" filter="url(#b)"/>
   </svg>`,
);

const composed = await sharp(shadow)
  .composite([{ input: rgba, raw: { width: W, height: H, channels: 4 } }])
  .png()
  .toBuffer();

const out = await sharp(composed)
  .trim({ threshold: 1 })
  .resize({ width: 1200 })
  .webp({ quality: 82, alphaQuality: 85, effort: 6, smartSubsample: true })
  .toFile(OUT);
console.log(OUT, `${out.width}x${out.height}`, `${(out.size / 1024).toFixed(1)} KB`);
