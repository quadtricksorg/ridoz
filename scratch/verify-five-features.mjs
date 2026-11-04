import { spawn } from 'child_process';

async function verify() {
  const p = 9533;
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

    // Test Men click
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const menCard = Array.from(document.querySelectorAll('#collections a')).find(a => a.getAttribute('aria-label')?.includes('Men'));
          if (menCard) menCard.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    let menCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeFilterPill = document.querySelector('#shop button[aria-pressed="true"]');
          const products = Array.from(document.querySelectorAll('#shop h3')).map(h => h.textContent);
          return {
            activeFilter: activeFilterPill?.textContent?.trim(),
            productCount: products.length,
            products: products
          };
        })()
      `,
      returnByValue: true
    });
    console.log('MEN FILTER RESULT:', menCheck.result.value);

    // Test Women click
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const womenCard = Array.from(document.querySelectorAll('#collections a')).find(a => a.getAttribute('aria-label')?.includes('Women'));
          if (womenCard) womenCard.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    let womenCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeFilterPill = document.querySelector('#shop button[aria-pressed="true"]');
          const products = Array.from(document.querySelectorAll('#shop h3')).map(h => h.textContent);
          return {
            activeFilter: activeFilterPill?.textContent?.trim(),
            productCount: products.length,
            products: products
          };
        })()
      `,
      returnByValue: true
    });
    console.log('WOMEN FILTER RESULT:', womenCheck.result.value);

    ws.close();
  } finally {
    chrome.kill();
  }
}

verify().catch(console.error);
