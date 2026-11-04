import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9346;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-stk-' + Date.now());
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
    console.log('Target tab:', pageTab?.url);

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

    const result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const slider = document.getElementById('showcase-slider');
          const main = document.querySelector('main');
          return {
            hasSlider: !!slider,
            sliderParent: slider?.parentElement?.tagName,
            mainOverflowX: window.getComputedStyle(main).overflowX,
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Main evaluation:', result.result.value);

    // Now test inserting a sticky track and scrolling
    const stickyTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const main = document.querySelector('main');
          // test without modifying main.style.overflowX (keep current overflow-x: hidden)
          const track = document.createElement('div');
          track.id = 'test-track';
          track.style.cssText = 'height: 3000px; position: relative;';
          track.innerHTML = '<div id=\"stk-box\" style=\"position: sticky; top: 0; height: 500px; background: red;\">STICKY</div>';
          main.insertBefore(track, document.getElementById('showcase-slider'));

          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: trackTop + 800, behavior: 'instant' });

          const boxRect = document.getElementById('stk-box').getBoundingClientRect();
          const isStickyWorking = boxRect.top === 0;

          track.remove();
          return {
            trackTop,
            scrollY: window.scrollY,
            boxTop: boxRect.top,
            isStickyWorking,
            mainComputedOverflowX: window.getComputedStyle(main).overflowX
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Sticky test with overflowX clip:', stickyTest.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();
