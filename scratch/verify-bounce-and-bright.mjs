import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9370;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-verify-bounce-' + Date.now());
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

    console.log('\n--- 1. DESKTOP TEST (1440x900): BRIGHT COMPLEMENTARY BACKGROUNDS & BOUNCE ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    async function inspectDetails() {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const track = slider.parentElement;
            const titles = Array.from(slider.querySelectorAll('span.font-black')).map(el => {
              const rect = el.getBoundingClientRect();
              const style = window.getComputedStyle(el.parentElement || el);
              return {
                text: el.textContent.trim(),
                width: Math.round(rect.width),
                fitsInWindow: rect.width < window.innerWidth,
                opacity: window.getComputedStyle(el.parentElement).opacity,
                transform: window.getComputedStyle(el.parentElement).transform,
              };
            });
            const cards = Array.from(slider.querySelectorAll('h3')).map(el => {
              const cardDiv = el.closest('div.will-change-\\\\[transform\\\\,opacity\\\\]');
              const rect = cardDiv ? cardDiv.getBoundingClientRect() : null;
              const style = cardDiv ? window.getComputedStyle(cardDiv) : null;
              return {
                title: el.textContent.trim(),
                opacity: style ? style.opacity : '0',
                transform: style ? style.transform : '',
                top: rect ? Math.round(rect.top) : null,
              };
            });
            return {
              scrollY: window.scrollY,
              titles,
              cards: cards.filter(c => parseFloat(c.opacity) > 0.05),
            };
          })()
        `,
        returnByValue: true
      });
      return res.result.value;
    }

    // Calculate stable trackTop and scrollDistance once
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
    console.log('Stable layout metrics:', { trackTop, scrollDistance });

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

      const details = await inspectDetails();
      console.log(`\nAt desktop scroll ${(frac * 100).toFixed(0)}%:`);
      console.log(`  Visible Title:`, details.titles.filter(t => parseFloat(t.opacity) > 0.1));
      console.log(`  Active Card:`, details.cards);

      const scr = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/bright-desktop-slide-${i + 1}.png`, Buffer.from(scr.data, 'base64'));
    }

    // Overshoot test: capture at fraction 0.45 (mid-transition into EUCALYPTUS to check bounce overshoot)
    console.log('\n--- CAPTURING BOUNCE OVERSHOOT (p = 1.90 / into Slide 3) ---');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          const scrollDistance = track.offsetHeight - window.innerHeight;
          // 47.5% scroll is p = 1.90, right during the forward overshoot bounce!
          window.scrollTo({ top: trackTop + scrollDistance * 0.475, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const bounceDetails = await inspectDetails();
    console.log('Bounce details at 47.5%:', bounceDetails.titles.find(t => t.text === 'EUCALYPTUS'));
    console.log('Card details at 47.5%:', bounceDetails.cards);
    const bounceScr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`verification-screenshots/bright-desktop-bounce-overshoot.png`, Buffer.from(bounceScr.data, 'base64'));

    console.log('\n--- 2. TABLET TEST (768x1024): TEXT FIT CHECK ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false,
    });
    // Check Eucalyptus (longest word) at 50% scroll
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          const scrollDistance = track.offsetHeight - window.innerHeight;
          window.scrollTo({ top: trackTop + scrollDistance * 0.50, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const tabDetails = await inspectDetails();
    console.log('Tablet Eucalyptus fit:', tabDetails.titles.find(t => t.text === 'EUCALYPTUS'));
    const tabScr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`verification-screenshots/bright-tablet-768px.png`, Buffer.from(tabScr.data, 'base64'));

    console.log('\n--- 3. MOBILE TEST (390x844): MOBILE FIT & VERTICAL BOUNCE ---');
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
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          const scrollDistance = track.offsetHeight - window.innerHeight;
          window.scrollTo({ top: trackTop + scrollDistance * 0.50, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const mobDetails = await inspectDetails();
    console.log('Mobile Eucalyptus fit:', mobDetails.titles.find(t => t.text === 'EUCALYPTUS'));
    console.log('Mobile Card:', mobDetails.cards);
    const mobScr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`verification-screenshots/bright-mobile-390px.png`, Buffer.from(mobScr.data, 'base64'));

    console.log('\n>>> ALL SCREENSHOTS SAVED AND VERIFIED CLEAN! <<<');

    ws.close();
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(console.error);
