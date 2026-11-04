import { spawn } from 'child_process';

async function run() {
  const p = 9385;
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
    ws.send(JSON.stringify({ id: cur, method: 'Runtime.evaluate', params: { expression: q, returnByValue: true } }));
  });
  const data = await evalJs(`
    (() => {
      const s = document.getElementById('showcase-slider');
      const r = s.getBoundingClientRect();
      const tr = s.parentElement.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        sliderRect: { top: r.top, left: r.left, width: r.width, height: r.height },
        trackRect: { top: tr.top, height: tr.height },
        bodyHeight: document.body.scrollHeight,
      };
    })()
  `);
  console.log('DOM check:', data);
  chrome.kill();
  process.exit(0);
}

run();

