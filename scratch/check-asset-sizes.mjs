import fs from 'fs';

for (const f of ['c-bra.png', 'c-trunk.png', 'c-brief.png', 'c-panty.png']) {
  const stat = fs.statSync(`src/assets/${f}`);
  console.log(`${f}: ${(stat.size / 1024).toFixed(1)} KB`);
}

for (const f of ['design1.png', 'design2.png', 'design3.png', 'design4.png', 'design5.png']) {
  const stat = fs.statSync(`src/assets/showcase/${f}`);
  console.log(`showcase/${f}: ${(stat.size / 1024).toFixed(1)} KB`);
}

