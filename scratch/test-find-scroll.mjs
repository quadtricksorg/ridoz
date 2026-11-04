import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9349;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-find-' + Date.now());
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
          const all = Array.from(document.querySelectorAll('*'));
          const scrollables = all.filter(el => {
            const cs = window.getComputedStyle(el);
            return (cs.overflowY === 'scroll' || cs.overflowY === 'auto' || cs.overflow === 'scroll' || cs.overflow === 'auto')
              && el.scrollHeight > el.clientHeight;
          }).map(el => ({ tag: el.tagName, id: el.id, class: el.className, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));

          return {
            windowInnerHeight: window.innerHeight,
            documentHeight: document.documentElement.scrollHeight,
            scrollables
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Scrollable elements:', result.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();

