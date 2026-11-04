import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9344;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-insp-' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
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

    const navRes = await send('Page.navigate', { url: 'http://127.0.0.1:8081/?no_intro=1' });
    console.log('Navigation response:', navRes);
    await new Promise(r => setTimeout(r, 2000));

    const check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            title: document.title,
            bodyLength: document.body.innerHTML.length,
            hasMain: !!document.querySelector('main'),
            hasSlider: !!document.getElementById('showcase-slider'),
            firstElements: Array.from(document.body.children).map(c => c.tagName + (c.id ? '#' + c.id : '') + (c.className ? '.' + c.className.slice(0, 20) : ''))
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Page check:', check.result.value);

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();
