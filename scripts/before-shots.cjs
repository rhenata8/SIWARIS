/* Capture "before" screenshots from production */
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE = 'https://siwaris-three.vercel.app';
const OUT = '/workspace/siwaris-shots/before';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/01-before-home.png` });

  // arsip page (click sidebar item)
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith('Arsip Digital'));
    if (el) el.click();
  });
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/02-before-arsip.png` });

  const verText = await page.evaluate(() => document.body.textContent);
  console.log('has v1.0 label:', verText.includes('SIWARIS v1.0'));
  console.log('has login guard:', verText.includes('Masuk ke Dashboard'));
  await browser.close();
  console.log('BEFORE screenshots saved to', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
