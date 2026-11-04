import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  const p = 9410;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/showcase'
  ]);
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await new Promise(r => setTimeout(r, 800));

  // Capture slide 1 at top
  let scr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verification-screenshots/showcase-dark-slide-1.png', Buffer.from(scr.data, 'base64'));
  console.log('Saved showcase-dark-slide-1.png');

  // Click dot 2 (Vanilla)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dots = document.querySelectorAll('[role="tab"]');
        if (dots[1]) dots[1].click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 900));
  scr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verification-screenshots/showcase-dark-slide-2.png', Buffer.from(scr.data, 'base64'));
  console.log('Saved showcase-dark-slide-2.png');

  // Click dot 3 (Eucalyptus)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dots = document.querySelectorAll('[role="tab"]');
        if (dots[2]) dots[2].click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 900));
  scr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verification-screenshots/showcase-dark-slide-3.png', Buffer.from(scr.data, 'base64'));
  console.log('Saved showcase-dark-slide-3.png');

  // Click dot 4 (Azure)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dots = document.querySelectorAll('[role="tab"]');
        if (dots[3]) dots[3].click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 900));
  scr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verification-screenshots/showcase-dark-slide-4.png', Buffer.from(scr.data, 'base64'));
  console.log('Saved showcase-dark-slide-4.png');

  // Click dot 5 (Terra)
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dots = document.querySelectorAll('[role="tab"]');
        if (dots[4]) dots[4].click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 900));
  scr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verification-screenshots/showcase-dark-slide-5.png', Buffer.from(scr.data, 'base64'));
  console.log('Saved showcase-dark-slide-5.png');

  // Mobile test (390x844) on Eucalyptus
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    hasTouch: true,
  });
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const dots = document.querySelectorAll('[role="tab"]');
        if (dots[2]) dots[2].click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 900));
  scr = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('verification-screenshots/showcase-dark-mobile-slide-3.png', Buffer.from(scr.data, 'base64'));
  console.log('Saved showcase-dark-mobile-slide-3.png');

  chrome.kill();
  process.exit(0);
}

run();

