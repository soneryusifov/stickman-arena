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
  for (const f of ['league', 'wins', 'duels', 'wkv', 'mov']) await users.createIndex({ ['rank.' + f]: -1 });
  const q = (f, filter, op) => ({ ['rank.' + f]: op, ...Object.fromEntries(Object.entries(filter || {}).map(([k, v]) => ['rank.' + k, v])) });
  return {
    // sıralama: değeri 0'dan büyük olanlar, büyükten küçüğe; eşitlikte önce ulaşan önde
    top: (f, n, filter) => users.find(q(f, filter, { $gt: 0 }), { projection: { name: 1, rank: 1 } }).sort({ ['rank.' + f]: -1, savedAt: 1 }).limit(n).toArray(),
    above: (f, v, filter) => users.countDocuments(q(f, filter, { $gt: v })),
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
  const match = (u, filter) => Object.entries(filter || {}).every(([k, v]) => (u.rank || {})[k] === v);
  return {
    kind: 'yerel dosya (' + file + ')',
    get: async id => clone(map.get(id)),
    byToken: async h => clone([...map.values()].find(u => (u.tokens || []).some(x => x.hash === h))),
    insert: async u => { if (map.has(u._id)) return false; map.set(u._id, clone(u)); later(); return true; },
    put: async u => { map.set(u._id, clone(u)); later(); },
    top: async (f, n, filter) => [...map.values()].filter(u => (u.rank || {})[f] > 0 && match(u, filter)).sort((a, b) => b.rank[f] - a.rank[f] || a.savedAt - b.savedAt).slice(0, n).map(u => ({ name: u.name, rank: u.rank })),
    above: async (f, v, filter) => [...map.values()].filter(u => (u.rank || {})[f] > v && match(u, filter)).length,
  };
}

async function openStore() {
  if (process.env.MONGODB_URI) return mongoStore(process.env.MONGODB_URI);
  return fileStore(path.join(__dirname, 'data', 'users.json'));
}
module.exports = { openStore };
