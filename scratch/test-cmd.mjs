import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  const port = 9345;
  const tempDir = path.join(process.env.TEMP || 'C:/temp', 'chrome-cmd-' + Date.now());
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--headless=new',
    '--disable-gpu',
    'http://localhost:8081/showcase'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const tabs = await listRes.json();
    console.log('Tabs:', tabs.map(t => ({ url: t.url, title: t.title })));
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

run();

