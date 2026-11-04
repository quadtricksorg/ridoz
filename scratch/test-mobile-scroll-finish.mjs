import { spawn } from 'child_process';
import fs from 'fs';

async function testMobileScrollFinish() {
  const p = 9447;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/?no_intro=1'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2200));
    const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
    const tab = res.find(t => t.url.includes('localhost:8081'));
    if (!tab) throw new Error('No tab found');

    const ws = new (await import('ws')).default(tab.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const cur = id++;
      const handler = d => {
        const m = JSON.parse(d);
        if (m.id === cur) {
          ws.off('message', handler);
          if (m.error) reject(m.error);
          else resolve(m.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await send('Runtime.evaluate', {
      expression: `
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    // Scroll into the showcase section to slide 1.45 (between Lavender and Vanilla)
    const metrics = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const track = document.getElementById('showcase-slider')?.parentElement;
          if (!track) return null;
          const rect = track.getBoundingClientRect();
          const trackTop = window.scrollY + rect.top;
          const scrollable = track.offsetHeight - window.innerHeight;
          const targetY = trackTop + (1.45 / 4) * scrollable;
          window.scrollTo(0, targetY);
          return { trackTop, scrollable, targetY, scrollY: window.scrollY };
        })()
      `,
      returnByValue: true,
    });

    console.log('Mobile intermediate scroll:', metrics.result?.value);

    // Wait for the snap animation to complete to Slide 1 (VANILLA)
    await new Promise(r => setTimeout(r, 900));

    const finalState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const track = document.getElementById('showcase-slider')?.parentElement;
          if (!track) return null;
          const rect = track.getBoundingClientRect();
          const scrollable = track.offsetHeight - window.innerHeight;
          const currentProg = (-rect.top / scrollable) * 4;
          const activeDot = document.querySelector('[role="tab"][aria-selected="true"]');
          const dots = Array.from(document.querySelectorAll('[role="tab"]'));
          const activeIndex = dots.indexOf(activeDot);
          return { currentProg, activeIndex, scrollY: window.scrollY };
        })()
      `,
      returnByValue: true,
    });

    console.log('Mobile final State after snap:', finalState.result?.value);

    let scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/snapped-finished-mobile-slide-1.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved mobile screenshot: verification-screenshots/snapped-finished-mobile-slide-1.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testMobileScrollFinish().catch(err => {
  console.error(err);
  process.exit(1);
});

