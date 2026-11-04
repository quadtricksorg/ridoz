import { spawn } from 'child_process';
import fs from 'fs';

async function check() {
  const p = 9453;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/?no_intro=1'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2200));
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await new Promise(r => setTimeout(r, 1200));

    const info = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const hero = document.getElementById('drop');
          const heroRect = hero.getBoundingClientRect();
          const circle = hero.querySelector('.rounded-full.shadow-2xl');
          const circleRect = circle ? circle.getBoundingClientRect() : null;
          const showcase = document.getElementById('showcase-slider');
          const showcaseTrack = showcase ? showcase.parentElement.getBoundingClientRect() : null;
          return {
            windowHeight: window.innerHeight,
            heroRect: { top: heroRect.top, bottom: heroRect.bottom, height: heroRect.height },
            circleRect: circleRect ? { top: circleRect.top, bottom: circleRect.bottom, height: circleRect.height } : null,
            showcaseTrack: showcaseTrack ? { top: showcaseTrack.top, bottom: showcaseTrack.bottom, height: showcaseTrack.height } : null,
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Layout metrics at scrollY=0:', info.result.value);

    // Capture screenshot at scrollY=0
    let scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/hero-desktop-scrollY-0.png', Buffer.from(scr.data, 'base64'));

    // Capture screenshot scrolled slightly down so Hero and second section meet
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 300);` });
    await new Promise(r => setTimeout(r, 500));
    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/hero-desktop-scrollY-300.png', Buffer.from(scr.data, 'base64'));

    ws.close();
  } finally {
    chrome.kill();
  }
}

check().catch(console.error);

