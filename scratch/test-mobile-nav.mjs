import { spawn } from 'child_process';

async function testMobile() {
  const p = 9554;
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
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise(r => setTimeout(r, 500));

    const checkMobileActive = async (label) => {
      // Open menu
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.querySelector('header button[aria-label="Open menu"]');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 300));

      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.querySelector('header nav[aria-label="Mobile"]');
            if (!nav) return { error: 'nav not open' };
            const links = Array.from(nav.querySelectorAll('a'));
            const active = links.find(a => a.className.includes('bg-accent/30'));
            const activeDot = links.find(a => !!a.querySelector('.rounded-full.bg-primary'));
            return {
              label: '${label}',
              scrollY: window.scrollY,
              activeText: active?.querySelector('span')?.textContent,
              hasDot: !!activeDot
            };
          })()
        `,
        returnByValue: true
      });
      console.log(res.result.value);

      // Close menu
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.querySelector('header button[aria-label="Close menu"]');
            if (btn) btn.click();
          })()
        `
      });
      await new Promise(r => setTimeout(r, 300));
    };

    await checkMobileActive('1. Top (Drop)');

    // Scroll to Designs
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 1200, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`
    });
    await new Promise(r => setTimeout(r, 300));
    await checkMobileActive('2. Designs');

    // Scroll to Shop
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const shop = document.getElementById('shop');
          window.scrollTo({ top: shop.offsetTop, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await checkMobileActive('3. Shop');

    // Scroll to Collections
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const col = document.getElementById('collections');
          window.scrollTo({ top: col.offsetTop, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await checkMobileActive('4. Collections');

    // Scroll to Contact
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));
    await checkMobileActive('5. Contact');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testMobile().catch(console.error);

