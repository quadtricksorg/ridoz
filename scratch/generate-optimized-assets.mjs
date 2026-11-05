import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = 'src/assets/showcase/generated';
fs.mkdirSync(outDir, { recursive: true });

async function buildAssets() {
  console.log('Generating optimized WebP assets...');

  // 1. BRA SLIDES
  const braSources = [
    'src/assets/showcase/design1.png',
    'src/assets/showcase/design2.png',
    'src/assets/showcase/design3.png',
    'src/assets/showcase/design4.png',
    'src/assets/showcase/design5.png',
  ];
  for (let i = 0; i < braSources.length; i++) {
    const dest = path.join(outDir, `bra-${i + 1}.webp`);
    await sharp(braSources[i])
      .webp({ quality: 85, effort: 4 })
      .toFile(dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`bra-${i + 1}.webp: ${size} KB`);
  }

  // 2. BOXER SLIDES
  const trunkConfigs = [
    { name: 'boxer-1', mod: { hue: 0 } },
    { name: 'boxer-2', mod: { hue: 200, saturation: 1.1 } },
    { name: 'boxer-3', mod: { hue: 95, saturation: 0.9, brightness: 1.1 } },
    { name: 'boxer-4', mod: { hue: 210, saturation: 0.35, brightness: 1.15 } },
    { name: 'boxer-5', mod: { hue: 35, saturation: 1.1, brightness: 1.1 } },
  ];
  for (const c of trunkConfigs) {
    const dest = path.join(outDir, `${c.name}.webp`);
    await sharp('src/assets/c-trunk.png')
      .modulate(c.mod)
      .webp({ quality: 85, effort: 4 })
      .toFile(dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`${c.name}.webp: ${size} KB`);
  }

  // 3. PANTY SLIDES
  const pantyConfigs = [
    { name: 'panty-1', mod: { hue: 0 } },
    { name: 'panty-2', mod: { hue: 155, saturation: 1.1, brightness: 1.05 } },
    { name: 'panty-3', mod: { hue: 100, saturation: 0.8, brightness: 1.2 } },
    { name: 'panty-4', mod: { hue: 185, saturation: 1.2, brightness: 1.15 } },
    { name: 'panty-5', mod: { hue: 0, saturation: 0.2, brightness: 0.7 } },
  ];
  for (const c of pantyConfigs) {
    const dest = path.join(outDir, `${c.name}.webp`);
    await sharp('src/assets/c-panty.png')
      .modulate(c.mod)
      .webp({ quality: 85, effort: 4 })
      .toFile(dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`${c.name}.webp: ${size} KB`);
  }

  // 4. BRIEF SLIDES
  const briefConfigs = [
    { name: 'brief-1', mod: { hue: 0 } },
    { name: 'brief-2', mod: { hue: 160, saturation: 1.1, brightness: 1.05 } },
    { name: 'brief-3', mod: { hue: 260, saturation: 0.8, brightness: 1.15 } },
    { name: 'brief-4', mod: { hue: 0, saturation: 0.3, brightness: 1.2 } },
    { name: 'brief-5', mod: { hue: 185, saturation: 0.9, brightness: 0.9 } },
  ];
  for (const c of briefConfigs) {
    const dest = path.join(outDir, `${c.name}.webp`);
    await sharp('src/assets/c-brief.png')
      .modulate(c.mod)
      .webp({ quality: 85, effort: 4 })
      .toFile(dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`${c.name}.webp: ${size} KB`);
  }

  // 5. THUMBNAILS (compact 96x96 webp for selector swatches)
  const thumbs = [
    { name: 'thumb-bra', src: 'src/assets/c-bra.png' },
    { name: 'thumb-boxer', src: 'src/assets/c-trunk.png' },
    { name: 'thumb-panty', src: 'src/assets/c-panty.png' },
    { name: 'thumb-brief', src: 'src/assets/c-brief.png' },
  ];
  for (const t of thumbs) {
    const dest = path.join(outDir, `${t.name}.webp`);
    await sharp(t.src)
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`${t.name}.webp: ${size} KB`);
  }

  console.log('All optimized assets built successfully!');
}

buildAssets().catch(console.error);

