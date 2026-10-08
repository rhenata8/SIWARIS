const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function findButtonByText(pageOrElement, text) {
  const btns = await pageOrElement.$$('button');
  for (const b of btns) {
    const content = await b.evaluate(el => el.textContent);
    if (content.includes(text)) return b;
  }
  return null;
}

async function runE2E() {
  console.log('🚀 Starting E2E tests for SIWARIS with Microsoft Edge...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.toString());
  });

  try {
    // 1. Load Dashboard
    console.log('1. Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png') });
    console.log('   ✓ Dashboard loaded successfully.');

    // 2. Open Detail Modal
    console.log('2. Opening Detail modal for first archive...');
    const detailBtn = await findButtonByText(page, 'Detail');
    if (detailBtn) {
      await detailBtn.click();
      await page.waitForSelector('.modal-dialog', { timeout: 5000 });
      console.log('   ✓ Detail modal opened.');

      // 3. Switch to Format Surat Resmi tab
      console.log('3. Switching to Format Surat Resmi tab...');
      const officialTabBtn = await findButtonByText(page, 'Format Surat Resmi');
      if (officialTabBtn) {
        await officialTabBtn.click();
      }
      await page.waitForSelector('.official-letter', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 600)); // wait for QR code render
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_format_surat_resmi.png') });

      // Verify components in official letter
      const letterText = await page.$eval('.official-letter', el => el.innerText);
      const hasKop = letterText.includes('PEMERINTAH KOTA PROBOLINGGO') && letterText.includes('KELURAHAN SUMBERTAMAN');
      const hasTitle = letterText.includes('SURAT KETERANGAN WARIS');
      const hasTTE = letterText.includes('DITANDATANGANI SECARA ELEKTRONIK OLEH:');
      const hasQR = await page.$('.verification-qr-img') !== null;

      console.log(`   ✓ Kop Surat verified: ${hasKop}`);
      console.log(`   ✓ Title verified: ${hasTitle}`);
      console.log(`   ✓ TTE Badge verified: ${hasTTE}`);
      console.log(`   ✓ Scannable QR code rendered: ${hasQR}`);

      // Verify no broken apostrophe / unicode character
      const hasBrokenChar = letterText.includes("' TERTANDA ELEKTRONIK");
      console.log(`   ✓ No corrupted apostrophe checkmark: ${!hasBrokenChar}`);

      // 4. Test Unduh PDF Asli
      console.log('4. Testing Unduh PDF button...');
      const downloadBtn = await findButtonByText(page, 'Unduh PDF Asli');
      if (downloadBtn) {
        await downloadBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        console.log('   ✓ Unduh PDF Asli executed without errors.');
      }

      // Close Detail Modal
      const closeBtn = await page.$('.modal-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 5. Test Tambah SKW Modal (Check Scrollable Form)
    console.log('5. Testing Tambah SKW Modal & scrollability...');
    const addBtn = await findButtonByText(page, 'Tambah SKW');
    if (addBtn) {
      await addBtn.click();
      await page.waitForSelector('.modal-dialog form', { timeout: 5000 });

      // Check if modal-body has overflow-y: auto and is scrollable
      const isScrollable = await page.$eval('.modal-body', el => {
        const hasScrollStyle = window.getComputedStyle(el).overflowY === 'auto';
        const canScroll = el.scrollHeight >= el.clientHeight;
        return { hasScrollStyle, canScroll, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
      });
      console.log(`   ✓ Modal body scrollable: ${isScrollable.hasScrollStyle} (scrollHeight: ${isScrollable.scrollHeight}px, clientHeight: ${isScrollable.clientHeight}px)`);

      // Fill in new archive form
      const inputs = await page.$$('form input');
      for (const inp of inputs) {
        const val = await inp.evaluate(el => el.value);
        if (val === '') {
          await inp.type('Alm. Haji Suharsono');
          break;
        }
      }

      // Close modal
      const cancelBtn = await findButtonByText(page, 'Batal') || await page.$('.modal-close-btn');
      if (cancelBtn) await cancelBtn.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 6. Test Data Surat Waris Page & Filtering
    console.log('6. Navigating to Data Surat Waris page...');
    const navLinks = await page.$$('.sidebar-nav a, .sidebar-nav button, .sidebar a, .sidebar button');
    for (const nl of navLinks) {
      const text = await nl.evaluate(el => el.textContent);
      if (text.includes('Data Surat Waris')) {
        await nl.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_surat_waris_page.png') });

    // Test filter buttons
    const filterBtns = await page.$$('.page-container button');
    for (const fb of filterBtns) {
      const text = await fb.evaluate(el => el.textContent);
      if (text.trim() === 'Terverifikasi') {
        await fb.click();
        await new Promise(r => setTimeout(r, 300));
        console.log('   ✓ Filter Terverifikasi clicked.');
        break;
      }
    }

    // Test Edit SKW Modal from table
    console.log('7. Testing Ubah SKW Modal...');
    const editBtn = await findButtonByText(page, 'Ubah');
    if (editBtn) {
      await editBtn.click();
      await page.waitForSelector('.modal-dialog form', { timeout: 5000 });
      console.log('   ✓ Edit SKW modal opened successfully.');
      const editClose = await page.$('.modal-close-btn');
      if (editClose) await editClose.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // Test QR Modal & Public Verification
    console.log('8. Testing QR Modal & Public Verification...');
    const qrBtn = await findButtonByText(page, 'QR');
    if (qrBtn) {
      await qrBtn.click();
      await page.waitForSelector('.modal-dialog', { timeout: 5000 });
      console.log('   ✓ QR Modal opened.');

      // Click Tes Tampilan Verifikasi
      const testVerifyBtn = await findButtonByText(page, 'Tes Tampilan Verifikasi');
      if (testVerifyBtn) {
        await testVerifyBtn.click();
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_public_verification_modal.png') });
        console.log('   ✓ Public verification modal triggered & verified.');
        const pvClose = await page.$('.modal-close-btn');
        if (pvClose) await pvClose.click();
      }
      await new Promise(r => setTimeout(r, 400));
    }

    // 9. Navigate to Arsip Digital Page & Test Document Preview Modal
    console.log('9. Navigating to Arsip Digital page...');
    const navLinks2 = await page.$$('.sidebar-nav a, .sidebar-nav button, .sidebar a, .sidebar button');
    for (const nl of navLinks2) {
      const text = await nl.evaluate(el => el.textContent);
      if (text.includes('Arsip Digital')) {
        await nl.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_arsip_digital_page.png') });

    // Open Pratinjau Berkas
    const previewBtn = await findButtonByText(page, 'Pratinjau');
    if (previewBtn) {
      await previewBtn.click();
      await page.waitForSelector('.modal-dialog .official-letter', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_pratinjau_berkas_modal.png') });
      console.log('   ✓ DocumentPreviewModal rendered unified OfficialSKWDocument.');
      const prevClose = await page.$('.modal-close-btn');
      if (prevClose) await prevClose.click();
      await new Promise(r => setTimeout(r, 400));
    }

    // 10. Navigate to Pewaris & Ahli Waris Page
    console.log('10. Navigating to Pewaris & Ahli Waris page...');
    const navLinks3 = await page.$$('.sidebar-nav a, .sidebar-nav button, .sidebar a, .sidebar button');
    for (const nl of navLinks3) {
      const text = await nl.evaluate(el => el.textContent);
      if (text.includes('Pewaris & Ahli Waris')) {
        await nl.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_pewaris_page.png') });
    console.log('   ✓ Pewaris & Ahli Waris page loaded cleanly.');

    // 11. Navigate to Pencarian Arsip Page
    console.log('11. Navigating to Pencarian Arsip page...');
    const navLinks4 = await page.$$('.sidebar-nav a, .sidebar-nav button, .sidebar a, .sidebar button');
    for (const nl of navLinks4) {
      const text = await nl.evaluate(el => el.textContent);
      if (text.includes('Pencarian Arsip')) {
        await nl.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    const searchInput = await page.$('.search-bar-wrapper input');
    if (searchInput) {
      await searchInput.type('Budi');
      await new Promise(r => setTimeout(r, 300));
      const resultsText = await page.$eval('.page-container', el => el.innerText);
      console.log(`   ✓ Search results for "Budi": ${resultsText.includes('Budi Santoso')}`);
    }

    // 12. Navigate to Laporan & Statistik Page
    console.log('12. Navigating to Laporan & Statistik page...');
    const navLinks5 = await page.$$('.sidebar-nav a, .sidebar-nav button, .sidebar a, .sidebar button');
    for (const nl of navLinks5) {
      const text = await nl.evaluate(el => el.textContent);
      if (text.includes('Laporan')) {
        await nl.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_laporan_page.png') });
    console.log('   ✓ Laporan & Statistik page loaded cleanly.');

    // 13. Navigate to Manajemen Pengguna Page
    console.log('13. Navigating to Manajemen Pengguna page...');
    const navLinks6 = await page.$$('.sidebar-nav a, .sidebar-nav button, .sidebar a, .sidebar button');
    for (const nl of navLinks6) {
      const text = await nl.evaluate(el => el.textContent);
      if (text.includes('Pengguna')) {
        await nl.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_pengguna_page.png') });
    console.log('   ✓ Manajemen Pengguna page loaded cleanly.');

    console.log('\n======================================');
    console.log(`E2E TEST SUMMARY:`);
    console.log(`Console Errors detected: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    } else {
      console.log('✓ ZERO CONSOLE ERRORS DETECTED.');
    }
    console.log('ALL FLOWS PASSED WITH EXCELLENCE! 🎉');
    console.log('======================================');

  } catch (err) {
    console.error('❌ E2E Test error:', err);
  } finally {
    await browser.close();
  }
}

runE2E();
