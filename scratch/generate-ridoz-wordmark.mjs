// Builds a clean alpha-only mask of the RIDOZ "Style" wordmark from the supplied PNG.
// Usage: node scratch/generate-ridoz-wordmark.mjs <source.png>
import sharp from "sharp";
const src = process.argv[2];
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const out = Buffer.alloc(info.width * info.height);
for (let i = 0, p = 0; i < data.length; i += 4, p++) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
  // ink = opaque and clearly red; drop speckles/fringe and the black backdrop
  const ink = a > 40 && r > 90 && r > g * 1.8 ? Math.min(255, a) : 0;
  out[p] = ink;
}
const mask = sharp(out, { raw: { width: info.width, height: info.height, channels: 1 } })
  .median(3);
const buf = await mask.png().toBuffer();
const white = await sharp({ create: { width: info.width, height: info.height, channels: 3, background: "#fff" } })
  .joinChannel(buf)
  .png()
  .toBuffer();
await sharp(white).trim({ threshold: 1 }).resize({ width: 1200 }).webp({ quality: 90, alphaQuality: 100 })
  .toFile("src/assets/showcase/trio/ridoz-wordmark.webp");
console.log("done");
