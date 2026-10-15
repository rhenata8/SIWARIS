const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = 'https://giddy-mule-928.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function check() {
  const archives = await client.query('skw:getArchives', {});
  console.log(`Total archives: ${archives.length}`);
  
  const matches = archives.filter(a => 
    a.idArsip.includes('0012') || 
    a.idArsip.includes('0013') || 
    a.namaPewaris.toLowerCase().includes('amini') ||
    a.nomorSKW.includes('0759')
  );
  
  console.log('Matches:', JSON.stringify(matches, null, 2));

  // Also check all archives around 10 to 15
  const around = archives.filter(a => {
    const seq = parseInt(a.idArsip.split('-')[3] || '0', 10);
    return seq >= 10 && seq <= 15;
  });
  console.log('\nArchives seq 10..15:');
  around.forEach(a => {
    console.log(`ID: ${a.idArsip} | _id: ${a._id} | created: ${new Date(a._creationTime).toISOString()} | SKW: ${a.nomorSKW} | Pewaris: ${a.namaPewaris} | Pemohon: ${a.namaPemohon}`);
  });
}

check().catch(console.error);
