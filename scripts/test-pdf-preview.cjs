const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

async function testPdfAndPreview() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });

  // 1. Open dashboard and open detail modal
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Find detail button
  const btns = await page.$$('table.custom-table button');
  for (const b of btns) {
    const text = await b.evaluate(el => el.textContent);
    if (text.includes('Detail')) {
      await b.click();
      break;
    }
  }

  await page.waitForSelector('.modal-dialog', { timeout: 5000 });

  // Switch to Format Surat Resmi tab
  const headerBtns = await page.$$('.modal-header button');
  for (const hb of headerBtns) {
    const text = await hb.evaluate(el => el.textContent);
    if (text.includes('Format Surat Resmi')) {
      await hb.click();
      break;
    }
  }

  await page.waitForSelector('.official-letter', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 600));

  // Scroll the modal body to the bottom to see TTE and verification box clearly
  await page.$eval('.modal-body', el => {
    el.scrollTop = el.scrollHeight;
  });
  await new Promise(r => setTimeout(r, 300));

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'preview_letter_footer.png') });
  console.log('Saved preview_letter_footer.png');

  // Let's also trigger PDF download and capture download
  const client = await page.target().createCDPSession();
  const downloadPath = path.resolve(__dirname, 'downloads');
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  // Find Unduh PDF Asli button
  const modalFooterBtns = await page.$$('.modal-footer button');
  for (const b of modalFooterBtns) {
    const text = await b.evaluate(el => el.textContent);
    if (text.includes('Unduh PDF Asli')) {
      await b.click();
      break;
    }
  }

  // Wait for file to download
  let downloadedFile = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    const files = fs.readdirSync(downloadPath);
    const pdfs = files.filter(f => f.endsWith('.pdf'));
    if (pdfs.length > 0) {
      downloadedFile = path.join(downloadPath, pdfs[0]);
      break;
    }
  }

  console.log('Downloaded PDF:', downloadedFile);

  if (downloadedFile) {
    // Open the downloaded PDF in Edge
    const pdfPage = await browser.newPage();
    await pdfPage.setViewport({ width: 1200, height: 1400 });
    const pdfUrl = 'file:///' + downloadedFile.replace(/\\/g, '/');
    console.log('Navigating to PDF URL:', pdfUrl);
    await pdfPage.goto(pdfUrl, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 2000));
    await pdfPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'pdf_rendered_in_edge.png') });
    console.log('Saved pdf_rendered_in_edge.png');
  }

  await browser.close();
}

testPdfAndPreview().catch(err => {
  console.error(err);
  process.exit(1);
});
