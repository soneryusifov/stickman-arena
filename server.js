// Stickman Arena sunucusu: oyun dosyalarını sunar ve WebSocket ile lobi/düello mesajlarını taşır.
// Savaşı sunucu hesaplamaz; iki tarayıcı ortak tohumla aynı sonucu bulur. Sunucu yalnızca
// kim nerede (oda + presence) ve oyuncular arası mesajlar (emit) ile ilgilenir.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { openStore } = require('./store');
const { makeApi, userByToken } = require('./accounts');

// hesap deposu (MongoDB ya da yerel dosya); açılana dek /api 503 döner
let store = null, api = null;
openStore().then(s => { store = s; api = makeApi(s); console.log('Kullanıcı deposu: ' + s.kind); })
  .catch(e => console.error('Kullanıcı deposu açılamadı:', e.message));

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

/* ---------------- statik dosyalar ---------------- */
const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.startsWith('/api/')) {
    if (!api) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end('{"error":"Sunucu hazırlanıyor"}'); }
    return api(req, res, p);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (p === '/healthz') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'content-length': st.size,
      // sayfa her zaman taze, görseller ve sesler bir gün önbellekte
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

/* ---------------- lobi ---------------- */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 8 * 1024 });
const clients = new Map();            // peer -> client
const rooms = new Map();              // oda adı -> Set(peer)
const GRACE_MS = 10000;               // kısa kopmalarda oyuncu 10 sn odada kalır
const ROOM_RE = /^(lobby|duel-[a-z0-9]{1,16})$/;
const ID_RE = /^[a-z0-9]{8,32}$/;
const cleanName = s => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 20) || 'Oyuncu';

function send(c, m) { if (c.ws && c.ws.readyState === 1) c.ws.send(JSON.stringify(m)); }

// oda listesi değişince herkese tek seferde gönder (aynı anda gelen değişiklikleri birleştir)
const dirty = new Set();
let flushT = null;
function markDirty(room) {
  dirty.add(room);
  if (!flushT) flushT = setTimeout(() => {
    flushT = null;
    for (const r of dirty) {
      const set = rooms.get(r); if (!set) continue;
      const peers = [...set].map(id => clients.get(id)).filter(Boolean)
        .map(c => ({ peer: c.peer, by: c.peer, name: c.name, presence: c.presence[r] || {} }));
      for (const id of set) { const c = clients.get(id); if (c) send(c, { op: 'peers', room: r, peers }); }
    }
    dirty.clear();
  }, 80);
}
function join(c, r) {
  if (!rooms.has(r)) rooms.set(r, new Set());
  const set = rooms.get(r);
  if (r !== 'lobby' && set.size >= 2 && !set.has(c.peer)) return false; // düello odası 2 kişilik
  set.add(c.peer); c.rooms.add(r); markDirty(r); return true;
}
function leave(c, r) {
  const set = rooms.get(r); c.rooms.delete(r); delete c.presence[r];
  if (!set) return;
  set.delete(c.peer);
  if (!set.size) rooms.delete(r); else markDirty(r);
}
function drop(c) { for (const r of [...c.rooms]) leave(c, r); clients.delete(c.peer); }

wss.on('connection', ws => {
  let c = null;
  let tokens = 40, last = Date.now();         // basit hız sınırı: saniyede ~8 mesaj, 40'lık birikim
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    const now = Date.now(); tokens = Math.min(40, tokens + (now - last) / 125); last = now;
    if (tokens < 1) return; tokens--;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;

    if (m.op === 'hello') {
      if (c || !ID_RE.test(m.peer) || typeof m.key !== 'string' || m.key.length < 16) return ws.close();
      const old = clients.get(m.peer);
      if (old) {
        if (old.key !== m.key) return ws.close();      // başkasının kimliğini alamaz
        clearTimeout(old.gone); if (old.ws && old.ws !== ws) old.ws.terminate();
        c = old; c.ws = ws; c.name = cleanName(m.name);
      } else {
        c = { peer: m.peer, key: m.key, name: cleanName(m.name), ws, rooms: new Set(), presence: {}, gone: null };
        clients.set(c.peer, c);
      }
      send(c, { op: 'welcome', peer: c.peer });
      join(c, 'lobby');
      for (const r of c.rooms) markDirty(r);
      // giriş yapmış oyuncunun adı hesaptan gelir, istemcinin yazdığı ad yok sayılır
      if (m.token && store) {
        const cc = c;
        userByToken(store, m.token).then(u => { if (u && clients.get(cc.peer) === cc) { cc.name = u.name; cc.verified = true; for (const r of cc.rooms) markDirty(r); } }).catch(() => {});
      }
      return;
    }
    if (!c) return;
    const r = m.room;
    if (m.op === 'bye') { clearTimeout(c.gone); drop(c); c = null; return ws.close(); } // sayfa kapandı: beklemeden çık
    if (m.op === 'name') { if (c.verified) return; c.name = cleanName(m.name); for (const x of c.rooms) markDirty(x); }
    else if (m.op === 'join' && typeof r === 'string' && ROOM_RE.test(r) && r !== 'lobby') {
      if (!join(c, r)) send(c, { op: 'full', room: r });
    }
    else if (m.op === 'leave' && c.rooms.has(r) && r !== 'lobby') leave(c, r);
    else if (m.op === 'presence' && c.rooms.has(r) && m.data && typeof m.data === 'object') {
      if (JSON.stringify(m.data).length > 1024) return;
      c.presence[r] = m.data; markDirty(r);
    }
    else if (m.op === 'emit' && c.rooms.has(r) && typeof m.topic === 'string' && m.topic.length <= 16) {
      const out = JSON.stringify({ op: 'event', room: r, topic: m.topic, data: m.data, peer: c.peer, by: c.peer });
      for (const id of rooms.get(r) || []) { const o = clients.get(id); if (o && o !== c && o.ws && o.ws.readyState === 1) o.ws.send(out); }
    }
  });
  ws.on('close', () => {
    if (!c || c.ws !== ws) return;
    c.ws = null;
    c.gone = setTimeout(() => drop(c), GRACE_MS);
  });
});

// ölü bağlantıları temizle (Render boşta kalan bağlantıyı kesmesin diye de ping atar)
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); }
}, 25000);

server.listen(PORT, () => console.log('Stickman Arena http://localhost:' + PORT));
