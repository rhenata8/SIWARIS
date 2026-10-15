/* Prod verify v2.2 */
const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://siwaris-three.vercel.app';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(7000);
  const i = await page.$$('.auth-card input.form-input');
  await i[0].type('admin'); await i[1].type('sumbertaman2026');
  await page.click('.auth-card button[type=submit]');
  await sleep(7000);
  console.log('login:', Boolean(await page.$('.app-container')));
  const ver = await page.evaluate(() => document.querySelector('.sidebar').textContent.includes('v2.2'));
  console.log('version-v2.2-prod:', ver);
  await page.evaluate(() => { [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Manajemen Pengguna')).click(); });
  await sleep(3000);
  const ui = await page.evaluate(() => ({
    addBtn: [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Tambah Pengguna')),
    ubah: [...document.querySelectorAll('table tbody button, table tbody td')].some((b) => (b.textContent || '').includes('Ubah')),
    hapus: [...document.querySelectorAll('table tbody button')].some((b) => b.textContent.includes('Hapus')),
  }));
  console.log('crud-ui-prod:', JSON.stringify(ui));
  await page.screenshot({ path: '/workspace/siwaris-shots/v22-prod.png' });
  await browser.close();
})().catch((e) => { console.error('crash:', e.message); process.exit(1); });
