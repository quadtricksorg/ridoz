import { spawn } from 'child_process';
import fs from 'fs';

const p = 9502;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  `--remote-debugging-port=${p}`, '--headless=new', 'about:blank'
]);

await new Promise(r => setTimeout(r, 2500));
const res = await (await fetch(`http://127.0.0.1:${p}/json`)).json();
const { default: WS } = await import('ws');
const ws = new WS(res[0].webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));

let id = 1;
const send = (m, prm = {}) => new Promise(resolve => {
  const c = id++;
  const h = d => { const j = JSON.parse(d); if (j.id === c) { ws.off('message', h); resolve(j.result); } };
  ws.on('message', h);
  ws.send(JSON.stringify({ id: c, method: m, params: prm }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8081/?no_intro=1' });
await new Promise(r => setTimeout(r, 3500));
await send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
await new Promise(r => setTimeout(r, 500));

const scr = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('verification-screenshots/hero-adjusted-1440x900.png', Buffer.from(scr.data, 'base64'));
console.log('saved 1440x900');

await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
await new Promise(r => setTimeout(r, 600));
await send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
await new Promise(r => setTimeout(r, 500));
const scr2 = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('verification-screenshots/hero-adjusted-1366x768.png', Buffer.from(scr2.data, 'base64'));
console.log('saved 1366x768');

ws.close();
chrome.kill();

