import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TEMP_PROFILE = path.join(process.env.TEMP || 'C:/temp', 'chrome-verify-issues-' + Date.now());

async function run() {
  const port = 9336;
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${TEMP_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=390,844',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1800));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;

    const ws = new (await import('ws')).default(wsUrl);
    await new Promise((res, rej) => {
      ws.on('open', res);
      ws.on('error', rej);
    });

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

    console.log('--- TEST 1: ISSUE 2 (TOUCH SCROLL IN MOBILE PREVIEW) ---');
    // Emulate iPhone mobile viewport
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

    await send('Page.navigate', { url: 'http://localhost:8081/showcase' });
    await new Promise(r => setTimeout(r, 2200));

    // Verify initial slide is 0
    let dots = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
      `,
      returnByValue: true,
    });
    console.log('Initial mobile dots:', dots.result.value);

    // Perform pointer/touch drag UP (y: 550 -> 250)
    console.log('Performing touch drag UP in mobile preview...');
    await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        const rect = slider.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height * 0.7;
        const endY = rect.top + rect.height * 0.2;

        // Dispatch pointerdown
        slider.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true,
          clientX: startX,
          clientY: startY,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
        }));

        // Move in steps
        for (let i = 1; i <= 10; i++) {
          const curY = startY + (endY - startY) * (i / 10);
          window.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true,
            clientX: startX,
            clientY: curY,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
          }));
        }

        // Pointerup
        window.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          clientX: startX,
          clientY: endY,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
        }));
      `
    });

    await new Promise(r => setTimeout(r, 900));

    dots = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
      `,
      returnByValue: true,
    });
    console.log('Mobile dots after touch drag UP:', dots.result.value);
    const advancedToNext = dots.result.value[1] === 'true';
    console.log('Touch scroll in mobile preview advanced to Slide 2:', advancedToNext ? 'PASS ✓' : 'FAIL ✗');

    console.log('\n--- TEST 2: ISSUE 1 (PARTIALLY VISIBLE VS COMPLETELY VISIBLE) ---');
    // Set to desktop 1440x900
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll page so showcase-slider is only PARTIALLY visible (e.g. rect.top = 400)
    await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        const rect = slider.getBoundingClientRect();
        // Scroll so top of slider is at y = 450 (partially visible)
        window.scrollTo(0, window.scrollY + rect.top - 450);
      `
    });
    await new Promise(r => setTimeout(r, 400));

    const partialRect = await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        const r = slider.getBoundingClientRect();
        ({ top: r.top, bottom: r.bottom });
      `,
      returnByValue: true,
    });
    console.log('Partially visible slider rect:', partialRect.result.value);

    // Dispatch wheel event on the partially visible slider
    console.log('Dispatching wheel event on partially visible slider...');
    await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        slider.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 }));
      `
    });
    await new Promise(r => setTimeout(r, 500));

    let dotsPartial = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
      `,
      returnByValue: true,
    });
    console.log('Dots after wheel on partially visible slider:', dotsPartial.result.value);
    const remainedOnSlide0 = dotsPartial.result.value[0] === 'true';
    console.log('Did NOT animate while partially visible:', remainedOnSlide0 ? 'PASS ✓' : 'FAIL ✗');

    // Now scroll until the section is COMPLETELY visible (rect.top <= 20)
    console.log('\nNow scrolling until section is COMPLETELY visible...');
    await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        slider.scrollIntoView({ behavior: 'instant', block: 'start' });
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const completeRect = await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        const r = slider.getBoundingClientRect();
        ({ top: r.top, bottom: r.bottom });
      `,
      returnByValue: true,
    });
    console.log('Completed visible slider rect:', completeRect.result.value);

    // Dispatch wheel event on completely visible slider
    console.log('Dispatching wheel event on completely visible slider...');
    await send('Runtime.evaluate', {
      expression: `
        const slider = document.getElementById('showcase-slider');
        slider.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 }));
      `
    });
    await new Promise(r => setTimeout(r, 800));

    let dotsComplete = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[role="tab"]')).map(d => d.getAttribute('aria-selected'));
      `,
      returnByValue: true,
    });
    console.log('Dots after wheel on completely visible slider:', dotsComplete.result.value);
    const animatedWhenComplete = dotsComplete.result.value[1] === 'true';
    console.log('Animated cleanly when completely visible:', animatedWhenComplete ? 'PASS ✓' : 'FAIL ✗');

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(TEMP_PROFILE, { recursive: true, force: true }); } catch {}
  }
}

run();

