import fs from 'fs';
import path from 'path';
import { createIco } from './ico_builder.js';

async function main() {
  const brandDir = path.join('public', 'assets', 'brand');
  fs.mkdirSync(brandDir, { recursive: true });

  const content = fs.readFileSync('assets_out.html', 'utf8');
  const start = content.indexOf('<div id="output" style="display:none;">');
  const end = content.indexOf('</div>', start);

  if (start === -1 || end === -1) {
    console.error('Could not find output div in assets_out.html');
    process.exit(1);
  }

  const jsonStr = content.slice(start + '<div id="output" style="display:none;">'.length, end);
  const data = JSON.parse(jsonStr);

  const pngBuffers = {};
  for (const [filename, dataUrl] of Object.entries(data)) {
    const base64 = dataUrl.split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    pngBuffers[filename] = buf;

    // Write to both public/assets/brand/ and public/
    fs.writeFileSync(path.join(brandDir, filename), buf);
    fs.writeFileSync(path.join('public', filename), buf);
    console.log(`Saved ${filename} (${buf.length} bytes)`);
  }

  // Create favicon.ico from 16, 32, 48
  const icoBuf = createIco([
    { width: 16, height: 16, buffer: pngBuffers['favicon-16x16.png'] },
    { width: 32, height: 32, buffer: pngBuffers['favicon-32x32.png'] },
    { width: 48, height: 48, buffer: pngBuffers['favicon-48x48.png'] }
  ]);
  fs.writeFileSync(path.join(brandDir, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join('public', 'favicon.ico'), icoBuf);
  console.log(`Saved favicon.ico (${icoBuf.length} bytes)`);

  // Create crisp SVG favicon
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- RIDOZ Burgundy Circular Symbol with bottom opening -->
  <path d="M 26.82 83.02 A 42 42 0 1 1 73.18 83.02 L 65.34 71.18 A 27.8 27.8 0 1 0 34.66 71.18 Z" fill="#a51538" />
</svg>
`;
  fs.writeFileSync(path.join(brandDir, 'favicon.svg'), faviconSvg);
  fs.writeFileSync(path.join('public', 'favicon.svg'), faviconSvg);
  console.log('Saved favicon.svg');

  // Create SVG primary logo: crisp vector circular ring + authentic calligraphy "Style"
  const styleOnlyBuf = fs.readFileSync('src/assets/logo-style-only.png');
  const styleBase64 = styleOnlyBuf.toString('base64');

  const ridozLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 985" fill="none">
  <!-- RIDOZ Official Burgundy Circular Symbol -->
  <path d="M 257.11 888.59 A 460 460 0 1 1 764.89 888.59 L 678.79 758.50 A 304 304 0 1 0 343.21 758.50 Z" fill="#a51538" />
  <!-- RIDOZ Style Original Script Typography -->
  <image href="data:image/png;base64,${styleBase64}" x="0" y="0" width="1024" height="985" preserveAspectRatio="xMidYMid meet" />
</svg>
`;
  fs.writeFileSync(path.join(brandDir, 'ridoz-logo.svg'), ridozLogoSvg);
  fs.writeFileSync(path.join('public', 'ridoz-logo.svg'), ridozLogoSvg);
  console.log('Saved ridoz-logo.svg');

  // Also make favicon.png point to 32x32 for legacy fallback
  fs.copyFileSync(path.join('public', 'favicon-32x32.png'), path.join('public', 'favicon.png'));
  fs.copyFileSync(path.join('public', 'favicon-32x32.png'), path.join(brandDir, 'favicon.png'));

  console.log('ALL ASSETS GENERATED SUCCESSFULLY!');
}

main().catch(console.error);

