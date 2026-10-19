// Hesaplar ve bulut kaydı: /api/register, /api/login, /api/logout, /api/me, /api/save
// Şifreler scrypt ile tuzlanıp saklanır; oturum anahtarı (token) yalnızca SHA-256 özeti olarak tutulur.
const crypto = require('crypto');

const TOKEN_DAYS = 60, MAX_TOKENS = 5, MAX_BODY = 64 * 1024;
const ADMINS = new Set(String(process.env.ADMIN_USERS || '').split(',').map(s => s.trim().toLocaleLowerCase('tr')).filter(Boolean));
// oyundaki fiyatlar (stickman-arena.html ile aynı olmalı): harcanmadan seviye atlanamasın
const UP_COST = [0, 60, 100, 150, 220, 300, 400, 520, 660, 820];
const HALL_COST = [0, 400, 800, 1400, 2200, 3200, 4500, 6000];
const MINE_COST = [0, 200, 400, 700, 1100, 1600, 2200, 3000];
const ALCH_COST = [0, 250, 500, 850, 1300, 1900, 2600, 3500];
const ITEMS = ['head', 'chest', 'sleeve', 'bracer', 'glove', 'knee', 'boot', 'main', 'off', 'cape'];
// eşya satışı (oyundaki SHOP_PRICE / SELL_PRICE ile aynı): tüccar fiyatının yarısı
const ITEM_W = { head: .74, chest: 1.36, sleeve: .42, bracer: .75, glove: .86, knee: .53, boot: .34, main: 3.08, off: 1.49, cape: .43 };
const SHOP_PRICE = (k, n) => n <= 1 ? 0 : Math.round(900 * 2 ** (n - 2) * ITEM_W[k] / 10) * 10;
const SELL = (k, n) => Math.floor(SHOP_PRICE(k, n) / 2), MAX_SALE = SELL('main', 10);
// iki kayıt arasında satıştan gelebilecek en fazla altın: dövülüp hemen satılmış olabilecek her eşya en pahalısı kadar,
// envanterden eksilen eşyalar kendi yarı fiyatı kadar
function saleAllowance(prev, next) {
  const forged = Math.max(0, ((next.stats || {}).upgrades || 0) - ((prev.stats || {}).upgrades || 0), (prev.hammers || 0) - (next.hammers || 0));
  const left = new Map(); for (const it of next.items || []) { const k = it.c + it.k + it.n; left.set(k, (left.get(k) || 0) + 1); }
  let v = Math.min(forged, 5000) * MAX_SALE;
  for (const it of prev.items || []) { const k = it.c + it.k + it.n; if (left.get(k) > 0) left.set(k, left.get(k) - 1); else v += SELL(it.k, it.n); }
  return v;
}

const nameKey = n => n.toLocaleLowerCase('tr');
const NAME_RE = /^[\p{L}\p{N}_]{3,16}$/u;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const scrypt = (pass, salt) => new Promise((res, rej) => crypto.scrypt(pass, salt, 64, (e, k) => e ? rej(e) : res(k.toString('hex'))));
const int = (v, lo, hi, d) => { v = Math.floor(Number(v)); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };

