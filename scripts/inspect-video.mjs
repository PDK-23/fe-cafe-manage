import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
const video = readFileSync(new URL('../../Download.mp4', import.meta.url));
const server = createServer((req,res) => {
  if (req.url === '/video') { res.writeHead(200, {'Content-Type':'video/mp4'}); res.end(video); }
  else { res.writeHead(200, {'Content-Type':'text/html'}); res.end('<video src="/video" muted style="width:1280px"></video>'); }
}).listen(5199, '127.0.0.1');
const browser = await chromium.launch({channel:'msedge', headless:true});
const page = await browser.newPage({viewport:{width:1300,height:850}});
await page.goto('http://127.0.0.1:5199');
await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
const duration = await page.$eval('video', v => v.duration);
console.log({duration});
mkdirSync('../.reference', {recursive:true});
for (let i=0; i<8; i++) {
  const second = Math.max(1,duration*i/8);
  await page.$eval('video', (v,t) => new Promise(resolve => {v.onseeked = resolve; v.currentTime=t}), second);
  await page.waitForTimeout(250);
  await page.locator('video').screenshot({path:`../.reference/video-${i}.png`});
}
await browser.close(); server.close();
