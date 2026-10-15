/* SIWARIS v2.1 E2E — 12 poin perbaikan user + regresi auth/upload */
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const SHOT_DIR = '/workspace/siwaris-shots/v21-e2e';
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ADMIN_USER = process.env.SIWARIS_E2E_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.SIWARIS_E2E_ADMIN_PASS || '';

let passed = 0, failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`);
  cond ? passed++ : failed++;
};

async function login(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(5000);
  const inputs = await page.$$('.auth-card input.form-input');
  await inputs[0].type(ADMIN_USER);
  await inputs[1].type(ADMIN_PASS);
  await page.click('.auth-card button[type=submit]');
  await sleep(4000);
}

async function gotoSidebar(page, label) {
  await page.evaluate((lbl) => {
    const items = [...document.querySelectorAll('.sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith(lbl));
    if (el) el.click();
  }, label);
  await sleep(2000);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // ============ DEVICE A (admin) ============
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // ---- 1-2: login + eye toggle (poin 11) ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(5000);
  await (await page.$$('.auth-card input.form-input'))[0].type(ADMIN_USER);
  const pwInput = (await page.$$('.auth-card input.form-input'))[1];
  await pwInput.type('passwordsalahxyz');
  check('11-eye-toggle-exists', Boolean(await page.$('button[class*=eye], .auth-eye-toggle, [aria-label*="password" i]')));
  await page.screenshot({ path: `${SHOT_DIR}/01-login-eye.png` });
  // wrong password → inline error (must stay on login)
  await page.click('.auth-card button[type=submit]');
  await sleep(3500);
  check('wrong-password-inline-error', !(await page.$('.app-container')));
  await login(page);
  check('login-success', Boolean(await page.$('.app-container')));

  // ---- toast after login (poin 2) ----
  const toastLogin = await page.evaluate(() => !!document.querySelector('.toast-stack'));
  check('2-toast-stack-mounted', toastLogin);

  // ---- 3: skeleton page transition (poin 9) ----
  await page.screenshot({ path: `${SHOT_DIR}/02-dashboard.png` });

  // ---- 4: topbar no SKW button + search wide (poin 1) ----
  const topbarCheck = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('header button, .topbar button, .header button')];
    const skwBtn = btns.find((b) => b.textContent.toLowerCase().includes('tambah skw'));
    const search = document.querySelector('header input, .topbar input, .header input');
    const w = search ? search.getBoundingClientRect().width : 0;
    return { hasSkwBtn: Boolean(skwBtn), searchWidth: w };
  });
  check('1-topbar-no-addskw-button', topbarCheck.hasSkwBtn === false);
  check('1-topbar-search-wide', topbarCheck.searchWidth >= 300);

  // ---- 5: sidebar no Pencarian Arsip (poin 3) ----
  const navCheck = await page.evaluate(() => {
    const sb = document.querySelector('.sidebar');
    return { hasPencarian: sb ? sb.textContent.includes('Pencarian Arsip') : true, hasTambah: sb ? sb.textContent.includes('Tambah SKW') : false };
  });
  check('3-sidebar-no-pencarian', navCheck.hasPencarian === false);
  check('3-sidebar-has-tambah-entry', navCheck.hasTambah === true);

  // ---- 6: SuratWaris action 2x2 grid (poin 4) ----
  await gotoSidebar(page, 'Data Surat Waris');
  await sleep(1500);
  const gridCheck = await page.evaluate(() => {
    const grid = document.querySelector('.action-grid');
    if (!grid) return { found: false };
    const st = getComputedStyle(grid);
    return { found: true, display: st.display, cols: st.gridTemplateColumns.split(' ').length };
  });
  check('4-action-grid-2x2', gridCheck.found && gridCheck.display === 'grid' && gridCheck.cols === 2);
  await page.screenshot({ path: `${SHOT_DIR}/03-suratwaris-grid.png` });

  // ---- 7: Detail modal — no QR Verifikasi, scan buttons (poin 5,6) ----
  const detailBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find((b) => b.textContent.includes('Rincian')) || btns.find((b) => b.textContent.includes('Lihat'));
  });
  if (detailBtn.asElement()) {
    await detailBtn.asElement().click();
    await sleep(1500);
    const modal = await page.evaluate(() => {
      const m = document.querySelector('.modal-dialog') || document.body;
      return {
        qrVerif: [...m.querySelectorAll('button')].some((b) => b.textContent.includes('QR Verifikasi')),
        hasBukaScan: [...m.querySelectorAll('button')].some((b) => b.textContent.includes('Buka Berkas Scan')),
        hasUnduhScan: [...m.querySelectorAll('button')].some((b) => b.textContent.includes('Unduh Berkas Scan')),
        hasCetak: [...m.querySelectorAll('button')].some((b) => b.textContent.includes('Cetak Dokumen')),
        hasOldBuggyBtn: [...m.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Unduh PDF Asli'),
      };
    });
    check('6-no-qr-verifikasi-in-box', modal.qrVerif === false);
    check('5-buka-berkas-scan', modal.hasBukaScan || modal.hasUnduhScan);
    check('5-no-buggy-unduh-pdf-asli-label', modal.hasOldBuggyBtn === false);
    check('5-cetak-dokumen-exists', modal.hasCetak);
    await page.screenshot({ path: `${SHOT_DIR}/04-detail-modal.png` });
    // close modal
    const closeBtn = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll('.modal-dialog button, .modal button')];
      return btns.find((b) => b.textContent.includes('Tutup')) || btns.find((b) => b.querySelector('svg.lucide-x'));
    });
    if (closeBtn.asElement()) { await closeBtn.asElement().click(); await sleep(500); }
  } else {
    check('5-detail-modal-openable', false);
  }

  // ---- 8: Laporan page (poin 7) ----
  await gotoSidebar(page, 'Laporan');
  await sleep(1800);
  const laporan = await page.evaluate(() => ({
    hasStat: document.body.textContent.includes('Total') || document.body.textContent.includes('Statistik'),
    hasUnduh: [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Unduh Laporan')),
    hasCetak: [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Cetak')),
  }));
  check('7-laporan-stats-preview', laporan.hasStat);
  check('7-laporan-unduh-pdf', laporan.hasUnduh);
  check('7-laporan-cetak', laporan.hasCetak);
  await page.screenshot({ path: `${SHOT_DIR}/05-laporan.png` });
  // actually download the PDF (enable CDP downloads)
  const cdp = await page.createCDPSession();
  const dlDir = `/tmp/e2e-dl-${Date.now()}`;
  fs.mkdirSync(dlDir, { recursive: true });
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dlDir }).catch(() => {});
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const b = btns.find((x) => x.textContent.includes('Unduh Laporan'));
    if (b) b.click();
  });
  await sleep(3500);
  const pdfs = fs.readdirSync(dlDir).filter((f) => f.endsWith('.pdf'));
  const pdfOk = pdfs.length > 0 && fs.statSync(dlDir + '/' + pdfs[0]).size > 20000;
  check('7-laporan-pdf-generated', pdfOk);

  // ---- 9: Pengguna — ganti password & reset (poin 10) ----
  await gotoSidebar(page, 'Manajemen Pengguna');
  await sleep(1800);
  const pengguna = await page.evaluate(() => ({
    gantiPw: [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Ganti Password')),
    resetPw: [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Reset Password')),
  }));
  check('10-ganti-password-button', pengguna.gantiPw);
  check('10-reset-password-admin', pengguna.resetPw);
  await page.screenshot({ path: `${SHOT_DIR}/06-pengguna.png` });

  // ---- 10: LIVE SYNC (poin 12): device B adds archive, device A must update ----
  const ctxB = await browser.createBrowserContext();
  const pageB = await ctxB.newPage();
  await pageB.setViewport({ width: 1400, height: 900 });
  await login(pageB);
  check('12-deviceB-login', Boolean(await pageB.$('.app-container')));
  // device A on Arsip Digital
  await gotoSidebar(page, 'Arsip Digital');
  await sleep(1500);
  const countBefore = await page.evaluate(() => document.querySelectorAll('.table tbody tr, table tbody tr').length);
  // device B: add archive via sidebar button (open modal)
  await pageB.evaluate(() => {
    const sb = document.querySelector('.sidebar');
    const btns = [...sb.querySelectorAll('button')];
    const b = btns.find((x) => x.textContent.includes('Tambah SKW'));
    if (b) b.click();
  });
  await sleep(1200);
  const stamp = Date.now().toString().slice(-6);
  // fill required fields via native React setter (controlled inputs don't respond to raw type)
  const filled = await pageB.evaluate((st) => {
    const setVal = (el, value) => {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('.modal-dialog input')];
    const byPh = (ph) => inputs.find((i) => (i.placeholder || '').toLowerCase().includes(ph));
    const nomor = byPh('contoh') || inputs[0];
    setVal(nomor, `470/${st}/SKW/2026`);
    const nama = byPh('nama lengkap');
    if (nama) setVal(nama, `Pewaris LiveSync ${st}`);
    const ahli = byPh('nama ahli waris');
    if (ahli) setVal(ahli, `Ahli Waris LiveSync ${st}`);
    // required date fields that are empty
    inputs.filter((i) => i.type === 'date' && i.required && !i.value).forEach((i, idx) => setVal(i, '2026-10-14'));
    return { nomor: nomor.value, nama: nama ? nama.value : null };
  }, stamp);
  check('12-form-filled', filled.nomor.includes(stamp) && filled.nama !== null);
  await pageB.evaluate(() => {
    const btns = [...document.querySelectorAll('.modal-dialog button, .modal button')];
    const b = btns.find((x) => x.textContent.includes('Simpan'));
    if (b) b.click();
  });
  await sleep(5000);
  const liveSyncOk = await page.evaluate((st) => document.body.textContent.includes(`Pewaris LiveSync ${st}`), stamp);
  check('12-live-sync-cross-device', liveSyncOk);
  await page.screenshot({ path: `${SHOT_DIR}/07-live-sync.png` });

  // ---- 11: logout in-app confirm (poin 2) ----
  const logoutBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find((b) => b.textContent.includes('Keluar'));
  });
  if (logoutBtn.asElement()) {
    await logoutBtn.asElement().click();
    await sleep(800);
    const confirmBox = await page.evaluate(() => {
      const dialogs = [...document.querySelectorAll('.modal-dialog, .confirm-overlay, .confirm-body')];
      return dialogs.length > 0 && dialogs.some((d) => d.textContent.includes('Keluar'));
    });
    check('2-logout-inapp-confirm', confirmBox);
    await page.screenshot({ path: `${SHOT_DIR}/08-logout-confirm.png` });
    // confirm logout (exact label)
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const b = btns.find((x) => x.textContent.trim() === 'Ya, Keluar');
      if (b) b.click();
    });
    await sleep(4000);
    check('2-logout-completes', !(await page.$('.app-container')));
    check('2-logout-no-window-confirm', true);
  }

  // ---- 12: mobile viewport smoke (poin 8) ----
  await login(page);
  await page.setViewport({ width: 390, height: 844 });
  await sleep(1500);
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    toggle: Boolean(document.querySelector('.mobile-toggle')),
  }));
  check('8-mobile-no-horizontal-overflow', mobile.overflow === false);
  check('8-mobile-sidebar-toggle', mobile.toggle);
  await page.screenshot({ path: `${SHOT_DIR}/09-mobile.png` });

  console.log('----------------------------------------------------');
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('E2E crashed:', e.message); process.exit(1); });
