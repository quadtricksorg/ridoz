import { spawn } from 'child_process';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9342;
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

    await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
    await new Promise(r => setTimeout(r, 2500));

    // Test sticky element on the live site
    const result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const main = document.querySelector('main');
          const testTrack = document.createElement('div');
          testTrack.id = 'test-track';
          testTrack.style.cssText = 'height: 2500px; background: rgba(255,0,0,0.1); position: relative;';
          testTrack.innerHTML = '<div id=\"test-sticky\" style=\"position: sticky; top: 0; height: 400px; background: rgba(0,255,0,0.5);\">STICKY TEST</div>';
          main.insertBefore(testTrack, main.children[1]);

          // Scroll into track
          const trackTop = testTrack.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, trackTop + 500);

          const r = document.getElementById('test-sticky').getBoundingClientRect();
          const worked = r.top === 0;

          // cleanup
          testTrack.remove();
          return {
            trackTop,
            scrollY: window.scrollY,
            stickyTop: r.top,
            workedWithMainOverflowXHidden: worked
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Live site sticky test:', JSON.stringify(result, null, 2));

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();
