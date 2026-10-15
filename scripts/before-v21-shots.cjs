/* BEFORE screenshots — current v2.0 state (bugs user reported) */
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE = process.env.BASE || 'https://siwaris-three.vercel.app';
const OUT = '/workspace/siwaris-shots/v21-before';
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
  await sleep(4000);
  // login
  await (await page.$$('.auth-card input.form-input'))[0].type(ADMIN_USER);
  await (await page.$$('.auth-card input.form-input'))[1].type(ADMIN_PASS);
  await page.click('.auth-card button[type=submit]');
  await sleep(4000);

  // 1. topbar + dashboard (SKW button, short search bar)
  await page.screenshot({ path: `${OUT}/01-before-topbar.png` });

  // 2. sidebar with Pencarian Arsip nav
  await page.screenshot({ path: `${OUT}/02-before-sidebar-nav.png` });

  // 3. Data Surat Waris page — 4 action buttons horizontal
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith('Data Surat Waris'));
    if (el) el.click();
  });
  await sleep(1800);
  await page.screenshot({ path: `${OUT}/03-before-suratwaris-actions.png` });

  // 4. Detail SKW modal — QR Verifikasi button + footer buttons
  const detailBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find((b) => b.textContent.includes('Rincian') || b.textContent.includes('Lihat') || b.textContent.includes('Detail'));
  });
  if (detailBtn.asElement()) {
    await detailBtn.asElement().click();
    await sleep(1500);
    await page.screenshot({ path: `${OUT}/04-before-detail-modal.png` });
    const closeBtn = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('.modal-dialog button')];
      return btns.find((b) => b.textContent.includes('Tutup') || b.querySelector('svg.lucide-x'));
    });
    if (closeBtn.asElement()) await closeBtn.asElement().click();
    await sleep(600);
  }

  // 5. Laporan page (unclear report)
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith('Laporan'));
    if (el) el.click();
  });
  await sleep(1800);
  await page.screenshot({ path: `${OUT}/05-before-laporan.png` });

  // 6. mobile view dashboard
  await page.setViewport({ width: 390, height: 844 });
  await sleep(1000);
  await page.screenshot({ path: `${OUT}/06-before-mobile.png` });
  await page.setViewport({ width: 1400, height: 900 });

  console.log('BEFORE shots saved:', fs.readdirSync(OUT).join(', '));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
