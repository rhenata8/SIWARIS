/* v2.2.1 regression: berkas scan persistence + unduh blob inline */
const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const BASE = 'http://localhost:5173';
const OUT = '/workspace/siwaris-shots/v221';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ADMIN_PASS = process.env.SIWARIS_E2E_ADMIN_PASS || '';

let passed = 0, failed = 0;
const check = (name, cond) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${name}`); cond ? passed++ : failed++; };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/home/hermeswebui/.hermes/home/.cache/puppeteer/chrome-headless-shell/linux-148.0.7778.97/chrome-headless-shell-linux64/chrome-headless-shell',
    headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // track popups/new tabs
  let popupOpened = false;
  browser.on('targetcreated', (t) => { if (t.type() === 'page') popupOpened = true; });

  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(5000);
  const i = await page.$$('.auth-card input.form-input');
  await i[0].type('admin'); await i[1].type(ADMIN_PASS);
  await page.click('.auth-card button[type=submit]');
  await sleep(5000);
  check('login', Boolean(await page.$('.app-container')));

  // ---- create archive via UI ----
  await page.evaluate(() => { [...document.querySelectorAll('.sidebar button')].find((x) => x.textContent.includes('Tambah SKW')).click(); });
  await sleep(1500);
  const stamp = Date.now().toString().slice(-6);
  const nomor = `471/${stamp}/SKW/2026`;
  await page.evaluate((n) => {
    const setV = (el, v) => { const s = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    const inputs = [...document.querySelectorAll('.modal-overlay input, .modal-dialog input')];
    setV(inputs.find((x) => (x.placeholder || '').includes('Contoh')), n);
    setV(inputs.find((x) => (x.placeholder || '').includes('Nama lengkap')), 'Pewaris ScanTest ' + n);
    setV(inputs.find((x) => (x.placeholder || '').toLowerCase().includes('ahli waris')), 'Ahli ScanTest');
    inputs.filter((x) => x.type === 'date' && x.required && !x.value).forEach((x) => setV(x, '2026-10-14'));
  }, nomor);
  await page.evaluate(() => { [...document.querySelectorAll('.modal-overlay button, .modal-dialog button')].find((x) => x.textContent.includes('Simpan')).click(); });
  await sleep(5000);
  check('archive-created', await page.evaluate((n) => document.body.textContent.includes(n), nomor));

  // ---- attach scan server-side via convex CLI ----
  const archives = JSON.parse(execSync('npx convex run skw:getArchives \'{}\'', { cwd: '/workspace/SIWARIS', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
  const arch = archives.find((a) => a.nomorSKW === nomor);
  check('archive-in-db', Boolean(arch));
  // make a tiny valid PDF
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\n%%EOF', 'utf8');
  fs.writeFileSync('/tmp/scan-uji.pdf', pdf);
  const postUrl = execSync('npx convex run skw:generateUploadUrl \'{}\'', { cwd: '/workspace/SIWARIS', encoding: 'utf8' }).trim().replace(/^"|"$/g, '');
  const upRes = await fetch(postUrl, { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: pdf });
  const { storageId } = await upRes.json();
  check('storage-upload-ok', Boolean(storageId));
  execSync(`npx convex run skw:finalizeUpload '{"id":"${arch._id}","storageId":"${storageId}","fileName":"scan-uji.pdf","fileSize":"1.0 KB"}'`, { cwd: '/workspace/SIWARIS', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  console.log('scan attached server-side');

  // ---- reload page (fresh reactive sync — THE BUG SCENARIO) ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await sleep(6000);
  // go to Data Surat Waris and open detail
  await page.evaluate(() => { [...document.querySelectorAll('.sidebar *')].find((x) => x.textContent && x.textContent.trim().startsWith('Data Surat Waris')).click(); });
  await sleep(2500);
  const rowFound = await page.evaluate((n) => {
    const row = [...document.querySelectorAll('table tbody tr')].find((r) => r.textContent.includes(n));
    if (!row) return false;
    const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Lihat') || b.textContent.includes('Rincian'));
    if (btn) { btn.click(); return true; }
    return false;
  }, nomor);
  check('detail-opened', rowFound);
  await sleep(2000);
  // scan detected after reload (was the bug: storageId lost)
  const scanState = await page.evaluate(() => {
    const dlg = document.querySelector('.modal-overlay, .modal-dialog');
    if (!dlg) return { open: false };
    return {
      open: true,
      hasBukaScan: [...dlg.querySelectorAll('button')].some((b) => b.textContent.includes('Buka Berkas Scan')),
      hasUploadAgain: [...dlg.querySelectorAll('button')].some((b) => b.textContent.includes('Unggah Berkas Scan')),
      hasUnduh: [...dlg.querySelectorAll('button')].some((b) => b.textContent.includes('Unduh Berkas Scan')),
    };
  });
  check('scan-persisted-after-reload', scanState.open && scanState.hasBukaScan && scanState.hasUnduh && !scanState.hasUploadAgain);
  await page.screenshot({ path: `${OUT}/01-detail-after-reload.png` });

  // ---- Buka Berkas Scan: preview INLINE (no new tab/popup) ----
  popupOpened = false;
  await page.evaluate(() => { [...document.querySelectorAll('.modal-overlay button, .modal-dialog button')].find((b) => b.textContent.includes('Buka Berkas Scan')).click(); });
  await sleep(3000);
  const iframe = await page.evaluate(() => {
    const f = document.querySelector('.modal-overlay iframe, .modal-dialog iframe, .modal-overlay embed, .modal-overlay object');
    return f ? { src: (f.src || f.data || '').slice(0, 60), inApp: (f.src || f.data || '').includes('convex') } : null;
  });
  check('scan-preview-inline-iframe', Boolean(iframe) && iframe.inApp);
  check('scan-preview-no-new-tab', popupOpened === false);
  await page.screenshot({ path: `${OUT}/02-scan-preview-inline.png` });
  // close preview
  await page.keyboard.press('Escape');
  await sleep(600);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.closest('.modal-overlay'));
    const x = btns.find((b) => b.querySelector('.lucide-x, svg')) || btns.find((b) => b.textContent.includes('Tutup'));
    if (x) x.click();
  });
  await sleep(800);

  // ---- Unduh Berkas Scan: blob download, no navigation ----
  const cdp = await page.createCDPSession();
  const dlDir = `/tmp/e2e-dl-${Date.now()}`;
  fs.mkdirSync(dlDir, { recursive: true });
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dlDir }).catch(() => {});
  const urlBefore = page.url();
  popupOpened = false;
  // reopen detail (preview closed earlier)
  const reopened = await page.evaluate((n) => {
    const row = [...document.querySelectorAll('table tbody tr')].find((r) => r.textContent.includes(n));
    if (!row) return false;
    const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('Lihat') || b.textContent.includes('Rincian'));
    if (btn) { btn.click(); return true; }
    return false;
  }, nomor);
  await sleep(2000);
  await page.evaluate(() => { [...document.querySelectorAll('.modal-overlay button, .modal-dialog button')].find((b) => b.textContent.includes('Unduh Berkas Scan')).click(); });
  await sleep(5000);
  const files = fs.readdirSync(dlDir).filter((f) => f.endsWith('.pdf'));
  check('unduh-scan-downloads-original', files.length > 0 && fs.statSync(dlDir + '/' + files[0]).size >= pdf.length - 20);
  check('unduh-scan-no-navigation', page.url() === urlBefore);
  check('unduh-scan-no-new-tab', popupOpened === false);
  await page.screenshot({ path: `${OUT}/03-after-unduh.png` });

  // ---- cleanup test archive ----
  const archives2 = JSON.parse(execSync('npx convex run skw:getArchives \'{}\'', { cwd: '/workspace/SIWARIS', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
  const arch2 = archives2.find((a) => a.nomorSKW === nomor);
  if (arch2) {
    execSync(`npx convex run skw:deleteArchive '{"id":"${arch2._id}"}'`, { cwd: '/workspace/SIWARIS', encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    console.log('test archive cleaned');
  }

  console.log('----------------------------------------------------');
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => { console.error('E2E crashed:', e.message); process.exit(1); });