// gelen kaydı bilinen alanlarla ve sınırlarla yeniden kurar
function cleanSave(s) {
  if (!s || typeof s !== 'object') return null;
  const gear = {};
  for (const [cls, g] of Object.entries(s.gear || {}).slice(0, 30)) {
    if (!/^[a-z]{2,16}$/.test(cls) || !g || typeof g !== 'object') continue;
    gear[cls] = Object.fromEntries(ITEMS.map(k => [k, int(g[k], 1, 10, 1)]));
  }
  const t = s.town || {};
  const out = {
    gold: int(s.gold, 0, 1e9, 0), gear, league: int(s.league, 0, 10000, 0),
    town: { hall: int(t.hall, 1, 8, 1), mine: int(t.mine, 1, 8, 1), alch: int(t.alch, 1, 8, 1), mineAt: int(t.mineAt, 0, 9e15, Date.now()) },
    stats: s.stats && typeof s.stats === 'object' ? s.stats : {}, ach: s.ach && typeof s.ach === 'object' ? s.ach : {},
    daily: s.daily && typeof s.daily === 'object' ? s.daily : null, _t: int(s._t, 0, 9e15, Date.now()), xp: int(s.xp, 0, 1e9, 0),
    forest: { best: int((s.forest || {}).best, 0, 10, 0), mats: Object.fromEntries(['pelt', 'silk', 'ess', 'relic'].map(m => [m, int(((s.forest || {}).mats || {})[m], 0, 1e6, 0)])) },
    // dövme: çekiç, çekiç parçası ve envanterdeki eşyalar ({ c: sınıf, k: yuva, n: kademe, new? })
    hammers: int(s.hammers, 0, 1e7, 1), shards: int(s.shards, 0, 1e6, 0),
    items: (Array.isArray(s.items) ? s.items : []).slice(0, 200).filter(it => it && /^[a-z]{2,16}$/.test(it.c) && ITEMS.includes(it.k))
      .map(it => ({ c: it.c, k: it.k, n: int(it.n, 1, 10, 1), ...(it.new ? { new: 1 } : {}) })),
    invSeen: Object.fromEntries(['pelt', 'silk', 'ess', 'relic'].map(m => [m, int((s.invSeen || {})[m], 0, 1e6, 0)])),
  };
  if (out.stats) for (const k of ['wins', 'battles', 'duelWins', 'teamWins']) if (k in out.stats) out.stats[k] = int(out.stats[k], 0, 1e7, 0);
  return JSON.stringify(out).length > 32 * 1024 ? null : out;
}
// sıralama değerleri (her kayıtta belgeye yazılır, sıralama bunlardan yapılır).
// Haftalık/aylık: o dönemde KAZANILAN lig puanı (wk/mo dönem anahtarı, wkv/mov puan); dönem değişince sıfırdan başlar.
const RANKS = ['league', 'wins', 'duels', 'week', 'month'];
const weekKey = (d = new Date()) => { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())), day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = t.getUTCFullYear(); return y + '-H' + Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); };
const monthKey = (d = new Date()) => d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1);
function rankOf(s, prevRank, gained = 0) {
  const r = { league: (s && s.league) || 0, wins: (s && s.stats && s.stats.wins) || 0, duels: (s && s.stats && s.stats.duelWins) || 0 };
  const p = prevRank || {}, wk = weekKey(), mo = monthKey();
  r.wk = wk; r.wkv = (p.wk === wk ? p.wkv || 0 : 0) + gained;
  r.mo = mo; r.mov = (p.mo === mo ? p.mov || 0 : 0) + gained;
  return r;
}
// sıralama sorgusu: hangi alan, hangi dönem
const BOARD = { league: ['league', null], wins: ['wins', null], duels: ['duels', null], week: ['wkv', () => ({ wk: weekKey() })], month: ['mov', () => ({ mo: monthKey() })] };
// eskiden yeniye geçerken yükseltmelere harcanması gereken altın
function spent(a, b) {
  let sum = 0;
  const up = (table, from, to) => { for (let n = from; n < to; n++) sum += table[n] || 0; };
  for (const cls of Object.keys(b.gear)) for (const k of ITEMS) up(UP_COST, (a.gear[cls] || {})[k] || 1, b.gear[cls][k]);
  up(HALL_COST, a.town.hall, b.town.hall); up(MINE_COST, a.town.mine, b.town.mine); up(ALCH_COST, a.town.alch, b.town.alch);
  return sum;
}

