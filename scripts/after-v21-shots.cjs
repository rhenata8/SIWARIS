/* AFTER screenshots — v2.1 fixed UI (local build = same code going to PR) */
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE = 'http://localhost:5173';
const OUT = '/workspace/siwaris-shots/v21-after';
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
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(5000);

  // 1. login + eye toggle visible
  await (await page.$$('.auth-card input.form-input'))[0].type(ADMIN_USER);
  const pw = (await page.$$('.auth-card input.form-input'))[1];
  await pw.type(ADMIN_PASS);
  await page.screenshot({ path: `${OUT}/01-after-login-eye.png` });
  await page.click('.auth-card button[type=submit]');
  await sleep(4000);
  // toast after login
  await page.screenshot({ path: `${OUT}/02-after-toast.png` });

  // 3. topbar: no SKW button + wide search
  await page.screenshot({ path: `${OUT}/03-after-topbar.png` });

  // 4. sidebar: no Pencarian Arsip
  await page.screenshot({ path: `${OUT}/04-after-sidebar.png` });

  // 5. SuratWaris 2x2 grid
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Data Surat Waris'));
    if (el) el.click();
  });
  await sleep(2200);
  await page.screenshot({ path: `${OUT}/05-after-action-grid.png` });

  // 6. detail modal — no QR Verifikasi, scan buttons
  const detailBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Rincian')));
  if (detailBtn.asElement()) {
    await detailBtn.asElement().click();
    await sleep(1600);
    await page.screenshot({ path: `${OUT}/06-after-detail-modal.png` });
    const close = await page.evaluateHandle(() => [...document.querySelectorAll('.modal-dialog button, .modal button')].find((b) => b.textContent.includes('Tutup')));
    if (close.asElement()) { await close.asElement().click(); await sleep(500); }
  }

  // 7. laporan page
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Laporan'));
    if (el) el.click();
  });
  await sleep(2200);
  await page.screenshot({ path: `${OUT}/07-after-laporan.png` });

  // 8. pengguna page
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Manajemen Pengguna'));
    if (el) el.click();
  });
  await sleep(2200);
  await page.screenshot({ path: `${OUT}/08-after-pengguna.png` });

  // 9. logout confirm in-app
  const logoutBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Keluar')));
  if (logoutBtn.asElement()) {
    await logoutBtn.asElement().click();
    await sleep(900);
    await page.screenshot({ path: `${OUT}/09-after-logout-confirm.png` });
  }

  // 10. mobile view (drawer + responsive)
  const cancelBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Batal'));
  if (cancelBtn.asElement()) { await cancelBtn.asElement().click(); await sleep(500); }
  await page.setViewport({ width: 390, height: 844 });
  await sleep(1500);
  const toggle = await page.$('.mobile-toggle');
  if (toggle) { await toggle.click(); await sleep(800); }
  await page.screenshot({ path: `${OUT}/10-after-mobile.png` });
  if (toggle) { await toggle.click(); await sleep(500); }
  await page.setViewport({ width: 1400, height: 900 });

  console.log('AFTER shots:', fs.readdirSync(OUT).join(', '));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
