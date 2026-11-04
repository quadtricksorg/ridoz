import { spawn } from 'child_process';

async function measure() {
  const p = 9558;
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

    for (const w of [390, 640, 768, 1024, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 800,
        deviceScaleFactor: 1,
        mobile: w < 640,
      });
      await new Promise(r => setTimeout(r, 400));

      // Scroll to designs
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const designs = document.getElementById('designs');
            if (designs) window.scrollTo({ top: designs.offsetTop, behavior: 'instant' });
            window.dispatchEvent(new Event('scroll'));
          })()
        `
      });
      await new Promise(r => setTimeout(r, 500));

      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            // Find visible card (opacity > 0.5)
            const cards = Array.from(document.querySelectorAll('#showcase-slider .rounded-2xl, #showcase-slider .rounded-3xl'));
            const visibleCard = cards.find(c => {
              const rect = c.getBoundingClientRect();
              return rect.width > 50 && rect.height > 50;
            });
            const cr = visibleCard?.getBoundingClientRect();

            // Find visible bra image
            const imgs = Array.from(document.querySelectorAll('#showcase-slider img'));
            const visibleImg = imgs.find(img => img.getBoundingClientRect().width > 100);
            const ir = visibleImg?.getBoundingClientRect();

            // Find visible floating button
            const btns = Array.from(document.querySelectorAll('#showcase-slider a')).filter(a => a.textContent.includes('Shop This Look'));
            const floatingBtn = btns.find(b => {
              const r = b.getBoundingClientRect();
              return r.width > 50 && r.height > 20 && b.closest('.hidden.sm\\:block');
            });
            const fr = floatingBtn?.getBoundingClientRect();

            // Check if card overlaps bra
            let cardOverlapsBra = false;
            if (cr && ir) {
              const noOverlapX = cr.right <= ir.left || cr.left >= ir.right;
              const noOverlapY = cr.bottom <= ir.top || cr.top >= ir.bottom;
              cardOverlapsBra = !(noOverlapX || noOverlapY);
            }

            // Check if button overlaps bra
            let btnOverlapsBra = false;
            if (fr && ir) {
              const noOverlapX = fr.right <= ir.left || fr.left >= ir.right;
              const noOverlapY = fr.bottom <= ir.top || fr.top >= ir.bottom;
              btnOverlapsBra = !(noOverlapX || noOverlapY);
            }

            return {
              viewportWidth: window.innerWidth,
              card: cr ? { left: Math.round(cr.left), right: Math.round(cr.right), top: Math.round(cr.top), bottom: Math.round(cr.bottom), width: Math.round(cr.width) } : null,
              bra: ir ? { left: Math.round(ir.left), right: Math.round(ir.right), top: Math.round(ir.top), bottom: Math.round(ir.bottom), width: Math.round(ir.width) } : null,
              floatingBtn: fr ? { left: Math.round(fr.left), right: Math.round(fr.right), top: Math.round(fr.top), bottom: Math.round(fr.bottom) } : null,
              cardOverlapsBra,
              btnOverlapsBra
            };
          })()
        `,
        returnByValue: true
      });
      console.log(`Width ${w}px:`, res.result.value);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

measure().catch(console.error);