function makeApi(store) {
  const hits = new Map(); // ip -> [zamanlar]: giriş/kayıt denemesi sınırı
  const limited = ip => { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 10; };
  async function issue(u) {
    const token = crypto.randomBytes(32).toString('hex');
    u.tokens = [...(u.tokens || []).filter(x => x.exp > Date.now()), { hash: sha(token), exp: Date.now() + TOKEN_DAYS * 864e5 }].slice(-MAX_TOKENS);
    await store.put(u);
    return token;
  }
  async function auth(req) {
    const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
    if (!m) return null;
    const u = await store.byToken(sha(m[1]));
    return u && u.tokens.some(x => x.hash === sha(m[1]) && x.exp > Date.now()) ? u : null;
  }
  const view = u => ({ name: u.name, admin: ADMINS.has(u._id), save: u.save || null });
  const board = {}; // sıralama önbelleği

  return async function handle(req, res, p) {
    const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      let raw = '';
      for await (const c of req) { raw += c; if (raw.length > MAX_BODY) return send(413, { error: 'Çok büyük' }); }
      try { body = JSON.parse(raw || '{}'); } catch (e) { return send(400, { error: 'Bozuk istek' }); }
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];
    try {
      if (p === '/api/health') return send(200, { ok: true, db: store.kind.startsWith('MongoDB') ? 'kalıcı' : 'geçici' });

      if (p === '/api/register' && req.method === 'POST') {
        if (limited(ip)) return send(429, { error: 'Çok fazla deneme, bir dakika bekle.' });
        const name = String(body.name || '').trim(), pass = String(body.pass || '');
        if (!NAME_RE.test(name)) return send(400, { error: 'Kullanıcı adı 3-16 harf, rakam ya da _ olmalı.' });
        if (pass.length < 6 || pass.length > 64) return send(400, { error: 'Şifre 6-64 karakter olmalı.' });
        const salt = crypto.randomBytes(16).toString('hex');
        // misafirken yapılan ilerleme doğrulanamaz: hesaba aktarılırken makul sınırlara çekilir
        const save = cleanSave(body.save);
        if (save) {
          save.gold = Math.min(save.gold, 20000); save.league = Math.min(save.league, 27);
          save.town.hall = Math.min(save.town.hall, 4); save.town.mine = Math.min(save.town.mine, save.town.hall); save.town.alch = Math.min(save.town.alch, save.town.hall);
          for (const g of Object.values(save.gear)) for (const k of ITEMS) g[k] = Math.min(g[k], save.town.hall + 2);
          if (save.stats) { save.stats.wins = Math.min(save.stats.wins || 0, 300); save.stats.duelWins = 0; save.stats.teamWins = 0; }
          save.xp = Math.min(save.xp || 0, 3000);
        }
        const u = { _id: nameKey(name), name, pass: { salt, hash: await scrypt(pass, salt) }, tokens: [], save, rank: rankOf(save), savedAt: Date.now(), created: Date.now() };
        if (!(await store.insert(u))) return send(409, { error: 'Bu kullanıcı adı alınmış.' });
        return send(200, { token: await issue(u), ...view(u) });
      }
      if (p === '/api/login' && req.method === 'POST') {
        if (limited(ip)) return send(429, { error: 'Çok fazla deneme, bir dakika bekle.' });
        const u = await store.get(nameKey(String(body.name || '').trim()));
        const ok = u && crypto.timingSafeEqual(Buffer.from(await scrypt(String(body.pass || ''), u.pass.salt), 'hex'), Buffer.from(u.pass.hash, 'hex'));
        if (!ok) return send(401, { error: 'Kullanıcı adı ya da şifre yanlış.' });
        return send(200, { token: await issue(u), ...view(u) });
      }

      // sıralama herkese açık; giriş yapan kendi sırasını da görür. İlk 20 kısa süre önbellekte tutulur.
      if (p === '/api/leaderboard') {
        const q = new URL(req.url, 'http://x').searchParams.get('by'), by = RANKS.includes(q) ? q : 'league';
        const [field, per] = BOARD[by], filter = per ? per() : null, c = board[by];
        if (!c || Date.now() - c.t > 15000) board[by] = { t: Date.now(), top: (await store.top(field, 20, filter)).map(x => ({ name: x.name, v: x.rank[field] })) };
        const me = await auth(req), out = { by, top: board[by].top };
        if (me) {
          const r = me.rank || rankOf(me.save), inPer = !filter || Object.entries(filter).every(([k, v]) => r[k] === v), v = inPer ? r[field] || 0 : 0;
          out.me = { name: me.name, v, pos: v > 0 ? (await store.above(field, v, filter)) + 1 : null };
        }
        return send(200, out);
      }

      const u = await auth(req);
      if (!u) return send(401, { error: 'Oturum yok ya da süresi doldu.' });
      if (p === '/api/me') return send(200, view(u));
      if (p === '/api/logout' && req.method === 'POST') {
        const h = sha((req.headers.authorization || '').slice(7)); u.tokens = u.tokens.filter(x => x.hash !== h); await store.put(u); return send(200, { ok: true });
      }
      if (p === '/api/save' && req.method === 'PUT') {
        const next = cleanSave(body.save);
        if (!next) return send(400, { error: 'Kayıt okunamadı.' });
        const prev = u.save ? cleanSave(u.save) : null;
        if (prev && !ADMINS.has(u._id)) {
          // altın, geçen süreye göre makul olandan hızlı artamaz; seviyeler bedelsiz atlanamaz
          const mins = (Date.now() - (u.savedAt || 0)) / 60000;
          const allowed = Math.min(250000, 8000 + mins * 1500) + saleAllowance(prev, next);
          // sıralama değerleri de oynanan süreyle sınırlı: bir savaş en az ~15 sn sürer
          const a = rankOf(prev), b = rankOf(next);
          const badRank = b.wins - a.wins > 5 + mins * 4 || b.duels - a.duels > 2 + mins * 2 || b.league - a.league > b.wins - a.wins + 1 || (next.xp || 0) - (prev.xp || 0) > 200 + mins * 150;
          if (next.gold + spent(prev, next) - prev.gold > allowed || badRank) return send(422, { error: 'Kayıt sunucudakiyle uyuşmuyor.', save: u.save });
        }
        const gained = Math.max(0, (next.league || 0) - ((prev && prev.league) || 0)); // bu kayıtta kazanılan lig puanı
        u.save = next; u.rank = rankOf(next, u.rank, gained); u.savedAt = Date.now(); await store.put(u);
        return send(200, { ok: true, savedAt: u.savedAt });
      }
      return send(404, { error: 'Bulunamadı' });
    } catch (e) {
      console.error('api hatası:', e);
      return send(500, { error: 'Sunucu hatası' });
    }
  };
}
// lobide adı hesaptan doğrulamak için
async function userByToken(store, token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  const u = await store.byToken(sha(token));
  return u && u.tokens.some(x => x.hash === sha(token) && x.exp > Date.now()) ? u : null;
}
module.exports = { makeApi, userByToken };
