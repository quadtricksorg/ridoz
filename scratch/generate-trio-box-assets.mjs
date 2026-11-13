/**
 * Generates the optimised assets for the "3-piece box" section
 * (src/components/showcase/trio-box-showcase.tsx):
 *
 *   • 6 recoloured panty photos (clean cotton look, soft natural wrinkles)
 *   • decor: satin drape (crimson + sky), cotton sprig, leaf shadow, stone podium
 *
 * Run:  node scratch/generate-trio-box-assets.mjs
 * Output: src/assets/showcase/trio/*.webp
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT = "src/assets/showcase/trio";
const BASE = "src/assets/showcase/generated/panty-1.webp";
fs.mkdirSync(OUT, { recursive: true });

export const PANTIES = {
  "rani-pink": "#e0336b",
  "rose-clay": "#c27f6c",
  "midnight-navy": "#26336f",
  "orchid-mauve": "#b4609f",
  emerald: "#119270",
  "cherry-red": "#c8102e",
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/* ── Panties ──────────────────────────────────────────────────────────── */

async function pantyPipeline() {
  // Crop to the garment so the layout math is simple.
  const trimmed = await sharp(BASE).trim({ threshold: 1 }).png().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = trimmed.info;

  const rgba = await sharp(trimmed.data).ensureAlpha().raw().toBuffer();
  // Smooth luminance: removes the stonewash speckle, keeps folds/seams.
  const smooth = await sharp(trimmed.data)
    .flatten({ background: "#888888" })
    .greyscale()
    .median(7)
    .blur(2.6)
    .raw()
    .toBuffer();
  const orig = await sharp(trimmed.data).flatten({ background: "#888888" }).greyscale().raw().toBuffer();

  // Soft wrinkles: a few blurred dark/light strokes (128 = neutral).
  const wrinkleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 100 100" preserveAspectRatio="none">
    <rect width="100" height="100" fill="rgb(128,128,128)"/>
    <defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>
    <filter id="b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
    <g filter="url(#b)" fill="none" stroke-linecap="round">
      <path d="M30 19 Q33 23 31 27" stroke="rgb(96,96,96)" stroke-width="1.4"/>
      <path d="M46 19 Q48 23 46.5 26" stroke="rgb(100,100,100)" stroke-width="1.2"/>
      <path d="M62 19 Q64 22.5 62.5 26.5" stroke="rgb(98,98,98)" stroke-width="1.3"/>
      <path d="M31.5 20 Q34.5 23.5 32.5 27" stroke="rgb(165,165,165)" stroke-width="0.9"/>
      <path d="M63.5 20 Q65.5 23 64 26.5" stroke="rgb(165,165,165)" stroke-width="0.9"/>
      <path d="M24 40 Q36 52 44 70" stroke="rgb(104,104,104)" stroke-width="2.2"/>
      <path d="M26 39 Q38 51 46 69" stroke="rgb(160,160,160)" stroke-width="1.4"/>
      <path d="M77 41 Q66 52 58 70" stroke="rgb(106,106,106)" stroke-width="2"/>
      <path d="M75 40 Q64 51 56 69" stroke="rgb(158,158,158)" stroke-width="1.3"/>
    </g>
    <g filter="url(#b2)">
      <ellipse cx="50" cy="45" rx="20" ry="12" fill="rgb(150,150,150)"/>
      <ellipse cx="50" cy="88" rx="10" ry="9" fill="rgb(112,112,112)"/>
    </g>
  </svg>`;
  const wrinkles = await sharp(Buffer.from(wrinkleSvg)).resize(W, H).greyscale().raw().toBuffer();

  // Reference mid-tone of the fabric.
  const vals = [];
  for (let i = 0; i < W * H; i++) if (rgba[i * 4 + 3] > 230) vals.push(smooth[i]);
  vals.sort((a, b) => a - b);
  const mid = vals[Math.floor(vals.length * 0.55)];

  for (const [name, colour] of Object.entries(PANTIES)) {
    const [cr, cg, cb] = hex(colour);
    const lightness = (0.2126 * cr + 0.7152 * cg + 0.0722 * cb) / 255;
    const hi = 0.18 + 0.32 * lightness; // dark colours get gentler highlights
    const out = Buffer.alloc(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      const a = rgba[i * 4 + 3];
      if (!a) continue;
      const lum = smooth[i] * 0.95 + orig[i] * 0.05; // a hint of knit texture
      let rel = (lum / mid) * (1 + ((wrinkles[i] - 128) / 128) * 0.8);
      const px = [cr, cg, cb].map((c) => {
        if (rel <= 1) return c * Math.pow(Math.max(rel, 0), 1.2);
        return c + (255 - c) * Math.min(1, (rel - 1) * 1.6) * hi;
      });
      out[i * 4] = Math.min(255, px[0]);
      out[i * 4 + 1] = Math.min(255, px[1]);
      out[i * 4 + 2] = Math.min(255, px[2]);
      out[i * 4 + 3] = a;
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      .resize({ width: 560 })
      .webp({ quality: 84, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toFile(path.join(OUT, `panty-${name}.webp`));
  }
  console.log(`panties: ${W}x${H} source, aspect ${(W / H).toFixed(3)}, mid ${mid}`);
}

/* ── Decor ────────────────────────────────────────────────────────────── */

const silkSvg = (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${c.hi}"/><stop offset="0.45" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.deep}"/></linearGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="${c.mid}"/><stop offset="0.35" stop-color="${c.hi}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient>
    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hi}"/><stop offset="0.5" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.deep}"/></linearGradient>
    <filter id="s" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="h" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="e" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.5"/></filter>
  </defs>
  <g filter="url(#e)">
  <path d="M120 900 C330 760 520 830 760 640 C980 470 1220 520 1600 300 L1600 900 Z" fill="url(#g1)"/>
  <path d="M380 900 C600 770 760 860 990 720 C1210 590 1380 660 1600 540 L1600 900 Z" fill="url(#g2)"/>
  <path d="M760 900 C930 820 1110 880 1290 790 C1430 720 1520 760 1600 730 L1600 900 Z" fill="url(#g3)"/>
  </g>
  <g filter="url(#s)" fill="none" stroke-linecap="round">
    <path d="M430 860 C600 760 760 790 980 650" stroke="${c.dark}" stroke-width="60" opacity="0.55"/>
    <path d="M1020 860 C1200 800 1360 820 1600 690" stroke="${c.dark}" stroke-width="50" opacity="0.5"/>
    <path d="M900 600 C1100 480 1300 470 1600 360" stroke="${c.dark}" stroke-width="44" opacity="0.4"/>
  </g>
  <g filter="url(#h)" fill="none" stroke-linecap="round">
    <path d="M260 860 C420 760 580 790 770 655 C960 520 1200 540 1590 330" stroke="${c.shine}" stroke-width="16" opacity="0.75"/>
    <path d="M560 880 C720 800 860 840 1000 745 C1180 630 1380 690 1595 570" stroke="${c.shine}" stroke-width="12" opacity="0.6"/>
    <path d="M900 890 C1060 840 1180 860 1300 805 C1420 750 1520 770 1598 750" stroke="${c.shine}" stroke-width="9" opacity="0.5"/>
  </g>
</svg>`;

const SILKS = {
  crimson: { hi: "#c8314f", mid: "#9c1530", deep: "#6e0b1f", dark: "#4a0613", shine: "#f3a3b2" },
  sky: { hi: "#5cc3ea", mid: "#2492c4", deep: "#13628d", dark: "#0a3f5e", shine: "#d4f1ff" },
};

// Deterministic RNG so the assets are reproducible.
const rng = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

const cottonBoll = (cx, cy, s, rot, seed) => {
  const r = rng(seed);
  // Four/five lobes, each a cluster of overlapping puffs → soft, fluffy outline.
  const lobes = [
    [-0.5, -0.12],
    [0.5, -0.1],
    [0, -0.52],
    [-0.26, 0.42],
    [0.3, 0.4],
  ];
  const puffs = [];
  for (const [lx, ly] of lobes) {
    for (let k = 0; k < 9; k++) {
      const a = r() * Math.PI * 2;
      const d = r() * 0.26;
      puffs.push(
        `<circle cx="${((lx + Math.cos(a) * d) * s).toFixed(1)}" cy="${((ly + Math.sin(a) * d) * s).toFixed(1)}" r="${((0.24 + r() * 0.14) * s).toFixed(1)}" fill="url(#boll)"/>`,
      );
    }
  }
  const bract = [0, 72, 144, 216, 288]
    .map(
      (a) =>
        `<path d="M0 0 C${-0.3 * s} ${-0.5 * s} ${-0.25 * s} ${-0.9 * s} 0 ${-1.12 * s} C${0.25 * s} ${-0.9 * s} ${0.3 * s} ${-0.5 * s} 0 0 Z" fill="url(#bract)" transform="rotate(${a + 36})"/>`,
    )
    .join("");
  const creases = lobes
    .map(([lx, ly]) => `<path d="M0 0 L${lx * s * 0.55} ${ly * s * 0.55}" />`)
    .join("");
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    ${bract}
    <g filter="url(#cs)">${puffs.join("")}</g>
    <g stroke="#cfc4b6" stroke-width="${(s * 0.05).toFixed(1)}" stroke-linecap="round" opacity="0.55" filter="url(#crease)">${creases}</g>
  </g>`;
};

const leafPath = (len, wid) => `M0 0 C${len * 0.3} ${-wid} ${len * 0.75} ${-wid * 0.8} ${len} 0 C${len * 0.75} ${wid * 0.8} ${len * 0.3} ${wid} 0 0 Z`;

const cottonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="520" viewBox="0 0 640 520">
  <defs>
    <radialGradient id="boll" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffffff"/><stop offset="0.65" stop-color="#f7f3ee"/><stop offset="1" stop-color="#e2d9cd"/></radialGradient>
    <linearGradient id="bract" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d5a3f"/><stop offset="1" stop-color="#3f2a1c"/></linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#58823a"/><stop offset="0.5" stop-color="#7ea552"/><stop offset="1" stop-color="#5f8a3c"/></linearGradient>
    <filter id="cs" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#5a3a2a" flood-opacity="0.25"/></filter>
    <filter id="crease"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="ls" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#2d3b1c" flood-opacity="0.25"/></filter>
  </defs>
  <g fill="none" stroke="#5e4130" stroke-width="7" stroke-linecap="round">
    <path d="M360 500 C350 410 320 340 260 290"/><path d="M345 420 C400 380 440 350 470 320"/><path d="M320 350 C260 350 200 380 160 410"/>
  </g>
  <g filter="url(#ls)">
    <g transform="translate(300 300) rotate(-38)"><path d="${leafPath(230, 62)}" fill="url(#leaf)"/><path d="M0 0 L225 0" stroke="#3f6526" stroke-width="3"/></g>
    <g transform="translate(262 286) rotate(-108)"><path d="${leafPath(200, 54)}" fill="url(#leaf)"/><path d="M0 0 L195 0" stroke="#3f6526" stroke-width="3"/></g>
    <g transform="translate(440 340) rotate(-8)"><path d="${leafPath(170, 46)}" fill="url(#leaf)"/><path d="M0 0 L165 0" stroke="#3f6526" stroke-width="2.5"/></g>
  </g>
  ${cottonBoll(258, 292, 66, -10, 3)}
  ${cottonBoll(158, 408, 58, 15, 11)}
  ${cottonBoll(472, 322, 60, 8, 23)}
  ${cottonBoll(362, 430, 76, -4, 41)}
</svg>`;

const leavesSvg = (() => {
  const r = rng(7);
  const branches = [
    { d: "M760 -20 C640 120 560 220 430 300", pts: [[700, 50], [650, 110], [600, 170], [545, 225], [485, 270]] },
    { d: "M640 110 C560 120 480 100 380 60", pts: [[580, 116], [520, 110], [450, 90]] },
    { d: "M560 230 C600 330 640 400 720 470", pts: [[585, 300], [615, 360], [660, 420]] },
  ];
  const leaves = [];
  for (const b of branches)
    for (const [x, y] of b.pts)
      for (const side of [-1, 1]) {
        const len = 90 + r() * 50;
        leaves.push(`<path transform="translate(${x} ${y}) rotate(${(side > 0 ? 20 : 160) + (r() - 0.5) * 60})" d="${leafPath(len, len * 0.27)}"/>`);
      }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="560" viewBox="0 0 760 560">
    <defs><filter id="b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <g filter="url(#b)" fill="#5b4a46">
      ${branches.map((b) => `<path d="${b.d}" stroke="#5b4a46" stroke-width="6" fill="none"/>`).join("")}
      ${leaves.join("")}
    </g>
  </svg>`;
})();

const podiumSvg = (() => {
  const r = rng(19);
  const cols = ["#b7a190", "#8f7b6c", "#cdbcad", "#ffffff", "#a48e7d", "#d9c9ba"];
  const dots = (n, area) =>
    Array.from({ length: n }, () => {
      const x = 20 + r() * 1360;
      const y = area[0] + r() * (area[1] - area[0]);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.7 + r() * 1.9).toFixed(1)}" fill="${cols[Math.floor(r() * cols.length)]}" opacity="${(0.45 + r() * 0.5).toFixed(2)}"/>`;
    }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="350" viewBox="0 0 1400 350">
  <defs>
    <radialGradient id="top" cx="0.45" cy="0.35" r="0.75"><stop offset="0" stop-color="#f6eee6"/><stop offset="1" stop-color="#e2d3c5"/></radialGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bba795"/><stop offset="0.3" stop-color="#e3d5c8"/><stop offset="0.55" stop-color="#ebdfd3"/><stop offset="1" stop-color="#b19c8a"/></linearGradient>
    <linearGradient id="sideV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3b2418" stop-opacity="0.18"/></linearGradient>
    <filter id="soft" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
    <clipPath id="body"><path d="M20 120 L20 230 A680 110 0 0 0 1380 230 L1380 120 Z"/></clipPath>
    <clipPath id="topclip"><ellipse cx="700" cy="120" rx="680" ry="110"/></clipPath>
  </defs>
  <ellipse cx="700" cy="262" rx="680" ry="80" fill="#5a2a2a" opacity="0.22" filter="url(#soft)"/>
  <path d="M20 120 L20 230 A680 110 0 0 0 1380 230 L1380 120 Z" fill="url(#side)"/>
  <path d="M20 120 L20 230 A680 110 0 0 0 1380 230 L1380 120 Z" fill="url(#sideV)"/>
  <g clip-path="url(#body)">${dots(700, [120, 345])}</g>
  <ellipse cx="700" cy="120" rx="680" ry="110" fill="url(#top)"/>
  <g clip-path="url(#topclip)">${dots(1100, [5, 235])}</g>
  <ellipse cx="700" cy="120" rx="679" ry="109" fill="none" stroke="#fffaf4" stroke-width="3" opacity="0.85"/>
</svg>`;
})();

async function decor() {
  for (const [name, c] of Object.entries(SILKS)) {
    await sharp(Buffer.from(silkSvg(c)))
      .resize({ width: 1400 })
      .webp({ quality: 78, alphaQuality: 80, effort: 6 })
      .toFile(path.join(OUT, `silk-${name}.webp`));
  }
  await sharp(Buffer.from(cottonSvg)).resize({ width: 420 }).webp({ quality: 84, effort: 6 }).toFile(path.join(OUT, "cotton.webp"));
  await sharp(Buffer.from(leavesSvg)).resize({ width: 560 }).webp({ quality: 70, alphaQuality: 60, effort: 6 }).toFile(path.join(OUT, "leaf-shadow.webp"));
  await sharp(Buffer.from(podiumSvg)).resize({ width: 1100 }).webp({ quality: 82, effort: 6 }).toFile(path.join(OUT, "podium.webp"));
}

await pantyPipeline();
await decor();
for (const f of fs.readdirSync(OUT)) {
  const m = await sharp(path.join(OUT, f)).metadata();
  console.log(f.padEnd(26), `${m.width}x${m.height}`.padEnd(10), `${(fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1)} KB`);
}
