import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TEMP_PROFILE = path.join(process.env.TEMP || 'C:/temp', 'chrome-touch-diag-' + Date.now());

async function run() {
  const port = 9335;
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;

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

    await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
    await new Promise(r => setTimeout(r, 2000));

    const diag = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          if (!slider) return { error: 'slider not found' };
          const rect = slider.getBoundingClientRect();
          const computed = window.getComputedStyle(slider);
          return {
            rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
            touchAction: computed.touchAction,
            pointerEvents: computed.pointerEvents,
            overflow: computed.overflow,
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Slider diagnosis:', JSON.stringify(diag, null, 2));

    ws.close();
  } catch (err) {
    console.error('Diag error:', err);
  } finally {
    chrome.kill();
  }
}

run();
