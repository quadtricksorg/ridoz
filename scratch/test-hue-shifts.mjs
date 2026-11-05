import sharp from 'sharp';

async function testHueShifts(file, shifts) {
  console.log(`=== ${file} ===`);
  for (const s of shifts) {
    const pipeline = sharp(file).modulate(s.mod);
    const { data } = await pipeline.raw().toBuffer({ resolveWithObject: true });
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
    const avgR = Math.round(r / count);
    const avgG = Math.round(g / count);
    const avgB = Math.round(b / count);
    const hex = '#' + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, '0')).join('');
    console.log(`${s.name}: rgb(${avgR},${avgG},${avgB}) = ${hex}`);
  }
}

async function run() {
  await testHueShifts('src/assets/c-trunk.png', [
    { name: 'WINE', mod: { hue: 0 } },
    { name: 'NAVY', mod: { hue: 200, saturation: 1.1 } },
    { name: 'OLIVE', mod: { hue: 95, saturation: 0.9, brightness: 1.1 } },
    { name: 'SLATE', mod: { hue: 210, saturation: 0.35, brightness: 1.15 } },
    { name: 'AMBER', mod: { hue: 35, saturation: 1.1, brightness: 1.1 } }
  ]);

  await testHueShifts('src/assets/c-panty.png', [
    { name: 'TEAL', mod: { hue: 0 } },
    { name: 'BERRY', mod: { hue: 155, saturation: 1.1, brightness: 1.05 } },
    { name: 'LAVENDER', mod: { hue: 100, saturation: 0.8, brightness: 1.2 } },
    { name: 'TERRA', mod: { hue: 185, saturation: 1.2, brightness: 1.15 } },
    { name: 'ONYX', mod: { hue: 0, saturation: 0.2, brightness: 0.7 } }
  ]);

  await testHueShifts('src/assets/c-brief.png', [
    { name: 'NAVY', mod: { hue: 0 } },
    { name: 'MERLOT', mod: { hue: 160, saturation: 1.1, brightness: 1.05 } },
    { name: 'SAGE', mod: { hue: 260, saturation: 0.8, brightness: 1.15 } },
    { name: 'STEEL', mod: { hue: 0, saturation: 0.3, brightness: 1.2 } },
    { name: 'COFFEE', mod: { hue: 185, saturation: 0.9, brightness: 0.9 } }
  ]);
}

run().catch(console.error);

