import { spawn } from 'child_process';
import fs from 'fs';

async function testMobileSingleTouch() {
  const p = 9450;
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
    await send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
    });

    await send('Runtime.evaluate', {
      expression: `
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
      `
    });

    await new Promise(r => setTimeout(r, 1200));

    // Scroll to start of showcase section (Slide 0: Lavender)
    const init = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider?.parentElement;
          if (!track) return null;
          const rect = track.getBoundingClientRect();
          const trackTop = window.scrollY + rect.top;
          window.scrollTo(0, trackTop);
          return { trackTop, scrollY: window.scrollY };
        })()
      `,
      returnByValue: true,
    });
    console.log('Scrolled to showcase start (Slide 0):', init.result?.value);
    await new Promise(r => setTimeout(r, 800));

    // Check initial active dot
    let check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeDot = document.querySelector('[role="tab"][aria-selected="true"]');
          const dots = Array.from(document.querySelectorAll('[role="tab"]'));
          return dots.indexOf(activeDot);
        })()
      `,
      returnByValue: true,
    });
    console.log('Initial slide index (should be 0):', check.result?.value);

    // SIMULATE 1: FAST, HUGE TOUCH DRAG UP (from y=650 to y=150, -500px drag!)
    // In unconstrained scrolling, a 500px fast fling would skip to slide 3 or 4.
    // With our touch clamp, it MUST land on Slide 1 ONLY!
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 650 }],
    });
    // intermediate move steps simulating fast drag
    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 400 }],
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 150 }],
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    // Wait for slide 1 transition to settle
    await new Promise(r => setTimeout(r, 800));

    check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeDot = document.querySelector('[role="tab"][aria-selected="true"]');
          const dots = Array.from(document.querySelectorAll('[role="tab"]'));
          return dots.indexOf(activeDot);
        })()
      `,
      returnByValue: true,
    });
    console.log('After 1st fast touch scroll (should be 1):', check.result?.value);

    let scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/touch-test-slide-1.png', Buffer.from(scr.data, 'base64'));

    // SIMULATE 2: SECOND TOUCH DRAG UP
    // Now from Slide 1, do another touch drag up. It must advance to Slide 2 ONLY!
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 600 }],
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 200 }],
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    await new Promise(r => setTimeout(r, 800));

    check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeDot = document.querySelector('[role="tab"][aria-selected="true"]');
          const dots = Array.from(document.querySelectorAll('[role="tab"]'));
          return dots.indexOf(activeDot);
        })()
      `,
      returnByValue: true,
    });
    console.log('After 2nd touch scroll (should be 2):', check.result?.value);

    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/touch-test-slide-2.png', Buffer.from(scr.data, 'base64'));

    // SIMULATE 3: TOUCH DRAG DOWN (scrolling back up)
    // From Slide 2, drag down. It must advance back to Slide 1 ONLY!
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 200 }],
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 600 }],
    });
    await send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    await new Promise(r => setTimeout(r, 800));

    check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeDot = document.querySelector('[role="tab"][aria-selected="true"]');
          const dots = Array.from(document.querySelectorAll('[role="tab"]'));
          return dots.indexOf(activeDot);
        })()
      `,
      returnByValue: true,
    });
    console.log('After 3rd touch scroll backwards (should be 1):', check.result?.value);

    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/touch-test-back-to-slide-1.png', Buffer.from(scr.data, 'base64'));

    ws.close();
  } finally {
    chrome.kill();
  }
}

testMobileSingleTouch().catch(err => {
  console.error(err);
  process.exit(1);
});

