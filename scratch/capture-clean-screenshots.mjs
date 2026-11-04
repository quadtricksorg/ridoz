import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9351;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-snaps-' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8081/?no_intro=1'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('localhost:8081'));

    const ws = new (await import('ws')).default(pageTab.webSocketDebuggerUrl);
    await new Promise((res) => ws.on('open', res));

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

    const viewports = [
      { name: 'desktop-1440px', width: 1440, height: 900, mobile: false },
      { name: 'tablet-768px', width: 768, height: 1024, mobile: false },
      { name: 'mobile-390px', width: 390, height: 844, mobile: true },
    ];

    for (const vp of viewports) {
      console.log(`Capturing ${vp.name}...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.mobile,
      });

      // Scroll to slider track locked position
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const track = slider.parentElement;
            const trackTop = track.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: trackTop + 20, behavior: 'instant' });
          })()
        `
      });
      await new Promise(r => setTimeout(r, 500));

      const snap1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-slide1-locked.png`, Buffer.from(snap1.data, 'base64'));

      // Scroll to mid-transition (split mask cut)
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const track = slider.parentElement;
            const trackTop = track.getBoundingClientRect().top + window.scrollY;
            const scrollDistance = track.offsetHeight - window.innerHeight;
            // Scroll to ~15% for split between slide 0 and 1
            window.scrollTo({ top: trackTop + scrollDistance * 0.14, behavior: 'instant' });
          })()
        `
      });
      await new Promise(r => setTimeout(r, 600));

      const snapSplit = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-parallel-mask-split.png`, Buffer.from(snapSplit.data, 'base64'));
      console.log(`Saved ${vp.name} screenshots.`);
    }

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

run();

