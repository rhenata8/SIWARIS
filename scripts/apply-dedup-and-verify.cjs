const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = 'https://giddy-mule-928.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log('--- 1. Running deduplicateArchives ---');
  const dedupRes = await client.mutation('skw:deduplicateArchives', {});
  console.log('Deduplication result:', dedupRes);

  console.log('\n--- 2. Running reassignArchiveIds ---');
  const reassignRes = await client.mutation('skw:reassignArchiveIds', {});
  console.log('Reassign result:', reassignRes);

  console.log('\n--- 3. Verifying all archives ---');
  const archives = await client.query('skw:getArchives', {});
  console.log(`Total archives remaining: ${archives.length}`);

  archives.sort((a, b) => {
    const seqA = parseInt(a.idArsip.split('-')[3] || '0', 10);
    const seqB = parseInt(b.idArsip.split('-')[3] || '0', 10);
    return seqA - seqB;
  });

  archives.forEach((a, idx) => {
    const expectedId = `SW-SBT-2026-${String(idx + 1).padStart(4, '0')}`;
    const idOk = a.idArsip === expectedId ? '✅' : '❌';
    console.log(`${idOk} [${idx + 1}] ${a.idArsip} | SKW: ${a.nomorSKW} | Pewaris: ${a.namaPewaris} | Ahli: ${a.jumlahAhliWaris}`);
  });

  // Verify uniqueness of nomorSKW
  const skwSet = new Set();
  let hasDupSkw = false;
  for (const a of archives) {
    if (skwSet.has(a.nomorSKW)) {
      console.error(`❌ Duplicate SKW found: ${a.nomorSKW}`);
      hasDupSkw = true;
    }
    skwSet.add(a.nomorSKW);
  }
  if (!hasDupSkw) {
    console.log('\n✅ All nomorSKW are 100% UNIQUE!');
  }

  // Verify duplicate nomorSKW rejection
  console.log('\n--- 4. Testing duplicate nomorSKW prevention ---');
  try {
    await client.mutation('skw:createArchive', {
      nomorSKW: '500.17.4.1/0759.PE/425.503.6/2026', // AMINI's SKW
      namaPewaris: 'TEST DUPLICATE',
      nikPewaris: '3574000000000000',
      tanggalSurat: '2026-03-30',
      tanggalMeninggal: '2026-02-20',
      jumlahAhliWaris: 1,
      ahliWarisList: [{ nama: 'Test Ahli', hubungan: 'Anak Kandung' }],
      status: 'Tersimpan',
      tahun: 2026,
    });
    console.error('❌ Expected error for duplicate nomorSKW, but mutation succeeded!');
  } catch (err) {
    console.log('✅ Correctly rejected duplicate nomorSKW:', err.message);
  }
}

main().catch(console.error);
