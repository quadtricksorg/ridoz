import { spawn } from 'child_process';
import fs from 'fs';

async function capture() {
  const p = 9435;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/showcase'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2200));
    const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
    const tab = res.find(t => t.url.includes('localhost:8081'));
    if (!tab) throw new Error('No localhost:8081 tab found');

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

    // Slide 1 (Lilac)
    let scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/unified-bg-slide-1.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved unified-bg-slide-1.png');

    // Click dot 2 (Vanilla)
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[role="tab"]')[1]?.click();`
    });
    await new Promise(r => setTimeout(r, 900));
    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/unified-bg-slide-2.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved unified-bg-slide-2.png');

    // Click dot 3 (Eucalyptus)
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[role="tab"]')[2]?.click();`
    });
    await new Promise(r => setTimeout(r, 900));
    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/unified-bg-slide-3.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved unified-bg-slide-3.png');

    // Click dot 4 (Azure)
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[role="tab"]')[3]?.click();`
    });
    await new Promise(r => setTimeout(r, 900));
    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/unified-bg-slide-4.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved unified-bg-slide-4.png');

    // Click dot 5 (Terra)
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[role="tab"]')[4]?.click();`
    });
    await new Promise(r => setTimeout(r, 900));
    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/unified-bg-slide-5.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved unified-bg-slide-5.png');

    // Switch to Mobile (390px)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('[role="tab"]')[0]?.click();`
    });
    await new Promise(r => setTimeout(r, 900));
    scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/unified-bg-mobile-slide-1.png', Buffer.from(scr.data, 'base64'));
    console.log('Saved unified-bg-mobile-slide-1.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

