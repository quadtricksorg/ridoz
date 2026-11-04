import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TEMP_PROFILE = path.join(process.env.TEMP || 'C:/temp', 'chrome-touch-test-' + Date.now());

async function run() {
  const port = 9334;
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1800));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    console.log('WS URL:', wsUrl);

    const ws = new (await import('ws')).default(wsUrl);
    await new Promise((res, rej) => {
      ws.on('open', res);
      ws.on('error', rej);
    });

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((res) => {
        const id = msgId++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            ws.off('message', handler);
            res(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    // Emulate iPhone mobile touch
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
    });

    await send('Page.navigate', { url: 'http://localhost:8081/showcase' });
    await new Promise(r => setTimeout(r, 2000));

    // Listen to console errors or events
    await send('Runtime.evaluate', {
      expression: `
        window.__events = [];
        const slider = document.getElementById('showcase-slider');
        slider.addEventListener('touchstart', (e) => window.__events.push('touchstart'));
        slider.addEventListener('touchmove', (e) => window.__events.push('touchmove, cancelable=' + e.cancelable));
        slider.addEventListener('touchend', (e) => window.__events.push('touchend'));
        slider.addEventListener('touchcancel', (e) => window.__events.push('touchcancel'));
      `
    });

    // Synthesize touch gesture: swipe up (touch at y=500, move to y=200)
    console.log('Synthesizing touch swipe up...');
    await send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 500, id: 0 }]
    });
    await new Promise(r => setTimeout(r, 50));

    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 400, id: 0 }]
    });
    await new Promise(r => setTimeout(r, 50));

    await send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 195, y: 300, id: 0 }]
    });
    await new Promise(r => setTimeout(r, 50));

    await send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
    await new Promise(r => setTimeout(r, 600));

    const eventsResult = await send('Runtime.evaluate', {
      expression: `JSON.stringify(window.__events)`
    });
    console.log('Fired touch events:', eventsResult.value);

    const activeSlide = await send('Runtime.evaluate', {
      expression: `
        const dots = document.querySelectorAll('[role="tab"]');
        Array.from(dots).map(d => d.getAttribute('aria-selected'));
      `
    });
    console.log('Active dots after touch swipe:', activeSlide.value);

    ws.close();
  } catch (err) {
    console.error('Error during touch test:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch {}
  }
}

run();

