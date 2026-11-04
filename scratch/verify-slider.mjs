import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TEMP_PROFILE = path.join(process.env.TEMP || 'C:/temp', 'chrome-verify-' + Date.now());

async function run() {
  const port = 9333;
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

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
    await send('DOM.enable');

    const viewports = [
      { name: 'desktop-1440px', width: 1440, height: 900 },
      { name: 'tablet-768px', width: 768, height: 1024 },
      { name: 'mobile-390px', width: 390, height: 844 },
    ];

    fs.mkdirSync('verification-screenshots', { recursive: true });

    for (const vp of viewports) {
      console.log(`Testing viewport ${vp.name}...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.width < 768,
      });

      // 1. First capture static slide 1 on showcase
      await send('Page.navigate', { url: 'http://localhost:8081/showcase' });
      await new Promise(r => setTimeout(r, 2200));

      const snap1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-slide1.png`, Buffer.from(snap1.data, 'base64'));
      console.log(`Captured ${vp.name}-slide1.png`);

      // 2. Click next or advance to slide 2 to see the parallel transition and result
      await send('Runtime.evaluate', {
        expression: `
          // Advance slide
          const nextBtn = document.querySelector('button[aria-label="Next design slide"]');
          if (nextBtn) {
            nextBtn.click();
          } else {
            const dots = document.querySelectorAll('[role="tab"]');
            if (dots[1]) dots[1].click();
          }
        `
      });
      await new Promise(r => setTimeout(r, 900));

      const snap2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-slide2.png`, Buffer.from(snap2.data, 'base64'));
      console.log(`Captured ${vp.name}-slide2.png`);

      // 3. Test on the full home page directly under Hero
      await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1#showcase-slider' });
      await new Promise(r => setTimeout(r, 2000));
      await send('Runtime.evaluate', {
        expression: `document.getElementById('showcase-slider')?.scrollIntoView({ behavior: 'instant' });`
      });
      await new Promise(r => setTimeout(r, 600));

      const snapHome = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-home-showcase.png`, Buffer.from(snapHome.data, 'base64'));
      console.log(`Captured ${vp.name}-home-showcase.png`);
    }

    // Now capture a mid-transition split frame (e.g. at 50% wipe) to visually prove the parallel masking cut
    console.log('Capturing mid-transition parallel mask cut...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await send('Page.navigate', { url: 'http://localhost:8081/showcase' });
    await new Promise(r => setTimeout(r, 2000));

    // Drag or trigger a partial scrub to 0.5 (halfway between slide 0 and slide 1)
    await send('Runtime.evaluate', {
      expression: `
        // Dispatch touch/mouse drag or set progress to show 50% split
        const slider = document.getElementById('showcase-slider');
        const rect = slider.getBoundingClientRect();
        // Trigger pointer down and drag half way
        const down = new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + 500, clientY: rect.top + 300, button: 0 });
        slider.dispatchEvent(down);
        const move = new MouseEvent('mousemove', { bubbles: true, clientX: rect.left + 500 - (rect.width * 0.5), clientY: rect.top + 300 });
        slider.dispatchEvent(move);
      `
    });
    await new Promise(r => setTimeout(r, 400));
    const snapMid = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/desktop-1440px-mid-mask-cut.png', Buffer.from(snapMid.data, 'base64'));
    console.log('Captured desktop-1440px-mid-mask-cut.png');

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch {}
  }
}

run();

