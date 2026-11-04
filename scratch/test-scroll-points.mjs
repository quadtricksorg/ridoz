import { spawn } from 'child_process';

async function testScrollPoints() {
  const p = 9552;
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

    const checkActive = async (label) => {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const links = Array.from(document.querySelectorAll('header nav[aria-label="Primary"] a'));
            const active = links.find(a => a.querySelector('.font-semibold.text-foreground'));
            const srOnly = active?.querySelector('.sr-only')?.textContent;
            return {
              label: '${label}',
              scrollY: window.scrollY,
              activeLink: srOnly || null
            };
          })()
        `,
        returnByValue: true
      });
      console.log(res.result.value);
    };

    const scrollTargets = [
      { name: 'Top (Drop)', y: 0 },
      { name: 'Designs start', y: 950 },
      { name: 'Designs slide 2', y: 1800 },
      { name: 'Designs slide 4', y: 3500 },
      { name: 'Shop start', y: 5000 },
      { name: 'Collections start', y: 5600 },
      { name: 'Reviews start', y: 6700 },
      { name: 'Contact (Bottom)', y: 7400 },
      // Reverse scroll
      { name: 'Back up to Reviews', y: 6700 },
      { name: 'Back up to Collections', y: 5600 },
      { name: 'Back up to Shop', y: 5000 },
      { name: 'Back up to Designs', y: 2000 },
      { name: 'Back up to Drop', y: 0 }
    ];

    for (const t of scrollTargets) {
      await send('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${t.y}, behavior: 'instant' }); window.dispatchEvent(new Event('scroll'));`
      });
      await new Promise(r => setTimeout(r, 250));
      await checkActive(t.name);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

testScrollPoints().catch(console.error);

