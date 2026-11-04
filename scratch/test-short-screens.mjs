import { spawn } from 'child_process';

async function testShortScreens() {
  const p = 9562;
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
        if (m.id === cur) { ws.off('message', h); resolve(m); }
      };
      ws.on('message', h);
      ws.send(JSON.stringify({ id: cur, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll to designs
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.getElementById('designs').offsetTop, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`
    });
    await new Promise(r => setTimeout(r, 600));

    for (const h of [600, 700, 900]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: 1024,
        height: h,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await new Promise(r => setTimeout(r, 400));

      const evalRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const h3 = Array.from(document.querySelectorAll('#showcase-slider h3')).find(el => el.textContent.includes('Lilac') || el.textContent.includes('Wirefree'));
            const card = h3?.closest('.rounded-2xl, .rounded-3xl');
            const img = document.querySelector('#showcase-slider img');
            const btns = Array.from(document.querySelectorAll('#showcase-slider a')).filter(a => a.textContent.includes('Shop This Look'));
            const floatBtn = btns.find(b => b.parentElement?.classList.contains('hidden') || b.parentElement?.className.includes('sm:block'));

            const cr = card?.getBoundingClientRect();
            const ir = img?.getBoundingClientRect();
            const fr = floatBtn?.getBoundingClientRect();

            let overlaps = false;
            if (cr && ir) {
              const noX = cr.right <= ir.left || cr.left >= ir.right;
              const noY = cr.bottom <= ir.top || cr.top >= ir.bottom;
              overlaps = !(noX || noY);
            }

            return JSON.stringify({
              h: window.innerHeight,
              card: cr ? { l: Math.round(cr.left), r: Math.round(cr.right), t: Math.round(cr.top), b: Math.round(cr.bottom) } : null,
              img: ir ? { l: Math.round(ir.left), r: Math.round(ir.right), t: Math.round(ir.top), b: Math.round(ir.bottom) } : null,
              overlaps
            });
          })()
        `,
        returnByValue: true
      });

      console.log(`Height ${h}:`, evalRes.result?.value);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

testShortScreens().catch(console.error);

