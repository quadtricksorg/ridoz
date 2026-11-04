import { spawn } from 'child_process';
import fs from 'fs';

async function testActiveNav() {
  const p = 9548;
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

    const getActiveDesktopNav = async () => {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.querySelector('header nav[aria-label="Primary"]');
            if (!nav) return null;
            const links = Array.from(nav.querySelectorAll('a'));
            const active = links.find(a => {
              const span = a.querySelector('span');
              return a.innerHTML.includes('active-nav-indicator') || (span && span.className.includes('font-semibold text-foreground'));
            });
            return {
              activeText: active ? active.textContent.trim() : null,
              scrollY: window.scrollY
            };
          })()
        `,
        returnByValue: true
      });
      return res.result.value;
    };

    console.log('1. Initial desktop active nav:', await getActiveDesktopNav());

    // Click Designs
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const a = Array.from(document.querySelectorAll('header nav[aria-label="Primary"] a')).find(x => x.textContent.includes('Designs'));
          if (a) a.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));
    console.log('2. After clicking Designs:', await getActiveDesktopNav());

    // Scroll further into Designs
    await send('Runtime.evaluate', { expression: `window.scrollBy({ top: 1200, behavior: 'instant' })` });
    await new Promise(r => setTimeout(r, 400));
    console.log('3. Inside Designs middle slide:', await getActiveDesktopNav());

    // Scroll to Shop
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const shop = document.getElementById('shop');
          shop?.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('4. At Shop section:', await getActiveDesktopNav());

    // Scroll to Collections
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const col = document.getElementById('collections');
          col?.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('5. At Collections section:', await getActiveDesktopNav());

    // Scroll to Reviews
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const rev = document.getElementById('reviews');
          rev?.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('6. At Reviews section:', await getActiveDesktopNav());

    // Scroll to Contact
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('7. At bottom (Contact):', await getActiveDesktopNav());

    // Scroll back up to Collections
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const col = document.getElementById('collections');
          col?.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('8. Scrolled back up to Collections:', await getActiveDesktopNav());

    // Scroll back up to Designs
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const d = document.getElementById('designs');
          window.scrollTo({ top: d.offsetTop + 500, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('9. Scrolled back up to Designs:', await getActiveDesktopNav());

    // Scroll back up to top (Drop)
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, behavior: 'instant' })`
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('10. Scrolled back up to top (Drop):', await getActiveDesktopNav());

    // TEST MOBILE
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise(r => setTimeout(r, 500));

    // Open mobile menu
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('header button[aria-label="Open menu"]');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    const getActiveMobileNav = async () => {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nav = document.querySelector('header nav[aria-label="Mobile"]');
            if (!nav) return null;
            const links = Array.from(nav.querySelectorAll('a'));
            const active = links.find(a => a.className.includes('bg-accent/30') || a.className.includes('font-semibold'));
            return {
              activeText: active ? active.textContent.trim() : null
            };
          })()
        `,
        returnByValue: true
      });
      return res.result.value;
    };

    console.log('11. Mobile menu at top:', await getActiveMobileNav());

    // Close menu, scroll to shop, open menu
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('header button[aria-label="Close menu"]');
          if (btn) btn.click();
          const shop = document.getElementById('shop');
          shop?.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('header button[aria-label="Open menu"]');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    console.log('12. Mobile menu at Shop:', await getActiveMobileNav());

    ws.close();
  } finally {
    chrome.kill();
  }
}

testActiveNav().catch(console.error);

