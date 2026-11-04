import { spawn } from 'child_process';

async function run() {
  const p = 9390;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/?no_intro=1'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
  const tab = res.find(t => t.url.includes('localhost:8081'));
  const ws = new (await import('ws')).default(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  const evalJs = q => new Promise(res => {
    const cur = id++;
    const h = d => {
      const m = JSON.parse(d);
      if (m.id === cur) { ws.off('message', h); res(m.result.result.value); }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id: cur, method: 'Runtime.evaluate', params: { expression: q, returnByValue: true, awaitPromise: true } }));
  });

  const colors = await evalJs(`
    (async () => {
      const images = Array.from(document.querySelectorAll('#showcase-slider img')).map(img => img.src);
      const uniqueSrcs = Array.from(new Set(images));
      
      const results = [];
      for (const src of uniqueSrcs) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = src;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          if (data[i + 3] > 200) { // Opaque bra pixel
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
        if (count > 0) {
          const avgR = Math.round(r / count);
          const avgG = Math.round(g / count);
          const avgB = Math.round(b / count);
          const hex = '#' + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, '0')).join('');
          results.push({ src: src.split('/').pop(), hex, rgb: [avgR, avgG, avgB] });
        }
      }
      return results;
    })()
  `);

  console.log('Sampled Bra Colors:', colors);
  chrome.kill();
  process.exit(0);
}

run();

