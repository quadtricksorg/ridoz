import { spawn } from 'child_process';

async function testDiagnostic() {
  const p = 9550;
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

    // Inspect sections rect.top
    const getRects = async () => {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const links = ["drop", "designs", "shop", "collections", "reviews", "contact"];
            const rects = links.map(l => {
              const el = document.getElementById(l);
              return {
                id: l,
                exists: !!el,
                top: el ? el.getBoundingClientRect().top : null,
                offsetTop: el ? el.offsetTop : null,
                height: el ? el.getBoundingClientRect().height : null
              };
            });
            const primaryLinks = Array.from(document.querySelectorAll('header nav[aria-label="Primary"] a')).map(a => {
              return {
                text: a.querySelector('.sr-only')?.textContent || a.textContent.trim(),
                hasIndicator: !!a.querySelector('span[style*="position"], .bg-foreground, [class*="layoutId"]') || a.innerHTML.includes('active-nav-indicator'),
                html: a.innerHTML
              };
            });
            return {
              scrollY: window.scrollY,
              rects,
              primaryLinks
            };
          })()
        `,
        returnByValue: true
      });
      return res.result.value;
    };

    console.log('Rects at 0:', JSON.stringify(await getRects(), null, 2));

    // Scroll to 2000
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 2000, behavior: 'instant' })` });
    // Dispatch scroll event manually if needed to verify
    await send('Runtime.evaluate', { expression: `window.dispatchEvent(new Event('scroll'))` });
    await new Promise(r => setTimeout(r, 500));
    console.log('Rects at 2000:', JSON.stringify(await getRects(), null, 2));

    // Scroll to Shop
    await send('Runtime.evaluate', { expression: `document.getElementById('shop')?.scrollIntoView({ behavior: 'instant', block: 'start' }); window.dispatchEvent(new Event('scroll'));` });
    await new Promise(r => setTimeout(r, 500));
    console.log('Rects at Shop:', JSON.stringify(await getRects(), null, 2));

    ws.close();
  } finally {
    chrome.kill();
  }
}

testDiagnostic().catch(console.error);

