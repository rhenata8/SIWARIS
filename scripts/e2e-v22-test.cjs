/* SIWARIS v2.2 E2E — Manajemen Pengguna full CRUD + version bump */
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE = 'http://localhost:5173';
const OUT = '/workspace/siwaris-shots/v22';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ADMIN_PASS = process.env.SIWARIS_E2E_ADMIN_PASS || '';

let passed = 0, failed = 0;
const check = (name, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`); cond ? passed++ : failed++; };

const setVal = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
  setter.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
const fillByPh = (scope, ph, val) => {
  const el = [...scope.querySelectorAll('input')].find((i) => (i.placeholder || '').toLowerCase().includes(ph));
  if (el) { setVal(el, val); return true; }
  return false;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(5000);
  const i = await page.$$('.auth-card input.form-input');
  await i[0].type('admin'); await i[1].type(ADMIN_PASS);
  await page.click('.auth-card button[type=submit]');
  await sleep(5000);
  check('login', Boolean(await page.$('.app-container')));

  // version v2.2
  const ver = await page.evaluate(() => document.querySelector('.sidebar').textContent.includes('v2.2'));
  check('version-v2.2', ver);
  await page.screenshot({ path: `${OUT}/01-dashboard-v22.png` });

  // go to Manajemen Pengguna
  await page.evaluate(() => { [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Manajemen Pengguna')).click(); });
  await sleep(2000);

  const stamp = Date.now().toString().slice(-5);
  const uname = `operator${stamp}`;
  const uname2 = `edit${stamp}`;

  // ---- CREATE ----
  const hasAdd = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Tambah Pengguna')));
  check('tambah-pengguna-button', hasAdd);
  await page.evaluate(() => { [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Tambah Pengguna')).click(); });
  await sleep(1200);
  let ok = await page.evaluate((u) => {
    const dlg = document.querySelector('.modal-overlay, .modal-dialog');
    if (!dlg) return false;
    const setV = (el, v) => { const s = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    let found = false;
    for (const inp of dlg.querySelectorAll('input')) {
      const ph = (inp.placeholder || '').toLowerCase();
      if (ph.includes('gelar')) { setV(inp, 'Operator Uji ' + u); }
      else if (ph.includes('kasi_pelayanan')) { setV(inp, u); found = true; }
      else if (ph.includes('1980')) setV(inp, '1987654321');
      else if (ph.includes('minimal 6')) setV(inp, 'pass12345');
      else if (ph.includes('ulangi')) setV(inp, 'pass12345');
      else if (inp.type === 'email') setV(inp, u + '@probolinggokota.go.id');
    }
    return found;
  }, uname);
  check('create-form-filled', ok);
  await page.screenshot({ path: `${OUT}/02-create-modal.png` });
  await page.evaluate(() => { [...document.querySelectorAll('.modal-overlay button, .modal-dialog button')].find((b) => b.textContent.includes('Simpan Pengguna') || b.textContent.includes('Simpan')).click(); });
  await sleep(5000);
  const created = await page.evaluate((u) => document.body.textContent.includes(u), uname);
  check('create-user-appears', created);
  await page.screenshot({ path: `${OUT}/03-after-create.png` });

  // ---- UPDATE ----
  await page.evaluate((u) => {
    const row = [...document.querySelectorAll('table tbody tr')].find((r) => r.textContent.includes(u));
    const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Ubah'));
    if (btn) btn.click();
  }, uname);
  await sleep(1200);
  await page.evaluate((u2) => {
    const dlg = document.querySelector('.modal-overlay, .modal-dialog');
    const setV = (el, v) => { const s = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    for (const inp of dlg.querySelectorAll('input')) {
      const ph = (inp.placeholder || '').toLowerCase();
      if (ph.includes('kasi_pelayanan')) setV(inp, u2);
      else if (ph.includes('gelar')) setV(inp, 'Operator Diubah ' + u2);
    }
  }, uname2);
  await page.evaluate(() => { [...document.querySelectorAll('.modal-overlay button, .modal-dialog button')].find((b) => b.textContent.includes('Simpan')).click(); });
  await sleep(5000);
  const updated = await page.evaluate((u) => document.body.textContent.includes(u), uname2);
  check('update-user-username', updated);
  await page.screenshot({ path: `${OUT}/04-after-update.png` });

  // ---- GUARD: hapus diri sendiri disabled ----
  const selfGuard = await page.evaluate(() => {
    const row = [...document.querySelectorAll('table tbody tr')].find((r) => r.textContent.toLowerCase().includes('admin') && !r.textContent.includes('operator'));
    if (!row) return 'no-row';
    const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Hapus'));
    return btn ? btn.disabled : 'no-btn';
  });
  check('guard-no-delete-self', selfGuard === true);
  await page.screenshot({ path: `${OUT}/05-guards.png` });

  // ---- DELETE ----
  await page.evaluate((u) => {
    const row = [...document.querySelectorAll('table tbody tr')].find((r) => r.textContent.includes(u));
    const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Hapus'));
    if (btn) btn.click();
  }, uname2);
  await sleep(1000);
  const confirmShown = await page.evaluate(() => {
    const dlg = document.querySelector('.modal-dialog, .confirm-overlay');
    return dlg ? dlg.textContent.includes('Hapus') || dlg.textContent.includes('Ya') : false;
  });
  check('delete-confirm-inapp', confirmShown);
  await page.screenshot({ path: `${OUT}/06-delete-confirm.png` });
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.textContent.includes('Hapus') || b.textContent.trim() === 'Ya, Hapus' || b.textContent.trim() === 'Hapus');
    const b = btns.find((x) => x.closest('.modal-dialog, .confirm-overlay'));
    if (b) b.click();
  });
  await sleep(5000);
  const gone = await page.evaluate((u) => !document.body.textContent.includes(u), uname2);
  check('delete-user-removed', gone);
  await page.screenshot({ path: `${OUT}/07-after-delete.png` });

  console.log('----------------------------------------------------');
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('E2E crashed:', e.message); process.exit(1); });
