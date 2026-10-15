const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = 'https://giddy-mule-928.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function checkAll() {
  const archives = await client.query('skw:getArchives', {});
  // sort by createdAt ascending
  archives.sort((a, b) => a.createdAt - b.createdAt);
  
  console.log(`Total archives: ${archives.length}\n`);
  let prevTime = null;
  archives.forEach((a, index) => {
    const d = new Date(a.createdAt);
    const timeStr = d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
    const dateStr = d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    const diff = prevTime ? ((a.createdAt - prevTime) / 1000).toFixed(1) + 's' : 'first';
    prevTime = a.createdAt;
    console.log(`[#${index+1}] ID: ${a.idArsip} | Date: ${dateStr} ${timeStr} (diff: ${diff.padStart(7)}) | SKW: ${a.nomorSKW.padEnd(35)} | Pewaris: ${a.namaPewaris.padEnd(20)} | file: ${a.fileName}`);
  });
}

checkAll().catch(console.error);
