/**
 * "Every body" hero — converts the four campaign artworks (women/men × wide/tall)
 * into responsive WebPs in src/assets/hero/.
 *   node scratch/generate-every-body-hero.mjs <women-wide> <women-tall> <men-wide> <men-tall>
 * Tall images are normalised to 941×1672 so the hair-animation coordinates line up.
 */
import sharp from "sharp";

const [womenWide, womenTall, menWide, menTall] = process.argv.slice(2);
const OUT = "src/assets/hero";
const jobs = [
  [womenWide, "women-wide", 1672, 941, [1672, 1120]],
  [womenTall, "women-tall", 941, 1672, [941, 640]],
  [menWide, "men-wide", 1672, 941, [1672, 1120]],
  [menTall, "men-tall", 941, 1672, [941, 640]],
];
for (const [src, name, w, h, widths] of jobs) {
  for (const width of widths) {
    const info = await sharp(src)
      .resize(width, Math.round((width * h) / w), { fit: "fill" })
      .webp({ quality: width > 1000 ? 76 : 74, effort: 6, smartSubsample: true })
      .toFile(`${OUT}/every-body-${name}-${width}.webp`);
    console.log(name, width, `${(info.size / 1024).toFixed(0)} KB`);
  }
}
