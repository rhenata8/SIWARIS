const { ConvexHttpClient } = require('convex/browser');

const CONVEX_URL = 'https://giddy-mule-928.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

async function checkDuplicates() {
  const archives = await client.query('skw:getArchives', {});
  console.log(`Checking ${archives.length} archives...`);

  const skwMap = new Map();
  const pewarisMap = new Map();
  const fileMap = new Map();

  for (const a of archives) {
    // skw
    if (!skwMap.has(a.nomorSKW)) skwMap.set(a.nomorSKW, []);
    skwMap.get(a.nomorSKW).push(a);

    // pewaris
    if (!pewarisMap.has(a.namaPewaris.toLowerCase())) pewarisMap.set(a.namaPewaris.toLowerCase(), []);
    pewarisMap.get(a.namaPewaris.toLowerCase()).push(a);

    // file
    if (a.fileName) {
      if (!fileMap.has(a.fileName)) fileMap.set(a.fileName, []);
      fileMap.get(a.fileName).push(a);
    }
  }

  console.log('\n--- Duplicate nomorSKW ---');
  let dupSkw = 0;
  for (const [skw, list] of skwMap) {
    if (list.length > 1) {
      dupSkw++;
      console.log(`SKW: ${skw} (x${list.length}) -> IDs: ${list.map(x => x.idArsip).join(', ')}`);
    }
  }
  if (dupSkw === 0) console.log('None!');

  console.log('\n--- Duplicate namaPewaris ---');
  let dupPewaris = 0;
  for (const [name, list] of pewarisMap) {
    if (list.length > 1) {
      dupPewaris++;
      console.log(`Pewaris: ${name} (x${list.length}) -> IDs: ${list.map(x => x.idArsip).join(', ')} | SKWs: ${list.map(x => x.nomorSKW).join(', ')}`);
    }
  }
  if (dupPewaris === 0) console.log('None!');

  console.log('\n--- Duplicate fileName ---');
  let dupFiles = 0;
  for (const [file, list] of fileMap) {
    if (list.length > 1) {
      dupFiles++;
      console.log(`File: ${file} (x${list.length}) -> IDs: ${list.map(x => x.idArsip).join(', ')} | Pewaris: ${list.map(x => x.namaPewaris).join(', ')}`);
    }
  }
  if (dupFiles === 0) console.log('None!');
}

checkDuplicates().catch(console.error);
