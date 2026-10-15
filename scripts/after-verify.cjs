/* After-merge production verification: login on siwaris-three.vercel.app */
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE = 'https://siwaris-three.vercel.app';
const OUT = '/workspace/siwaris-shots/after';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ADMIN_USER = process.env.SIWARIS_E2E_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.SIWARIS_E2E_ADMIN_PASS || '';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(700);
  const splash = await page.$('.splash-screen');
  console.log('splash:', Boolean(splash));
  await page.screenshot({ path: `${OUT}/01-after-splash.png` });
  await sleep(3000);
  const login = await page.$('.auth-card');
  console.log('login-page:', Boolean(login));
  await page.screenshot({ path: `${OUT}/02-after-login-page.png` });
  if (!login || !ADMIN_PASS) { await browser.close(); return; }

  await (await page.$$('.auth-card input.form-input'))[0].type(ADMIN_USER);
  await (await page.$$('.auth-card input.form-input'))[1].type(ADMIN_PASS);
  await page.click('.auth-card button[type=submit]');
  await sleep(4000);
  const app = await page.$('.app-container');
  console.log('login-success-prod:', Boolean(app));
  await page.screenshot({ path: `${OUT}/03-after-dashboard.png` });

  const ver = await page.evaluate(() => document.body.textContent.includes('SIWARIS v2.0'));
  console.log('version-2.0-prod:', ver);

  // arsip page + unduh asli presence
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith('Arsip Digital'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: `${OUT}/04-after-arsip.png` });
  console.log('unduh-asli-prod:', await page.evaluate(() => document.body.textContent.includes('Unduh Asli')));

  // public validation on prod (anon)
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/validasi/SW-SBT-2026-0001', { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);
  console.log('public-validation-prod:', await page.evaluate(() => document.body.textContent.includes('Validasi Keaslian Surat')));
  await page.screenshot({ path: `${OUT}/05-after-public-validation.png` });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
