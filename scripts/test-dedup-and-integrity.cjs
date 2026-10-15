/**
 * SIWARIS — Integration Test & Deduplication Script
 * 
 * Tests:
 * 1. Deduplication: run deduplicateArchives and verify no duplicates remain
 * 2. Reassign IDs: run reassignArchiveIds and verify sequential IDs
 * 3. Concurrent insert: simulate race condition and verify unique IDs
 * 4. Stats accuracy: verify dashboard stats match actual DB count
 * 
 * Usage:
 *   CONVEX_DEPLOY_KEY=prod:... node scripts/test-dedup-and-integrity.cjs
 */

const { ConvexHttpClient } = require('convex/browser');

const DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY || '';
const CONVEX_URL = 'https://giddy-mule-928.convex.cloud';

if (!CONVEX_URL) {
  console.error('❌ CONVEX_URL is required');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Inline API references (mirrors convex/_generated/api)
const api = {
  skw: {
    getArchives: 'skw:getArchives',
    getStats: 'skw:getStats',
    createArchive: 'skw:createArchive',
    deleteArchive: 'skw:deleteArchive',
    deduplicateArchives: 'skw:deduplicateArchives',
    reassignArchiveIds: 'skw:reassignArchiveIds',
  },
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log(' SIWARIS — Integrity & Deduplication Test Suite');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`🔗 Connecting to: ${CONVEX_URL}`);

  // ─── TEST 1: Get initial state ────────────────────────────────────────────
  console.log('\n📊 TEST 1: Initial State Analysis');
  const before = await client.query(api.skw.getArchives, {});
  console.log(`  Total records in DB: ${before.length}`);

  const idGroups = {};
  for (const a of before) {
    idGroups[a.idArsip] = (idGroups[a.idArsip] || 0) + 1;
  }
  const duplicateIds = Object.entries(idGroups).filter(([, cnt]) => cnt > 1);
  console.log(`  Duplicate idArsip groups: ${duplicateIds.length}`);
  for (const [id, cnt] of duplicateIds) {
    console.log(`    ⚠️  ${id} appears ${cnt} times`);
  }

  // ─── TEST 2: Run Deduplication ────────────────────────────────────────────
  console.log('\n🧹 TEST 2: Deduplication Mutation');
  const dedupResult = await client.mutation(api.skw.deduplicateArchives, {});
  console.log(`  Deleted ${dedupResult.deleted} duplicate records`);

  const afterDedup = await client.query(api.skw.getArchives, {});
  const idGroupsAfter = {};
  for (const a of afterDedup) {
    idGroupsAfter[a.idArsip] = (idGroupsAfter[a.idArsip] || 0) + 1;
  }
  const dupsAfter = Object.entries(idGroupsAfter).filter(([, cnt]) => cnt > 1);
  assert(dupsAfter.length === 0, `No duplicate idArsip after deduplication (found: ${dupsAfter.length})`);
  assert(afterDedup.length === before.length - dedupResult.deleted, `Record count matches (expected ${before.length - dedupResult.deleted}, got ${afterDedup.length})`);

  // ─── TEST 3: Reassign IDs ─────────────────────────────────────────────────
  console.log('\n🔢 TEST 3: Reassign Sequential IDs');
  const reassignResult = await client.mutation(api.skw.reassignArchiveIds, {});
  console.log(`  Updated ${reassignResult.updated} ID assignments`);
  if (reassignResult.changes && reassignResult.changes.length > 0) {
    for (const c of reassignResult.changes) {
      console.log(`    ${c.oldId} → ${c.newId}`);
    }
  }

  const afterReassign = await client.query(api.skw.getArchives, {});
  
  // Check sequential IDs per year
  const byYear = {};
  for (const a of afterReassign) {
    if (!byYear[a.tahun]) byYear[a.tahun] = [];
    byYear[a.tahun].push(a.idArsip);
  }

  let allSequential = true;
  for (const [year, ids] of Object.entries(byYear)) {
    const nums = ids.map((id) => {
      const parts = id.split('-');
      return parseInt(parts[3], 10);
    }).filter(n => !isNaN(n)).sort((a, b) => a - b);
    
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== i + 1) {
        allSequential = false;
        console.log(`    ⚠️  Year ${year}: expected seq ${i + 1} but got ${nums[i]}`);
      }
    }
  }
  assert(allSequential, 'All IDs are sequential within each year (no gaps, no duplicates)');

  // Check uniqueness
  const allIds = afterReassign.map((a) => a.idArsip);
  const uniqueIds = new Set(allIds);
  assert(uniqueIds.size === allIds.length, `All ${allIds.length} idArsip values are unique`);

  // ─── TEST 4: Concurrent Insert (Race Condition Simulation) ────────────────
  console.log('\n⚡ TEST 4: Concurrent Insert (Race Condition Test)');
  const currentCount = afterReassign.length;

  const testData = (n) => ({
    nomorSKW: `TEST/CONCURRENT-${n}/2026`,
    namaPewaris: `Test Concurrent ${n}`,
    nikPewaris: `9999000000000${String(n).padStart(3, '0')}`,
    tanggalSurat: '2026-10-15',
    tanggalMeninggal: '2026-10-10',
    jumlahAhliWaris: 1,
    ahliWarisList: [{ nama: `Ahli ${n}`, hubungan: 'Anak Kandung', nik: '' }],
    status: 'Tersimpan',
    catatan: 'Concurrent test record — will be deleted',
    tahun: 2026,
  });

  // Fire 5 concurrent inserts simultaneously
  console.log('  Firing 5 concurrent createArchive mutations...');
  const concurrentResults = await Promise.all([
    client.mutation(api.skw.createArchive, testData(1)),
    client.mutation(api.skw.createArchive, testData(2)),
    client.mutation(api.skw.createArchive, testData(3)),
    client.mutation(api.skw.createArchive, testData(4)),
    client.mutation(api.skw.createArchive, testData(5)),
  ]);

  const newIds = concurrentResults.map((r) => r.idArsip);
  console.log(`  Generated IDs: ${newIds.join(', ')}`);

  const uniqueNewIds = new Set(newIds);
  assert(uniqueNewIds.size === 5, `All 5 concurrent inserts got unique idArsip (got ${uniqueNewIds.size} unique)`);

  const afterConcurrent = await client.query(api.skw.getArchives, {});
  assert(afterConcurrent.length === currentCount + 5, `DB count is correct after concurrent insert (expected ${currentCount + 5}, got ${afterConcurrent.length})`);

  // ─── Cleanup: Delete test records ─────────────────────────────────────────
  console.log('\n🗑️  Cleaning up test records...');
  for (const r of concurrentResults) {
    await client.mutation(api.skw.deleteArchive, { id: r.id });
  }
  const afterCleanup = await client.query(api.skw.getArchives, {});
  assert(afterCleanup.length === currentCount, `Cleanup successful: back to ${currentCount} records`);

  // ─── TEST 5: Stats Accuracy ───────────────────────────────────────────────
  console.log('\n📈 TEST 5: Dashboard Stats Accuracy');
  const finalArchives = await client.query(api.skw.getArchives, {});
  const stats = await client.query(api.skw.getStats, {});

  assert(stats.totalSKW === finalArchives.length, `Stats.totalSKW (${stats.totalSKW}) matches actual DB count (${finalArchives.length})`);

  const actualAhliWaris = finalArchives.reduce((acc, a) => acc + (a.jumlahAhliWaris || 0), 0);
  assert(stats.totalAhliWaris === actualAhliWaris, `Stats.totalAhliWaris (${stats.totalAhliWaris}) matches computed (${actualAhliWaris})`);

  const currentYear = new Date().getFullYear();
  const actualThisYear = finalArchives.filter((a) => a.tahun === currentYear).length;
  assert(stats.thisYearCount === actualThisYear, `Stats.thisYearCount (${stats.thisYearCount}) matches computed (${actualThisYear})`);

  // ─── TEST 6: No Duplicate nomorSKW ───────────────────────────────────────
  console.log('\n🔍 TEST 6: NomorSKW Uniqueness Check');
  const nomorGroups = {};
  for (const a of finalArchives) {
    nomorGroups[a.nomorSKW] = (nomorGroups[a.nomorSKW] || 0) + 1;
  }
  const dupNomors = Object.entries(nomorGroups).filter(([, cnt]) => cnt > 1);
  if (dupNomors.length > 0) {
    console.log(`  ⚠️  WARNING: Duplicate nomorSKW detected (${dupNomors.length} groups):`);
    for (const [nom, cnt] of dupNomors) {
      console.log(`    "${nom}" appears ${cnt} times`);
    }
  }
  assert(dupNomors.length === 0, `No duplicate nomorSKW in database (found ${dupNomors.length} duplicates)`);

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(` TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
