import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9347;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-chk-' + Date.now());
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
          const bodyOverflow = window.getComputedStyle(document.body).overflow;
          const htmlOverflow = window.getComputedStyle(document.documentElement).overflow;
          const docHeight = document.documentElement.scrollHeight;
          const bodyHeight = document.body.scrollHeight;
          window.scrollTo(0, 500);
          return {
            bodyOverflow,
            htmlOverflow,
            docHeight,
            bodyHeight,
            scrollYAfter500: window.scrollY
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Scroll check result:', result.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();

