// Smaller derivatives of existing assets, sized for how the page actually draws them.
// The originals are left untouched (high-DPR desktop still gets them via srcset).
//
// Usage: node scratch/generate-responsive-variants.mjs
//
//   src/assets/ridoz-logo-160.png             header/footer mark (drawn 32–64 CSS px)
//   src/assets/logo-{ring,style}-only-640.webp  intro loader artwork (drawn ≤ 310 CSS px)
//   src/assets/fabric-{768,1408}.webp           Feature card texture (25% opacity overlay)
//   src/assets/products/480/<name>.webp         product cut-outs for phone-sized slots
//   src/assets/products/thumb/<name>.webp       colour-swatch thumbnails (drawn ≤ 44 CSS px)
//   public/favicon.svg, public/assets/brand/favicon.svg
//                                               same SVG wrapper, embedded PNG 1024 → 192 px
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const A = "src/assets";
const log = (f) => console.log(`${f}  ${(fs.statSync(f).size / 1024).toFixed(1)} KB`);
const webp = (o = {}) => ({ quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true, ...o });

// Brand mark: 160 px covers the largest drawn size (64 px) at 2.5x DPR.
// Palette PNG: flat brand colours → smaller than WebP here, no visible difference.
await sharp(`${A}/ridoz-logo.png`).resize(160, 160).png({ compressionLevel: 9, palette: true, quality: 95 }).toFile(`${A}/ridoz-logo-160.png`);

// Intro loader: ring + "Style" must stay pixel-aligned → identical output size.
for (const n of ["logo-ring-only", "logo-style-only"]) {
  const f = `${A}/${n}-640.webp`;
  await sharp(`${A}/${n}.png`).resize(640, 616, { fit: "fill" }).webp(webp({ quality: 90, alphaQuality: 100 })).toFile(f);
  log(f);
}

// Fabric texture (drawn at 25% opacity with mix-blend-overlay).
for (const w of [768, 1408]) {
  const f = `${A}/fabric-${w}.webp`;
  await sharp(`${A}/fabric.jpg`).resize({ width: w }).webp({ quality: 72, effort: 6 }).toFile(f);
  log(f);
}

// Product cut-outs.
const P = `${A}/products`;
fs.mkdirSync(`${P}/480`, { recursive: true });
fs.mkdirSync(`${P}/thumb`, { recursive: true });
for (const file of fs.readdirSync(P).filter((f) => f.endsWith(".webp"))) {
  await sharp(path.join(P, file)).resize({ width: 480 }).webp(webp()).toFile(`${P}/480/${file}`);
  await sharp(path.join(P, file)).resize({ width: 128 }).webp(webp({ quality: 80 })).toFile(`${P}/thumb/${file}`);
}
console.log("products/480 + products/thumb done");

// SVG favicon: keep the wrapper, shrink the embedded raster.
const png192 = await sharp(`${A}/ridoz-logo.png`).resize(192, 192).png({ compressionLevel: 9 }).toBuffer();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">\n  <image href="data:image/png;base64,${png192.toString("base64")}" width="512" height="512"/>\n</svg>\n`;
for (const f of ["public/favicon.svg", "public/assets/brand/favicon.svg"]) {
  fs.writeFileSync(f, svg);
  log(f);
}
