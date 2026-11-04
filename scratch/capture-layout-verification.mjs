import { spawn } from 'child_process';
import fs from 'fs';

async function captureVerification() {
  const p = 9556;
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

    fs.mkdirSync('verification-screenshots', { recursive: true });

    // Sizes to test
    const viewports = [
      { name: 'mobile-390', w: 390, h: 844, isMobile: true },
      { name: 'tablet-768', w: 768, h: 900, isMobile: false },
      { name: 'laptop-1024', w: 1024, h: 768, isMobile: false },
      { name: 'desktop-1440', w: 1440, h: 900, isMobile: false },
    ];

    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.isMobile,
      });
      await new Promise(r => setTimeout(r, 400));

      // Scroll to designs section
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const designs = document.getElementById('designs');
            if (designs) window.scrollTo({ top: designs.offsetTop, behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
          })()
        `
      });
      await new Promise(r => setTimeout(r, 700));

      // Measure layout bounds of card, bra, and right button
      const bounds = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const card = document.querySelector('header ~ main #showcase-slider div.rounded-2xl, header ~ main #showcase-slider div.rounded-3xl');
            const cardParent = card?.closest('div[style*="pointer-events"]');
            const floatingBtn = Array.from(document.querySelectorAll('header ~ main #showcase-slider a')).find(a => a.textContent.includes('Shop This Look') && a.closest('.hidden.sm\\:block'));
            const braImg = document.querySelector('header ~ main #showcase-slider img');
            const cr = cardParent?.getBoundingClientRect();
            const fr = floatingBtn?.getBoundingClientRect();
            const br = braImg?.getBoundingClientRect();
            return {
              windowW: window.innerWidth,
              windowH: window.innerHeight,
              card: cr ? { left: cr.left, right: cr.right, top: cr.top, bottom: cr.bottom, width: cr.width } : null,
              floatingBtn: fr ? { left: fr.left, right: fr.right, top: fr.top, bottom: fr.bottom, width: fr.width } : null,
              bra: br ? { left: br.left, right: br.right, top: br.top, bottom: br.bottom, width: br.width } : null,
            };
          })()
        `,
        returnByValue: true
      });
      console.log(`Viewport ${vp.name}:`, bounds.result.value);

      const scr = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-slide1.png`, Buffer.from(scr.data, 'base64'));

      // Also advance to slide 5 (Terra - the one from user's image) and capture
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const tabs = Array.from(document.querySelectorAll('div[role="tablist"] button[role="tab"]'));
            if (tabs[4]) tabs[4].click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 800));

      const scrTerra = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/${vp.name}-slide5-terra.png`, Buffer.from(scrTerra.data, 'base64'));
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

captureVerification().catch(console.error);

