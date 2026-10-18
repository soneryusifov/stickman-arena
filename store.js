// Kullanıcı deposu. MONGODB_URI varsa MongoDB (kalıcı), yoksa yerel data/users.json (yalnızca geliştirme:
// Render'ın ücretsiz planında disk her yayında silinir, orada mutlaka MONGODB_URI tanımlı olmalı).
// Kullanıcı belgesi: { _id: küçük harf ad, name, pass: { salt, hash }, tokens: [{ hash, exp }], save, savedAt, created }
const fs = require('fs');
const path = require('path');

async function mongoStore(uri) {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const users = client.db(process.env.MONGODB_DB || 'stickman').collection('users');
  await users.createIndex({ 'tokens.hash': 1 });
  return {
    kind: 'MongoDB',
    get: id => users.findOne({ _id: id }),
    byToken: h => users.findOne({ 'tokens.hash': h }),
    insert: async u => { try { await users.insertOne(u); return true; } catch (e) { if (e.code === 11000) return false; throw e; } },
    put: u => users.replaceOne({ _id: u._id }, u),
  };
}

function fileStore(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const map = new Map();
  try { for (const u of JSON.parse(fs.readFileSync(file, 'utf8'))) map.set(u._id, u); } catch (e) {}
  let t = null;
  const flush = () => { t = null; fs.writeFileSync(file, JSON.stringify([...map.values()])); };
  const later = () => { if (!t) t = setTimeout(flush, 500); };
  const clone = u => u && JSON.parse(JSON.stringify(u));
  return {
    kind: 'yerel dosya (' + file + ')',
    get: async id => clone(map.get(id)),
    byToken: async h => clone([...map.values()].find(u => (u.tokens || []).some(x => x.hash === h))),
    insert: async u => { if (map.has(u._id)) return false; map.set(u._id, clone(u)); later(); return true; },
    put: async u => { map.set(u._id, clone(u)); later(); },
  };
}

async function openStore() {
  if (process.env.MONGODB_URI) return mongoStore(process.env.MONGODB_URI);
  return fileStore(path.join(__dirname, 'data', 'users.json'));
}
module.exports = { openStore };
