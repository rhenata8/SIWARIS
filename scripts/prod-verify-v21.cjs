/* Prod verification for v2.1 */
const puppeteer = require('puppeteer');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://siwaris-three.vercel.app';
const OUT = '/workspace/siwaris-shots/v21-prod';
const fs = require('fs');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(6000);

  const eye = await page.evaluate(() => Boolean(document.querySelector('button[class*=eye], .auth-eye-toggle')));
  console.log('11-login-eye-prod:', eye);
  const i = await page.$$('.auth-card input.form-input');
  await i[0].type('admin');
  await i[1].type('sumbertaman2026');
  await page.click('.auth-card button[type=submit]');
  await sleep(6000);
  console.log('login-prod:', Boolean(await page.$('.app-container')));
  await page.screenshot({ path: `${OUT}/01-prod-dashboard.png` });

  const t = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('header button, .topbar button')];
    const skw = btns.find((b) => b.textContent.toLowerCase().includes('tambah skw'));
    const sb = document.querySelector('.sidebar');
    const search = document.querySelector('header input, .topbar input');
    return {
      noSkwBtn: !skw,
      noPencarian: !sb.textContent.includes('Pencarian Arsip'),
      searchW: search ? search.getBoundingClientRect().width : 0,
      toastStack: Boolean(document.querySelector('.toast-stack')),
    };
  });
  console.log('1-topbar-prod:', t.noSkwBtn, '| 3-sidebar-prod:', t.noPencarian, '| searchW:', t.searchW, '| toast:', t.toastStack);
  await page.screenshot({ path: `${OUT}/02-prod-topbar.png` });

  await page.evaluate(() => { [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Data Surat Waris')).click(); });
  await sleep(2500);
  console.log('4-action-grid-prod:', Boolean(await page.$('.action-grid')));
  const grid0 = await page.$('.action-grid button');
  if (grid0) {
    await grid0.click();
    await sleep(2000);
    const m = await page.evaluate(() => {
      const dlg = document.querySelector('.modal-dialog') || document.body;
      return {
        noQrVerif: ![...dlg.querySelectorAll('button')].some((b) => b.textContent.includes('QR Verifikasi')),
        hasScanBtn: [...dlg.querySelectorAll('button')].some((b) => b.textContent.includes('Berkas Scan')),
        noOldLabel: ![...dlg.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Unduh PDF Asli'),
      };
    });
    console.log('5-detail-modal-prod:', m.noQrVerif, m.hasScanBtn, m.noOldLabel);
    await page.screenshot({ path: `${OUT}/03-prod-detail.png` });
  }

  await page.evaluate(() => { [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Laporan')).click(); });
  await sleep(2500);
  console.log('7-laporan-prod:', await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Unduh Laporan'))));
  await page.screenshot({ path: `${OUT}/04-prod-laporan.png` });

  await page.setViewport({ width: 390, height: 844 });
  await sleep(1500);
  console.log('8-mobile-prod:', Boolean(await page.$('.mobile-toggle')));
  await page.screenshot({ path: `${OUT}/05-prod-mobile.png` });

  await browser.close();
})().catch((e) => { console.error('crash:', e.message); process.exit(1); });
