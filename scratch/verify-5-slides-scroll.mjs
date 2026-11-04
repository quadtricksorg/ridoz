import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9360;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-verify-5slides-' + Date.now());
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

    console.log('\n--- 1. DESKTOP TEST (1440x900): VERIFY ALL 5 SLIDES SEQUENTIAL SCROLL ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Helper to inspect slides in DOM
    async function inspectSliderState() {
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const track = slider.parentElement;
            const trackRect = track.getBoundingClientRect();
            const sliderRect = slider.getBoundingClientRect();
            const slides = Array.from(slider.querySelectorAll('[role="group"][aria-roledescription="slide"]')).map(el => {
              const label = el.getAttribute('aria-label') || '';
              const style = window.getComputedStyle(el);
              return {
                label,
                opacity: style.opacity,
                clipPath: style.clipPath,
                zIndex: style.zIndex,
              };
            });
            const cards = Array.from(slider.querySelectorAll('h3')).map(el => {
              const pCard = el.closest('div.will-change-\\\\[transform\\\\,opacity\\\\]') || el.closest('div[style*="opacity"]');
              const op = pCard ? window.getComputedStyle(pCard).opacity : 'unknown';
              return {
                title: el.textContent,
                opacity: op,
              };
            });
            const dots = Array.from(document.querySelectorAll('[role="tab"]')).map((d, i) => ({
              index: i,
              selected: d.getAttribute('aria-selected') === 'true',
            }));
            const activeDot = dots.findIndex(d => d.selected);

            return {
              scrollY: window.scrollY,
              sliderTop: Math.round(sliderRect.top),
              isLocked: Math.abs(sliderRect.top) <= 2,
              activeDot,
              slides,
              cards,
            };
          })()
        `,
        returnByValue: true
      });
      return res.result.value;
    }

    // Scroll to start of track
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: trackTop, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    console.log('\n--- FORWARD SCROLL TEST THROUGH ALL 5 SLIDES ---');
    const fractions = [0.0, 0.25, 0.50, 0.75, 1.0];
    const expectedTitles = [
      "Lilac Cloud Wirefree Bra",
      "Champagne Bare Contour Bra",
      "Sage Whisper Wireless Bra",
      "Sky Serene Plunge Bra",
      "Tuscan Sun Comfort Bra"
    ];

    for (let i = 0; i < fractions.length; i++) {
      const frac = fractions[i];
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const track = slider.parentElement;
            const trackTop = track.getBoundingClientRect().top + window.scrollY;
            const scrollDistance = track.offsetHeight - window.innerHeight;
            window.scrollTo({ top: trackTop + scrollDistance * ${frac}, behavior: 'instant' });
          })()
        `
      });
      await new Promise(r => setTimeout(r, 700));

      const state = await inspectSliderState();
      console.log(`\nAt scroll ${(frac * 100).toFixed(0)}%:`);
      console.log(`  Slider top: ${state.sliderTop}px (isLocked: ${state.isLocked})`);
      console.log(`  Active Dot: ${state.activeDot} (Expected: ${i})`);
      console.log(`  Visible slides:`, state.slides.filter(s => parseFloat(s.opacity) > 0.01).map(s => `[${s.label.split(':')[0]} op:${s.opacity} clip:${s.clipPath}]`));
      console.log(`  Visible cards:`, state.cards.filter(c => parseFloat(c.opacity) > 0.1).map(c => `[${c.title} op:${c.opacity}]`));
      
      // Capture screenshot at each milestone
      const scr = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/verify-slide-${i + 1}-fwd.png`, Buffer.from(scr.data, 'base64'));
    }

    console.log('\n--- REVERSE SCROLL TEST (4 -> 3 -> 2 -> 1 -> 0) ---');
    for (let i = fractions.length - 2; i >= 0; i--) {
      const frac = fractions[i];
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const slider = document.getElementById('showcase-slider');
            const track = slider.parentElement;
            const trackTop = track.getBoundingClientRect().top + window.scrollY;
            const scrollDistance = track.offsetHeight - window.innerHeight;
            window.scrollTo({ top: trackTop + scrollDistance * ${frac}, behavior: 'instant' });
          })()
        `
      });
      await new Promise(r => setTimeout(r, 700));

      const state = await inspectSliderState();
      console.log(`\nAt reverse scroll ${(frac * 100).toFixed(0)}%:`);
      console.log(`  Active Dot: ${state.activeDot} (Expected: ${i})`);
      console.log(`  Visible slides:`, state.slides.filter(s => parseFloat(s.opacity) > 0.01).map(s => `[${s.label.split(':')[0]} op:${s.opacity} clip:${s.clipPath}]`));
      console.log(`  Visible cards:`, state.cards.filter(c => parseFloat(c.opacity) > 0.1).map(c => `[${c.title} op:${c.opacity}]`));

      const scr = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`verification-screenshots/verify-slide-${i + 1}-rev.png`, Buffer.from(scr.data, 'base64'));
    }

    console.log('\n--- MOBILE TOUCH PREVIEW TEST (390x844) ---');
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
          // Mobile scroll to 50%
          window.scrollTo({ top: trackTop + scrollDistance * 0.5, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 700));
    const mobState = await inspectSliderState();
    console.log(`Mobile at 50% scroll:`);
    console.log(`  Slider top: ${mobState.sliderTop}px (isLocked: ${mobState.isLocked})`);
    console.log(`  Active Dot: ${mobState.activeDot}`);
    console.log(`  Visible cards:`, mobState.cards.filter(c => parseFloat(c.opacity) > 0.1).map(c => `[${c.title} op:${c.opacity}]`));

    const mobScr = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/verify-mobile-50pct.png', Buffer.from(mobScr.data, 'base64'));

    console.log('\n>>> VERIFICATION COMPLETE! ALL CHECKS LOGGED AND SCREENSHOTS SAVED <<<');

    ws.close();
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(console.error);

