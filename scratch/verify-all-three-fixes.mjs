import { spawn } from 'child_process';
import fs from 'fs';

async function verify() {
  const p = 9477;
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    `--remote-debugging-port=${p}`,
    '--headless=new',
    'http://localhost:8081/?no_intro=1'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2200));
    const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
    const tab = res.find(t => t.url.includes('localhost:8081'));
    const ws = new (await import('ws')).default(tab.webSocketDebuggerUrl);
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

    // Test 1: Desktop 1440x900 hero measurements
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise(r => setTimeout(r, 800));

    let m1440 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo(0, 0);
          const hero = document.getElementById('drop');
          const circle = hero.querySelector('.rounded-full.shadow-2xl');
          const hr = hero.getBoundingClientRect();
          const cr = circle ? circle.getBoundingClientRect() : null;
          return {
            viewport: '1440x900',
            heroHeight: hr.height,
            heroBottom: hr.bottom,
            circleTop: cr?.top,
            circleBottom: cr?.bottom,
            circleHeight: cr?.height,
            circleBottomMargin: cr ? hr.bottom - cr.bottom : null,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('MEASURE 1440x900:', m1440.result.value);

    let scr1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/hero-1440x900.png', Buffer.from(scr1.data, 'base64'));

    // Test 2: Laptop 1366x768 hero measurements
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise(r => setTimeout(r, 800));

    let m1366 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo(0, 0);
          const hero = document.getElementById('drop');
          const circle = hero.querySelector('.rounded-full.shadow-2xl');
          const hr = hero.getBoundingClientRect();
          const cr = circle ? circle.getBoundingClientRect() : null;
          return {
            viewport: '1366x768',
            heroHeight: hr.height,
            heroBottom: hr.bottom,
            circleTop: cr?.top,
            circleBottom: cr?.bottom,
            circleHeight: cr?.height,
            circleBottomMargin: cr ? hr.bottom - cr.bottom : null,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('MEASURE 1366x768:', m1366.result.value);

    let scr2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/hero-1366x768.png', Buffer.from(scr2.data, 'base64'));

    // Test 3: Windows 1080p scaled (1536x864)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 864,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise(r => setTimeout(r, 800));

    let m1536 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo(0, 0);
          const hero = document.getElementById('drop');
          const circle = hero.querySelector('.rounded-full.shadow-2xl');
          const hr = hero.getBoundingClientRect();
          const cr = circle ? circle.getBoundingClientRect() : null;
          return {
            viewport: '1536x864',
            heroHeight: hr.height,
            heroBottom: hr.bottom,
            circleTop: cr?.top,
            circleBottom: cr?.bottom,
            circleHeight: cr?.height,
            circleBottomMargin: cr ? hr.bottom - cr.bottom : null,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('MEASURE 1536x864:', m1536.result.value);

    // Test 4: Check Showcase Slider
    // 4A: Verify "Next:" sliver peek pill is completely absent
    // 4B: Verify colors on Slide 0 and Slide 4 (Terra - Image 3)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const showcase = document.getElementById('showcase-slider');
          if (showcase) {
            showcase.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    let showcaseCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const nextPill = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('Next:'));
          // Check slide 0 card colors
          const cards = document.querySelectorAll('#showcase-slider h3');
          const buttons = document.querySelectorAll('#showcase-slider a');
          const tagSpans = document.querySelectorAll('#showcase-slider span.tracking-\\\\[0\\\\.25em\\\\]');
          
          return {
            hasNextPill: !!nextPill,
            cardCount: cards.length,
            firstCardTitle: cards[0]?.textContent?.trim(),
            firstCardColor: cards[0] ? window.getComputedStyle(cards[0]).color : null,
            firstButtonBg: buttons[0] ? window.getComputedStyle(buttons[0]).backgroundColor : null,
            firstButtonColor: buttons[0] ? window.getComputedStyle(buttons[0]).color : null,
            firstTagColor: tagSpans[0] ? window.getComputedStyle(tagSpans[0]).color : null,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('SHOWCASE SLIDE 0 CHECK:', showcaseCheck.result.value);

    let scrShowcase0 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/showcase-slide0.png', Buffer.from(scrShowcase0.data, 'base64'));

    // Now navigate to Slide 4 (Terra / Rose Clay) using the 5th dot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const dots = document.querySelectorAll('[role="tab"]');
          if (dots[4]) dots[4].click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    let slide4Check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('#showcase-slider h3');
          const buttons = document.querySelectorAll('#showcase-slider a');
          const tagSpans = document.querySelectorAll('#showcase-slider span.tracking-\\\\[0\\\\.25em\\\\]');
          return {
            slide4Title: cards[4]?.textContent?.trim(),
            slide4TitleColor: cards[4] ? window.getComputedStyle(cards[4]).color : null,
            slide4ButtonBg: buttons[4] ? window.getComputedStyle(buttons[4]).backgroundColor : null,
            slide4ButtonColor: buttons[4] ? window.getComputedStyle(buttons[4]).color : null,
            slide4TagColor: tagSpans[4] ? window.getComputedStyle(tagSpans[4]).color : null,
          };
        })()
      `,
      returnByValue: true
    });
    console.log('SHOWCASE SLIDE 4 (TERRA) CHECK:', slide4Check.result.value);

    let scrShowcase4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('verification-screenshots/showcase-slide4-terra.png', Buffer.from(scrShowcase4.data, 'base64'));

    ws.close();
  } finally {
    chrome.kill();
  }
}

verify().catch(console.error);

