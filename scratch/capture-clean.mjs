import { spawn } from 'child_process';
import fs from 'fs';

async function capture() {
  const p = 9488;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/?no_intro=1'
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
    await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
    await new Promise(r => setTimeout(r, 3000));

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll to 0
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise(r => setTimeout(r, 1000));

    // Capture Hero screenshot
    let scrHero = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/clean-hero-1366x768.png', Buffer.from(scrHero.data, 'base64'));
    console.log('Hero screenshot saved');

    // Scroll to showcase section
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('showcase-slider');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    let scrSlide0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/clean-showcase-slide0.png', Buffer.from(scrSlide0.data, 'base64'));
    console.log('Slide 0 screenshot saved');

    // Click 5th dot for Slide 4 (Terra / Rose Clay)
    await send('Runtime.evaluate', {
      expression: `
        const dots = document.querySelectorAll('[role="tab"]');
        if (dots[4]) dots[4].click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    let scrSlide4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/clean-showcase-slide4.png', Buffer.from(scrSlide4.data, 'base64'));
    console.log('Slide 4 screenshot saved');

    ws.close();
  } finally {
    chrome.kill();
  }
}

capture().catch(console.error);

