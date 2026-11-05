import sharp from 'sharp';

async function sampleColor(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 128) {
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
  console.log(`${file}: avg color rgb(${avgR}, ${avgG}, ${avgB}) = ${hex}`);
}

sampleColor('src/assets/c-trunk.png');
sampleColor('src/assets/c-brief.png');
sampleColor('src/assets/c-panty.png');

