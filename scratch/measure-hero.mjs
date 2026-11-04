import { spawn } from 'child_process';
import fs from 'fs';

async function measure() {
  const p = 9455;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/showcase' // use showcase first to test port then check index
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
    const tab = res.find(t => t.url.includes('localhost:8081'));
    const ws = new (await import('ws')).default(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let id = 1;
    const send = (method, params = {}) => new Promise(resolve => {
      const cur = id++;
      const h = d => {
        const m = JSON.parse(d);
        if (m.id === cur) { ws.off('message', h); resolve(m.result); }
      };
      ws.on('message', h);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    // Navigate to /
    await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
    await new Promise(r => setTimeout(r, 2000));

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Runtime.evaluate', {
      expression: `
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    const result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const hero = document.getElementById('drop');
          const circle = hero.querySelector('.rounded-full.shadow-2xl');
          const showcase = document.getElementById('showcase-slider');
          const hr = hero.getBoundingClientRect();
          const cr = circle ? circle.getBoundingClientRect() : null;
          const sr = showcase ? showcase.getBoundingClientRect() : null;
          return {
            heroHeight: hr.height,
            heroBottom: hr.bottom,
            circleTop: cr?.top,
            circleBottom: cr?.bottom,
            circleHeight: cr?.height,
            overflowPixels: cr ? cr.bottom - hr.bottom : 0,
            showcaseTop: sr?.top
          };
        })()
      `,
      returnByValue: true
    });

    console.log('MEASUREMENTS:', result.result.value);

    // Capture screenshot at scrollY=0
    let scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/hero-desktop-measured.png', Buffer.from(scr.data, 'base64'));

    ws.close();
  } finally {
    chrome.kill();
  }
}

measure().catch(console.error);

