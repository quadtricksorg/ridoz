import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9341;
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    const ws = new (await import('ws')).default(tabs[0].webSocketDebuggerUrl);
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
          document.body.innerHTML = \`
            <main style="overflow-x: clip; height: 4000px;">
              <div id="hero" style="height: 800px; background: #eee;">Hero</div>
              <div id="track" style="height: 2000px; background: #ddd;">
                <div id="sticky" style="position: sticky; top: 0; height: 600px; background: #ccc;">Sticky Slider</div>
              </div>
              <div id="marquee" style="height: 1000px; background: #bbb;">Marquee</div>
            </main>
          \`;
          window.scrollTo(0, 1200);
          const r = document.getElementById('sticky').getBoundingClientRect();
          return {
            scrollY: window.scrollY,
            stickyTop: r.top,
            stickyHeight: r.height,
            isLockedToViewportTop: r.top === 0
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Sticky test result:', result.result.value);

    // Now test with overflow-x: hidden on main
    const resultHidden = await send('Runtime.evaluate', {
      expression: `
        (() => {
          document.querySelector('main').style.overflowX = 'hidden';
          window.scrollTo(0, 1200);
          const r = document.getElementById('sticky').getBoundingClientRect();
          return {
            overflowX: document.querySelector('main').style.overflowX,
            stickyTop: r.top,
            isLockedToViewportTop: r.top === 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Sticky test with overflow-x: hidden:', resultHidden.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();

