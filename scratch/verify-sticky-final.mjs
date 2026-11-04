import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9350;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-stk-final-' + Date.now());
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

    console.log('--- 1. DESKTOP TEST: SECTION LOCKING & CONTROLLED SCROLL SPEED ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Initial position: Hero section
    let checkHero = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const rect = slider.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            trackHeight: track.offsetHeight,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Initial state (Hero):', checkHero.result.value);

    // 2. Scroll until slider reaches top of viewport -> IT LOCKS!
    console.log('Scrolling to lock slider at viewport top...');
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
    await new Promise(r => setTimeout(r, 400));

    let checkLocked = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          const dots = Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            isLockedToTop: Math.abs(rect.top) <= 2,
            dots,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Slider locked state:', checkLocked.result.value);

    // 3. Scroll halfway through the track (Slide 2/3)
    console.log('Scrolling through track to middle slide (reduced scroll speed)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          const scrollDistance = track.offsetHeight - window.innerHeight;
          // Scroll to 50% (slide 3)
          window.scrollTo({ top: trackTop + scrollDistance * 0.5, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    let checkMiddle = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          const dots = Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            isStillLocked: Math.abs(rect.top) <= 2,
            dots,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Mid-track locked state:', checkMiddle.result.value);

    // 4. Scroll to end of track (Slide 5)
    console.log('Scrolling to end of track (Slide 5)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          const scrollDistance = track.offsetHeight - window.innerHeight;
          window.scrollTo({ top: trackTop + scrollDistance, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    let checkEnd = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          const dots = Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            dots,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('End-of-track state (Slide 5):', checkEnd.result.value);

    // 5. Scroll PAST the track -> Unpins and goes to next section (Marquee)!
    console.log('Scrolling past track into next section (Marquee)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const track = slider.parentElement;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          const scrollDistance = track.offsetHeight - window.innerHeight;
          window.scrollTo({ top: trackTop + scrollDistance + 400, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    let checkMarquee = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            unpinnedAndScrolledPast: rect.top < 0,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Past-track state (Next section):', checkMarquee.result.value);

    // 6. Scroll BACK UP -> Locks in reverse, returns to Hero!
    console.log('Scrolling back up past track into Hero...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    let checkBackHero = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            backAtHero: window.scrollY === 0,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Back at Hero state:', checkBackHero.result.value);

    console.log('\n--- 2. MOBILE TEST: VERTICAL TOUCH SCROLL IN MOBILE PREVIEW ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 1,
    });

    // Scroll to slider track on mobile
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
    await new Promise(r => setTimeout(r, 400));

    let checkMobileLocked = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            isLockedOnMobile: Math.abs(rect.top) <= 2,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile locked state:', checkMobileLocked.result.value);

    // Mobile scroll down through track
    console.log('Mobile scrolling down 1000px...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollBy({ top: 1000, behavior: 'instant' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    let checkMobileScrolled = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const rect = slider.getBoundingClientRect();
          const dots = Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
          return {
            scrollY: window.scrollY,
            sliderTop: rect.top,
            isStillLockedOnMobile: Math.abs(rect.top) <= 2,
            dots,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile scrolled state:', checkMobileScrolled.result.value);

    // Take screenshot of mobile sticky locked slide
    const mobileSnap = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/mobile-sticky-locked.png', Buffer.from(mobileSnap.data, 'base64'));
    console.log('Captured verification-screenshots/mobile-sticky-locked.png');

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
}

run();

