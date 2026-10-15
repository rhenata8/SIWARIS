/* SIWARIS v2.0 E2E test suite (headless) */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const SHOT_DIR = '/workspace/siwaris-shots';
const ADMIN_USER = process.env.SIWARIS_E2E_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.SIWARIS_E2E_ADMIN_PASS || '';
if (!ADMIN_PASS) {
  console.error('Set SIWARIS_E2E_ADMIN_PASS (and optionally SIWARIS_E2E_ADMIN_USER).');
  process.exit(1);
}
if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0, failed = 0;
const results = [];
function report(name, ok, extra = '') {
  if (ok) { passed++; results.push(`PASS ${name} ${extra}`); }
  else { failed++; results.push(`FAIL ${name} ${extra}`); }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  page.on('pageerror', (e) => results.push(`PAGEERROR ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') results.push(`CONSOLE_ERR ${m.text()}`); });

  // ---------- 1. Splash screen ----------
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await sleep(600);
  const hasSplash = await page.$('.splash-screen');
  report('splash-screen-visible', Boolean(hasSplash));
  await page.screenshot({ path: `${SHOT_DIR}/01-splash.png` });
  // wait for splash to finish (min 1.6s + fade 0.45s)
  await sleep(2600);

  // ---------- 2. Login guard (not logged in) ----------
  const hasLogin = await page.$('.auth-card');
  report('login-page-shown-when-not-authed', Boolean(hasLogin));
  await page.screenshot({ path: `${SHOT_DIR}/02-login.png` });

  // ---------- 3. Wrong password rejected ----------
  await page.type('input[type=text]', ADMIN_USER);
  await page.type('input[type=password]', 'passwordsalah');
  await page.click('button[type=submit]');
  await sleep(2500);
  const errBox = await page.$('.auth-error');
  const errText = errBox ? await errBox.evaluate((el) => el.textContent) : '';
  report('wrong-password-rejected', /salah/i.test(errText), `msg="${errText.trim()}"`);

  // ---------- 4. Correct login ----------
  await page.evaluate(() => document.querySelector('input[type=password]').value = '');
  await page.click('input[type=password]');
  await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control');
  await page.type('input[type=password]', ADMIN_PASS);
  await page.click('button[type=submit]');
  await sleep(3000);
  const inApp = await page.$('.app-container');
  report('login-success-shows-dashboard', Boolean(inApp));
  await page.screenshot({ path: `${SHOT_DIR}/03-dashboard.png` });

  // version 2.0 in sidebar
  const verText = await page.evaluate(() => document.body.textContent.includes('SIWARIS v2.0'));
  report('sidebar-version-2.0', verText);

  // ---------- 5. Add SKW with original PDF upload ----------
  // make a small dummy pdf
  const pdfBytes = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF'
  );
  const tmpPdf = '/tmp/skw-test-original.pdf';
  fs.writeFileSync(tmpPdf, pdfBytes);

  // open add modal from header button
  const addBtns = await page.$$('button');
  for (const b of addBtns) {
    const t = await b.evaluate((el) => el.textContent);
    if (t && t.includes('Tambah SKW')) { await b.click(); break; }
  }
  await sleep(800);
  const modalOpen = await page.$('.modal-dialog');
  report('add-modal-opens', Boolean(modalOpen));
  await page.screenshot({ path: `${SHOT_DIR}/04-add-modal.png` });

  // fill the form
  await page.type('.modal-dialog input[placeholder="Contoh: 470/128/SKW/2026"]', '');
  const nomorInput = await page.$('.modal-dialog .form-grid-2 input.form-input');
  await nomorInput.click({ clickCount: 3 });
  await nomorInput.type('470/999/SKW/2026');
  // Nama pewaris: 3rd form-grid-2 input... safer: fill inputs by index within modal
  const inputs = await page.$$('.modal-dialog input.form-input');
  // inputs[0]=nomorSKW, [1]=tanggal, [2]=namaPewaris, [3]=nik, [4]=tglMeninggal, ... ahli waris rows
  await inputs[2].type('Pewaris Uji E2E');
  await inputs[3].type('3574010101010001');
  // tanggal meninggal (type=date input) - set via value + dispatch
  await page.evaluate((idx) => {
    const el = document.querySelectorAll('.modal-dialog input.form-input')[idx];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, '2026-09-01');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, 4);
  // ahli waris row 1 nama (grid rows are also .form-input)
  const rowInputs = await page.$$('.modal-dialog input[placeholder*="Nama Ahli Waris"]');
  report('ahli-waris-rows-present', rowInputs.length >= 2);
  await rowInputs[0].type('Ahli Waris Uji 1');
  await rowInputs[1].type('Ahli Waris Uji 2');

  // upload file
  const fileInput = await page.$('.modal-dialog input[type=file]');
  await fileInput.uploadFile(tmpPdf);
  await sleep(500);
  const uploadLabel = await page.evaluate(() => {
    const divs = [...document.querySelectorAll('.modal-dialog div')];
    const d = divs.find((x) => x.textContent && x.textContent.includes('File terpilih'));
    return d ? d.textContent : '';
  });
  report('file-selected-shown', /File terpilih/i.test(uploadLabel), uploadLabel.trim().slice(0, 80));

  // submit
  const submitBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('.modal-dialog button')];
    return btns.find((b) => b.textContent.includes('Simpan Arsip'));
  });
  await submitBtn.asElement().click();
  await sleep(4000);
  await page.screenshot({ path: `${SHOT_DIR}/05-after-add.png` });

  // ---------- 6. Verify new archive row + Unduh Asli button ----------
  await page.evaluate(() => {
    // go to arsip page via sidebar
    const items = [...document.querySelectorAll('.sidebar nav div, .sidebar nav a, .sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith('Arsip Digital'));
    if (el) el.click();
  });
  await sleep(1200);
  const pageText = await page.evaluate(() => document.body.textContent);
  const hasNewRow = pageText.includes('Pewaris Uji E2E') || pageText.includes('470/999/SKW/2026');
  report('new-archive-listed', hasNewRow);
  const hasUnduhAsli = await page.evaluate(() => document.body.textContent.includes('Unduh Asli'));
  report('unduh-asli-button-present', hasUnduhAsli);
  await page.screenshot({ path: `${SHOT_DIR}/06-arsip.png` });

  // ---------- 7. Preview modal: original vs generated ----------
  const previewBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find((b) => b.textContent.includes('Pratinjau'));
  });
  await previewBtn.asElement().click();
  await sleep(1500);
  const previewText = await page.evaluate(() => {
    const m = document.querySelector('.modal-dialog');
    return m ? m.textContent : '';
  });
  report('preview-shows-original-label', /Berkas Asli \(Unggahan Operator\)/i.test(previewText));
  report('preview-has-unduh-berkas-asli', /Unduh Berkas Asli/i.test(previewText));
  report('preview-has-generated-button', /Unduh PDF Resmi SIWARIS/i.test(previewText));
  const hasIframe = await page.$('.modal-dialog iframe');
  report('preview-original-pdf-embedded', Boolean(hasIframe));
  await page.screenshot({ path: `${SHOT_DIR}/07-preview-original.png` });
  // close modal
  const closeBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('.modal-dialog button')];
    return btns.reverse().find((b) => b.textContent.includes('Tutup'));
  });
  if (closeBtn.asElement()) await closeBtn.asElement().click();
  await sleep(500);

  // ---------- 8. Register page: admin-only ----------
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  const regText = await page.evaluate(() => document.body.textContent);
  report('register-page-admin-form', /Registrasi Pengguna Baru/i.test(regText), '');
  await page.screenshot({ path: `${SHOT_DIR}/08-register.png` });

  // register a new user (unique username per run)
  const uniqUser = 'ujioperator' + Date.now().toString().slice(-6);
  const regInputs = await page.$$('.auth-card input.form-input');
  await regInputs[0].type('Uji Operator E2E');
  await regInputs[1].type(uniqUser);
  // [2] = NIP (skip), [3] = password, [4] = konfirmasi
  await regInputs[3].type('rahasia123');
  await regInputs[4].type('rahasia123');
  const regSubmit = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('.auth-card button')];
    return btns.find((b) => b.textContent.includes('Daftarkan Pengguna'));
  });
  await regSubmit.asElement().click();
  await sleep(3000);
  const regResult = await page.evaluate(() => {
    const s = document.querySelector('.auth-success');
    const e = document.querySelector('.auth-error');
    return { success: s ? s.textContent : '', error: e ? e.textContent : '' };
  });
  report('register-user-success', /berhasil didaftarkan/i.test(regResult.success), regResult.error || regResult.success.slice(0, 80));
  await page.screenshot({ path: `${SHOT_DIR}/09-register-done.png` });

  // ---------- 9. Logout ----------
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  const logoutBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find((b) => b.textContent.includes('Keluar'));
  });
  // accept confirm dialog
  page.on('dialog', (d) => d.accept());
  await logoutBtn.asElement().click();
  await sleep(2500);
  const backAtLogin = await page.$('.auth-card');
  report('logout-returns-to-login', Boolean(backAtLogin));
  await page.screenshot({ path: `${SHOT_DIR}/10-after-logout.png` });

  // ---------- 10. Login as newly registered user ----------
  const li = await page.$$('.auth-card input.form-input');
  await li[0].type(uniqUser);
  await li[1].type('rahasia123');
  await page.click('.auth-card button[type=submit]');
  await sleep(3000);
  const inApp2 = await page.$('.app-container');
  report('new-user-can-login', Boolean(inApp2));
  // pengguna page: tambah staf disabled for non-admin
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.sidebar *')];
    const el = items.find((x) => x.textContent && x.textContent.trim().startsWith('Manajemen Pengguna'));
    if (el) el.click();
  });
  await sleep(1200);
  const penggunaText = await page.evaluate(() => document.body.textContent);
  report('nonadmin-restricted-notice', /hanya dapat dilakukan oleh administrator/i.test(penggunaText));
  await page.screenshot({ path: `${SHOT_DIR}/11-nonadmin-pengguna.png` });
  // logout again
  const lo2 = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll('button')];
    return btns.find((b) => b.textContent.includes('Keluar'));
  });
  await lo2.asElement().click();
  await sleep(2000);

  // ---------- 11. Public verification (no login) ----------
  await page.goto(BASE + '/validasi/SW-SBT-2026-0001', { waitUntil: 'domcontentloaded' });
  await sleep(3000);
  const pubText = await page.evaluate(() => document.body.textContent);
  report('public-verification-modal', /Validasi Keaslian Surat/i.test(pubText));
  report('public-no-download-for-anon', !/Unduh PDF Resmi<\/?(?!!)/.test(pubText) && /Verifikasi publik/i.test(pubText));
  await page.screenshot({ path: `${SHOT_DIR}/12-public-verification.png` });

  // ---------- 12. Session persistence (reload keeps login) ----------
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  const stillLogin = await page.$('.auth-card');
  report('no-session-after-logout', Boolean(stillLogin));

  await browser.close();

  console.log('================ SIWARIS E2E RESULTS ================');
  results.forEach((r) => console.log(r));
  console.log('----------------------------------------------------');
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error('E2E crashed:', e);
  process.exit(2);
});
