import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9398;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-verify-dark-flowers-' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8081/?no_intro=1'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('localhost:8081'));
    console.log('Page tab found:', pageTab?.url);

    const ws = new (await import('ws')).default(pageTab.webSocketDebuggerUrl);
    await new Promise((res) => ws.on('open', res));

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((res) => {
        const id = msgId++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            ws.off('message', handler);
            res(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    // 1. Reset scroll restoration and scroll to 0
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
          window.scrollTo(0, 0);
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    console.log('\n--- 1. DESKTOP TEST: DARK PLAIN BACKGROUNDS & LOW-OPACITY FLOWERS ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const layout = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const rect = track.getBoundingClientRect();
          return {
            trackTop: Math.round(rect.top + window.scrollY),
            scrollDistance: track.offsetHeight - window.innerHeight,
          };
        })()
      `,
      returnByValue: true
    });
    const { trackTop, scrollDistance } = layout.result.value;
    console.log('Layout metrics from scroll 0:', { trackTop, scrollDistance });

    const fractions = [0.0, 0.25, 0.50, 0.75, 1.0];
    for (let i = 0; i < fractions.length; i++) {
      const frac = fractions[i];
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const targetY = ${trackTop} + ${scrollDistance} * ${frac};
            window.scrollTo({ top: targetY, behavior: 'instant' });
          })()
        `
      });
      await new Promise(r => setTimeout(r, 700));

      const info = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const flowerSvgs = Array.from(slider.querySelectorAll('div[class*="animate"] svg')).map(el => ({
              opacity: window.getComputedStyle(el.parentElement).opacity,
              fill: el.querySelector('g[fill]')?.getAttribute('fill') || el.querySelector('path[fill]')?.getAttribute('fill'),
            }));
            const activeCard = Array.from(slider.querySelectorAll('h3')).map(el => {
              const cardDiv = el.closest('div.will-change-\\\\[transform\\\\,opacity\\\\]');
              return {
                title: el.textContent.trim(),
                opacity: cardDiv ? window.getComputedStyle(cardDiv).opacity : '0',
              };
            }).filter(c => parseFloat(c.opacity) > 0.1);

            return {
              activeCard,
              flowerCount: flowerSvgs.length,
              sampleFlower: flowerSvgs[0],
            };
          })()
        `,
        returnByValue: true
      });
      console.log(`\nSlide ${i + 1} at ${(frac * 100).toFixed(0)}%:`, info.result.value);

      const scr = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/dark-plain-slide-${i + 1}.png`, Buffer.from(scr.data, 'base64'));
    }

    console.log('\n--- 2. MOBILE TEST (390x844): DARK SAGE SLIDE ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      hasTouch: true,
    });
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const targetY = ${trackTop} + ${scrollDistance} * 0.50;
          window.scrollTo({ top: targetY, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 700));
    const mobScr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`verification-screenshots/dark-plain-mobile-slide-3.png`, Buffer.from(mobScr.data, 'base64'));

    console.log('\n>>> VERIFICATION COMPLETE! ALL SCREENSHOTS SAVED <<<');

    ws.close();
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(console.error);
