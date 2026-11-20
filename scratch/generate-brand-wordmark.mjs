// Builds clean, brand-coloured RIDOZ wordmark (with "Style" in the O) images from the master PNG.
// Usage: node scratch/generate-brand-wordmark.mjs <source.png>
import sharp from "sharp";
const src = process.argv[2];
const BRAND = { r: 0xa5, g: 0x15, b: 0x38 }; // #a51538, same as the site's --primary
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alpha = Buffer.alloc(info.width * info.height);
for (let i = 0, p = 0; i < data.length; i += 4, p++) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
  // ink = opaque and clearly red; drop the stray speckles and the bright-red fringe halo
  alpha[p] = a > 40 && r > 90 && r > g * 1.8 ? a : 0;
}
const mask = await sharp(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
  .median(3).png().toBuffer();
const coloured = await sharp({ create: { width: info.width, height: info.height, channels: 3, background: BRAND } })
  .joinChannel(mask).png().toBuffer();
const trimmed = await sharp(coloured).trim({ threshold: 1 }).png().toBuffer();
for (const w of [240, 480]) {
  const out = `src/assets/brand/ridoz-wordmark-${w}.webp`;
  const r = await sharp(trimmed).resize({ width: w }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out);
  console.log(out, r.width, r.height, r.size);
}
