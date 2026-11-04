import { spawn } from 'child_process';
import fs from 'fs';

async function testDesignsClick() {
  const p = 9544;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/?no_intro=1'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2200));
    const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
    const tab = res.find(t => t.url.includes('localhost:8081'));
    const { default: WS } = await import('ws');
    const ws = new WS(tab.webSocketDebuggerUrl);
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
    await new Promise(r => setTimeout(r, 2500));

    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise(r => setTimeout(r, 500));

    // Click "Designs" link
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const designsLink = Array.from(document.querySelectorAll('header nav a')).find(a => a.textContent.includes('Designs'));
          if (designsLink) designsLink.click();
        })()
      `
    });
    // Wait for smooth scroll animation to finish
    await new Promise(r => setTimeout(r, 1200));

    let check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const designs = document.getElementById('designs');
          const sticky = document.getElementById('showcase-slider');
          const dr = designs?.getBoundingClientRect();
          const sr = sticky?.getBoundingClientRect();
          return {
            windowY: window.scrollY,
            designsTop: dr?.top,
            stickyTop: sr?.top,
            stickyHeight: sr?.height
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DESIGNS NAV CLICK POSITION:', check.result.value);

    let scr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/designs-nav-clicked.png', Buffer.from(scr.data, 'base64'));

    ws.close();
  } finally {
    chrome.kill();
  }
}

testDesignsClick().catch(console.error);

