/* Canavar iskeletleri ve çizimi: parça sayfaları (assets/mon/*_parts), eklemler, hareketler.
   Oyun (stickman-arena.html) ve Karakter Atölyesi (tank-lab.html) bu dosyayı ortak kullanır.
   Dışarıdan: setMonsterData({ id: { h, color, float?, boss? } }) (çizim anında okunur). */
const monEase = t => t * t * (3 - 2 * t);
let MON_DATA = {}; // oyun/atölye setMonsterData ile verir (boy h, renk, float, boss)
function setMonsterData(d) { MON_DATA = d; }
// iskelet görünümü: kemikler (çizgi) ve eklemler (nokta) parçaların üstüne çizilir; kalınlık ekran pikseli
let MON_BONES = false; const setMonsterBones = v => { MON_BONES = !!v; };
function drawBones(x, chains) {
  if (!MON_BONES) return;
  const k = 1 / Math.hypot(x.getTransform().a, x.getTransform().b);
  x.save(); x.filter = 'none'; x.lineCap = x.lineJoin = 'round';
  for (const [pts, col] of chains) {
    x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 7 * k; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
    x.strokeStyle = col || '#4fd8ff'; x.lineWidth = 3.5 * k; x.stroke();
    x.fillStyle = '#fff'; for (const p of pts) { x.beginPath(); x.arc(p[0], p[1], 5 * k, 0, 7); x.fill(); }
  }
  x.restore();
}
// canavar resimleri: assets/mon/<id>.webp (sola bakar); yoksa geçici siluet
const MON_IMG = {};
function loadMonsterImgs(ids) { for (const id of ids) { if (MRIG[id]) continue; const im = new Image(); im.onload = () => { MON_IMG[id] = im; }; im.src = 'assets/mon/' + id + '.webp?v=1'; } }
/* ---------- canavar iskeletleri: her türün kendi parçaları ve eklemleri ----------
   Parça sayfası (beyaz zemin, sola bakar) yüklenince her parça kendi pikselleriyle kesilir.
   Açılar: pozitif = saat yönü (sola bakan çizimde: kafa/kuyruk ucu yukarı-aşağı, bacak ileri). */
// key: parça sayfasının zemini ('white' | 'magenta' #FF00FF | 'green' #00FF00 | 'cyan' #00FFFF); renkli zemin çok daha temiz kesilir
const KEYS = { white: [[255, 255, 255], (r, g, b) => (Math.min(r, g, b) - 180) / 70, .64, .74],
  magenta: [[255, 0, 255], (r, g, b) => (Math.min(r, b) - g) / 190, .35, .5], green: [[0, 255, 0], (r, g, b) => (g - Math.max(r, b)) / 190, .35, .5],
  cyan: [[0, 255, 255], (r, g, b) => (Math.min(g, b) - r) / 190, .35, .5] }; // camgöbeği: hem mor hem yeşil olan canavarlar (örümcek)
function cutPart(im, [x0, y0, x1, y1], key = 'white') {
  const [KC, kf, inT, bgT] = KEYS[key];
  const pad = 4, w = x1 - x0 + 1 + pad * 2, h = y1 - y0 + 1 + pad * 2, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(im, x0 - pad, y0 - pad, w, h, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h), d = id.data, N = w * h, m = new Uint8Array(N), lab = new Int32Array(N), KN = new Float32Array(N);
  for (let i = 0; i < N; i++) { KN[i] = Math.max(0, Math.min(1, kf(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]))); if (KN[i] < inT) m[i] = 1; }
  let best = 0, bestN = 0, n = 0; // yalnızca en büyük bileşen (komşu parçalardan taşan kırıntılar atılır)
  for (let i = 0; i < N; i++) {
    if (!m[i] || lab[i]) continue; n++; let cnt = 0; const st = [i]; lab[i] = n;
    while (st.length) { const p = st.pop(), X = p % w, Y = (p - X) / w; cnt++;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const a = X + dx, b = Y + dy; if (a < 0 || b < 0 || a >= w || b >= h) continue; const q = b * w + a; if (m[q] && !lab[q]) { lab[q] = n; st.push(q); } } }
    if (cnt > bestN) { bestN = cnt; best = n; }
  }
  // zemin: kenardan başlayıp zemin renkli piksellerden yayılan alan (parçanın içindeki açık renkler zemin sayılmaz)
  const bg = new Uint8Array(N), st = [];
  for (let X = 0; X < w; X++) st.push(X, (h - 1) * w + X); for (let Y = 0; Y < h; Y++) st.push(Y * w, Y * w + w - 1);
  while (st.length) { const p = st.pop(); if (bg[p] || KN[p] < bgT) continue; bg[p] = 1; const X = p % w, Y = (p - X) / w;
    if (X > 0) st.push(p - 1); if (X < w - 1) st.push(p + 1); if (Y > 0) st.push(p - w); if (Y < h - 1) st.push(p + w); }
  // parça: en büyük bileşenden başlayıp zemin olmayan piksellerden yayılan alan (komşu parçalardan taşan kırıntılar atılır)
  const keep = new Uint8Array(N); for (let i = 0; i < N; i++) if (lab[i] === best && !bg[i]) { st.push(i); }
  while (st.length) { const p = st.pop(); if (keep[p] || bg[p]) continue; keep[p] = 1; const X = p % w, Y = (p - X) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = X + dx, b = Y + dy; if (a >= 0 && b >= 0 && a < w && b < h) st.push(b * w + a); } }
  for (let i = 0; i < N; i++) {
    if (!keep[i]) { d[i * 4 + 3] = 0; continue; }
    const X = i % w, Y = (i - X) / w; let edge = false;
    for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) { const a = X + dx, b = Y + dy; if (a < 0 || b < 0 || a >= w || b >= h || bg[b * w + a]) { edge = true; break; } }
    // kenar pikseli: zemin rengine benzerliği kadar saydam, rengi zeminden arındırılır (koyu zeminde hale kalmasın)
    const a = edge ? 1 - KN[i] : 1;
    if (a > 0 && a < 1) for (let ch = 0; ch < 3; ch++) d[i * 4 + ch] = Math.max(0, Math.min(255, Math.round((d[i * 4 + ch] - (1 - a) * KC[ch]) / a)));
    // renk taşması: zemin rengine çalan tonu bastır (pembe zeminde kenarda pembe, yeşilde yeşil iz kalmasın)
    if (key === 'magenta') { const s = Math.min(d[i * 4], d[i * 4 + 2]) - d[i * 4 + 1]; if (s > 0) { d[i * 4] -= s; d[i * 4 + 2] -= s; } }
    else if (key === 'cyan') { const s = Math.min(d[i * 4 + 1], d[i * 4 + 2]) - d[i * 4]; if (s > 0) { d[i * 4 + 1] -= s; d[i * 4 + 2] -= s; } }
    else if (key === 'green') { const mx = Math.max(d[i * 4], d[i * 4 + 2]); if (d[i * 4 + 1] > mx) d[i * 4 + 1] = mx; }
    d[i * 4 + 3] = Math.round(a * 255);
  }
  x.putImageData(id, 0, 0); return { c, ox: x0 - pad, oy: y0 - pad };
}
// Canavar iskeletleri. Parça sayfaları düz renkli zeminde (key); bacaklar "kalıp" olarak bir kez çizilir, her bacakta tekrar kullanılır.
// portrait: portrede gösterilecek bölge (sayfa koordinatı, gövde parçasından)
const MRIG = {
  // dört ayaklı (kurt): tek parça gövde (baş+boyun+gövde, alt çenesiz), ayrı alt çene ve kuyruk; bacaklar iki kalıptan (ön F, arka H),
  // her biri 3 parça (üst, alt, pençe) çizildiği açıyla. Eklemlerde 8 px biner. Diz/dirsek açıları hedef pençe noktasına göre IK ile bulunur.
  wolf: {
    // v4: bacaklar tek renk, parça uçları yuvarlak; sayfada bacaklar uzun çizildiği için ls ile kısaltılır (alçak, sağlam duruş)
    type: 'quad', key: 'green', src: 'assets/mon/wolf_parts4.png?v=1', face: 'body', portrait: [256, 21, 500, 301],
    R: { body: [256, 21, 837, 301], tail: [883, 115, 1230, 351], jaw: [74, 233, 215, 307],
      F1: [344, 341, 461, 471], F2: [365, 476, 452, 591], F3: [322, 593, 446, 664], H1: [959, 338, 1107, 481], H2: [1037, 475, 1147, 595], H3: [996, 593, 1137, 664] },
    // bacak kalıbı: [üst parça pv (kalça/omuz), diz (üst parçada), alt parça pv, bilek (alt parçada), pençe pv, pençe tabanı y]
    LEG: { F: [[404, 372], [410, 462], [410, 478], [398, 582], [396, 596], 664], H: [[1033, 370], [1080, 466], [1086, 482], [1103, 584], [1098, 598], 664] },
    J: { body: { pv: [630, 275] }, sockets: { F: [500, 272], H: [760, 266] }, far: [24, -12], ls: .72, tail: { at: [815, 168], pv: [898, 178] }, jaw: { at: [384, 236], pv: [200, 250] } },
  },
  // örümcek: tek parça gövde (kafa+karın, altında 4 bacak yuvası), ayrı dişler; bacaklar iki kalıptan (ön A, arka B), her biri
  // 3 parça (kalça-diz, diz-bilek, bilek-uç). Parçalar yüklenirken eksenleri dikey çevrilir; uçlardan 10 px içeri girilir ki eklemlerde biner.
  // Uzak taraftaki 4 bacak aynı parçaların koyusu, gövdenin arkasında; yakın bacaklar gövdenin önünde (yuvaları örter).
  spider: {
    type: 'spider', key: 'cyan', src: 'assets/mon/spider_parts.png?v=4', face: 'body', portrait: [355, 60, 640, 313],
    R: { body: [355, 19, 931, 313], fang: [128, 154, 241, 263],
      A1: [340, 303, 471, 443], A2: [437, 430, 544, 562], A3: [514, 557, 578, 694], B1: [998, 311, 1136, 448], B2: [1101, 434, 1209, 564], B3: [1178, 560, 1247, 695] },
    SEG: { A1: [[353, 307], [454, 431]], A2: [[451, 437], [522, 560]], A3: [[525, 558], [583, 688]], B1: [[1013, 320], [1121, 435]], B2: [[1114, 442], [1186, 561]], B3: [[1188, 561], [1254, 689]] },
    J: { body: { pv: [640, 262] }, sockets: [[493, 262], [555, 262], [624, 254], [686, 260]], fangAt: [400, 226], fangPv: [200, 168], leg: { sx: .72, sl: 1.25 } }, // bacak: kalınlık sx, boy sl
    LEGSET: ['A', 'A', 'B', 'B'],
    // açılar: 0 = aşağı, + = ileri (sola). a1 kalça→diz (yukarı-dışarı), a2 diz→bilek, a3 bilek→uç
    REST: { a1: [2.6, 2.85, -2.85, -2.6], a2: [.95, .6, -.6, -.95], a3: [.35, .2, -.2, -.35] },
  },
  // insan gibi iki ayaklı (Mantar Adam): tek parça gövde (şapka+kafa+gövde), kollar dirsekten, bacaklar dizden iki parça.
  // Sayfa "patlatılmış görünüm"; her parçanın birleşik çizimdeki yeri görüntü eşleştirmeyle bulundu ve eklemler (omuz, dirsek,
  // kalça, diz) gövde koordinatında verildi. part: parçanın kendi resmindeki eklem noktası. Uzuvlar gövdenin ARKASINDA çizilir.
  mushroom: {
    type: 'humanoid', key: 'magenta', src: 'assets/mon/mushroom_parts.png?v=4', face: 'body', portrait: [740, 60, 1110, 360], // portrede yüzlü gövde
    // ERASE: sayfada gövdeye değen komşu parçanın (arka üst kol şapkaya değiyor) gövde kesiminden silinen bölgesi
    ERASE: { body: [[1030, 279, 1112, 362]] },
    R: { body: [711, 33, 1135, 420], uaL: [723, 248, 794, 344], faL: [669, 344, 756, 521], uaR: [1034, 277, 1106, 358], faR: [1074, 353, 1163, 523],
      thL: [819, 409, 892, 513], shL: [746, 514, 897, 667], thR: [929, 406, 1006, 514], shR: [925, 515, 1055, 686] },
    // eklemler gövde (birleşik) koordinatında: omuzlar gövdenin kenarında, kalçalar gövdenin altına 15 px girer;
    // her alt parçanın üst ucu bir üst parçanın ucuna ~10 px biner (dirsek/dizde boşluk kalmaz)
    JT: { pelvis: [915, 410], shL: [850, 300], elL: [833, 368], shR: [993, 300], elR: [1001, 355], hipL: [888, 400], knL: [880, 478], hipR: [950, 398], knR: [949, 480] },
    // her uzuv: [üst parça, alt parça, kök eklem, orta eklem, üst parçanın pv'si (üst ucu), alt parçanın pv'si (üst ucu), alt parçanın ucu (el/ayak)]
    LIMBS: { armL: ['uaL', 'faL', 'shL', 'elL', [768, 258], [730, 352], [700, 513]], armR: ['uaR', 'faR', 'shR', 'elR', [1066, 285], [1100, 361], [1124, 515]],
      legL: ['thL', 'shL', 'hipL', 'knL', [863, 417], [849, 522], [840, 667]], legR: ['thR', 'shR', 'hipR', 'knR', [973, 414], [994, 523], [985, 686]] },
    REST: {},
  },
};
const RIGP = {}; // yüklenmiş parçalar (+ hesaplanan zemin ve boy)
function straightenPart(p, pv, end) { // eklem ekseni dikey: pv üstte, end tam altında
  const dx = end[0] - pv[0], dy = end[1] - pv[1], L = Math.hypot(dx, dy), a = Math.atan2(dx, dy), D = Math.ceil(Math.hypot(p.c.width, p.c.height)) * 2;
  const c = document.createElement('canvas'); c.width = c.height = D; const x = c.getContext('2d');
  x.translate(D / 2, D / 2); x.rotate(a); x.drawImage(p.c, p.ox - pv[0], p.oy - pv[1]);
  return { part: { c, ox: 0, oy: 0 }, pv: [D / 2, D / 2], end: [D / 2, D / 2 + L] };
}
for (const [id, rig] of Object.entries(MRIG)) {
  const im = new Image();
  im.onload = () => {
    const P = {}; for (const [k, b] of Object.entries(rig.R)) P[k] = cutPart(im, b, rig.key);
    for (const [k, rs] of Object.entries(rig.ERASE || {})) for (const [x0, y0, x1, y1] of rs) P[k].c.getContext('2d').clearRect(x0 - P[k].ox, y0 - P[k].oy, x1 - x0, y1 - y0);
    if (rig.type === 'spider') { spiderLoad(rig, P); RIGP[id] = P; return; }
    if (rig.type === 'humanoid') { humanoidLoad(rig); RIGP[id] = P; return; }
    if (rig.type === 'quad') { quadLoad(rig); RIGP[id] = P; return; }
  };
  im.src = rig.src;
}
const rot2 = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
// örümcek: bacak parçalarını düzelt (eksen dikey), zemini ve boyu hesapla
function spiderLoad(rig, P) {
  for (const [k, [a, b]] of Object.entries(rig.SEG)) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], tip = k.endsWith('3');
    const a2 = [a[0] + u[0] * 10, a[1] + u[1] * 10], b2 = tip ? b : [b[0] - u[0] * 10, b[1] - u[1] * 10];
    const r = straightenPart(P[k], a2, b2); P[k] = { ...r.part, pv: r.pv, len: r.end[1] - r.pv[1] };
  }
  const pts = spiderPts(rig, P, spiderRest(rig));
  rig.ground = Math.max(...pts.near.map(l => l[3][1])); rig.cx = (pts.near[0][3][0] + pts.near[3][3][0]) / 2;
  rig.tall = rig.ground - Math.min(rig.R.body[1] - rig.J.body.pv[1], ...pts.near.map(l => Math.min(l[1][1], l[2][1])));
}
const spiderRest = rig => ({ a1: [...rig.REST.a1], a2: [...rig.REST.a2], a3: [...rig.REST.a3],
  f1: rig.REST.a1.map(v => v * .94), f2: rig.REST.a2.map(v => v * 1.1), f3: [...rig.REST.a3] });
// bacak zincirleri: [kalça, diz, bilek, uç] (kök: gövde pv = o; gövde açısı ta)
function spiderPts(rig, P, q, ta = 0, o = [0, 0]) {
  const J = rig.J, bp = J.body.pv, s = J.leg.sl, bj = jt => { const r = rot2([jt[0] - bp[0], jt[1] - bp[1]], ta); return [o[0] + r[0], o[1] + r[1]]; };
  const chain = (t, hip, a1, a2, a3) => { const step = (p, k, a) => { const r = rot2([0, P[t + k].len * s], a); return [p[0] + r[0], p[1] + r[1]]; };
    const k1 = step(hip, '1', a1), k2 = step(k1, '2', a2); return [hip, k1, k2, step(k2, '3', a3)]; };
  const near = [], far = [];
  rig.LEGSET.forEach((t, i) => {
    const sk = J.sockets[i];
    near.push(chain(t, bj(sk), ta + q.a1[i], ta + q.a2[i], ta + q.a3[i]));
    far.push(chain(t, bj([sk[0] + 16, sk[1] - 14]), ta + q.f1[i], ta + q.f2[i], ta + q.f3[i]));
  });
  return { near, far, bj };
}
// örümcek çizimi: kök = ayak noktası (zeminde), sola bakar
function drawSpider(x, rig, P, q) {
  const J = rig.J, ta = q.body || 0, o = [-rig.cx + (q.bx || 0), -rig.ground + (q.by || 0)], pts = spiderPts(rig, P, q, ta, o), s = [J.leg.sx, J.leg.sl];
  const put = (p, pv, at, a, sc, dark) => { const [kx, ky] = Array.isArray(sc) ? sc : [sc, sc]; x.save(); x.translate(at[0], at[1]); x.rotate(a); x.scale(kx, ky); if (dark) x.filter = 'brightness(.55)'; x.drawImage(p.c, p.ox - pv[0], p.oy - pv[1]); x.restore(); };
  const leg = (t, l, a1, a2, a3, dark) => { put(P[t + '3'], P[t + '3'].pv, l[2], a3, s, dark); put(P[t + '2'], P[t + '2'].pv, l[1], a2, s, dark); put(P[t + '1'], P[t + '1'].pv, l[0], a1, s, dark); };
  rig.LEGSET.forEach((t, i) => leg(t, pts.far[i], ta + q.f1[i], ta + q.f2[i], ta + q.f3[i], true)); // uzak bacaklar
  put(P.body, J.body.pv, o, ta, 1);
  put(P.fang, J.fangPv, pts.bj(J.fangAt), ta + (q.fang || 0), 1);
  rig.LEGSET.forEach((t, i) => leg(t, pts.near[i], ta + q.a1[i], ta + q.a2[i], ta + q.a3[i])); // yakın bacaklar yuvaları örter
  drawBones(x, [...pts.far.map(l => [l, '#2a9cc0']), ...pts.near.map(l => [l]), [[pts.bj(J.sockets[0]), pts.bj(J.sockets[3])], '#f2c14e'], [[pts.bj(J.sockets[0]), pts.bj(J.fangAt)], '#f2c14e']]);
}
// örümcek hareketleri: karşılıklı bacak grupları (0-2 / 1-3) adımlar; salınımda (öne giderken) bilek kalkar; dişler açılıp kapanır
function spiderPose(A, t) {
  const an = A.ANIMS[A.cur] || {}, p = Math.max(0, Math.min(1, A.at / (an.dur || 1))), S = Math.sin;
  const q = { ...spiderRest(MRIG.spider), by: S(t / 300) * 3, fang: .06 * S(t / 160) };
  const legs = f => { for (let i = 0; i < 4; i++) { const [d1, d2, d3] = f(i, i < 2 ? 1 : -1); q.a1[i] += d1; q.a2[i] += d2; q.a3[i] += d3; q.f1[i] += d1 * .9; q.f2[i] += d2 * .9; q.f3[i] += d3; } };
  legs(i => { const w = .03 * S(t / 260 + i * 1.3); return [w, -w, 0]; });
  if (A.cur === 'walk' || A.cur === 'idle') {
    const walking = A.cur === 'walk'; // beklerken de uçlar zemine oturtulur (öteleme 0)
    // her ayağın hedefi: duruştaki uç noktası + adım ötelemesi. Basma evresinde (yarım tur) uç yerde geriye kayar,
    // salınım evresinde yukarı yay çizerek öne gider. Diz-bilek açıları hedefe göre hesaplanır (iki eklemli IK).
    const rig = MRIG.spider, P = RIGP.spider, ph = t / 75, D = 34, Hh = 34;
    if (walking) q.by += -Math.abs(S(ph)) * 3;
    const rest = spiderPts(rig, P, spiderRest(rig));
    const step = g => { if (!walking) return [0, 0]; const u = (((ph + g) / (2 * Math.PI)) % 1 + 1) % 1; return u < .5 ? [-D + 4 * D * u, Math.sin(u * 2 * Math.PI) * Hh] : [D - 4 * D * (u - .5), 0]; }; // [ileri öteleme, yükseklik]: salınımda geriden öne, basmada önden geriye
    const ik = (t2, k1, tgt, up) => { // k1'den tgt'ye iki parça (diz-bilek, bilek-uç); bilek eklemi yukarıda kalsın
      const L2 = P[t2 + '2'].len * rig.J.leg.sl, L3 = P[t2 + '3'].len * rig.J.leg.sl, vx = tgt[0] - k1[0], vy = tgt[1] - k1[1];
      const dd = Math.min(Math.hypot(vx, vy), L2 + L3 - 1), base = Math.atan2(vy, vx), A2 = Math.acos(Math.max(-1, Math.min(1, (L2 * L2 + dd * dd - L3 * L3) / (2 * L2 * dd))));
      const c1 = [k1[0] + L2 * Math.cos(base + A2), k1[1] + L2 * Math.sin(base + A2)], c2 = [k1[0] + L2 * Math.cos(base - A2), k1[1] + L2 * Math.sin(base - A2)], k2 = c1[1] < c2[1] ? c1 : c2;
      const ang = (p, r) => Math.atan2(-(r[0] - p[0]), r[1] - p[1]); return [ang(k1, k2), ang(k2, tgt)];
    };
    const solve = (t2, i, side, a1k, a2k, a3k) => {
      const g = (i % 2 ? Math.PI : 0) + (side ? Math.PI : 0), [off, lift] = step(g), r = rest[side ? 'far' : 'near'][i];
      if (walking) q[a1k][i] += .12 * Math.sin(ph + g); // kalça da hafif öne-arkaya
      const hip = r[0], k1 = [hip[0] + (-Math.sin(q[a1k][i])) * P[t2 + '1'].len * rig.J.leg.sl, hip[1] + Math.cos(q[a1k][i]) * P[t2 + '1'].len * rig.J.leg.sl];
      const tgt = [r[3][0] - off, rig.ground - (side ? 10 : 0) - lift - q.by]; // uç zeminde (uzak taraf biraz geride); gövde sekse de yerde kalır
      [q[a2k][i], q[a3k][i]] = ik(t2, k1, tgt);
    };
    rig.LEGSET.forEach((t2, i) => { solve(t2, i, 0, 'a1', 'a2', 'a3'); solve(t2, i, 1, 'f1', 'f2', 'f3'); });
  } else if (A.cur === 'attack') { // arka bacaklar üstünde kalk, ön bacakları kaldır, dişleri aç; atıl ve ısır (hitAt .55)
    const wind = p < .4 ? p / .4 : 1, strike = p < .4 ? 0 : p < .55 ? (p - .4) / .15 : 1 - (p - .55) / .45, w2 = wind * (1 - strike);
    q.body = .25 * w2 - .08 * strike; q.bx = 30 * w2 - 130 * strike; q.by -= 25 * w2;
    q.fang = p < .52 ? -.6 * Math.min(1, p / .3) : -.6 * Math.max(0, 1 - (p - .52) / .08);
    legs((i, sd) => i === 0 ? [.3 * w2, 1.1 * w2 - .3 * strike, .8 * w2] : i === 1 ? [.15 * w2, .5 * w2, .4 * w2] : [0, 0, 0]);
  } else if (A.cur === 'block') { // tehdit duruşu: kalkıp ön bacakları havaya kaldırır
    const k = S(p * Math.PI); q.body = .3 * k; q.by -= 22 * k; q.fang = -.5 * k;
    legs((i) => i < 2 ? [.25 * k, 1.2 * k, 1 * k] : [0, 0, 0]);
  } else if (A.cur === 'hit') {
    const k = 1 - p; q.bx = 34 * k; q.body = -.12 * k; q.fang = -.4 * k;
  } else if (A.cur === 'death') { // bacaklarını içine kıvırıp çöker
    const k = Math.min(1, p * 1.4); q.by += 40 * k; q.body = -.15 * k; q.fang = -.3 * k;
    legs((i, sd) => [-.4 * sd * k, 1.5 * sd * k, 1.3 * sd * k]);
  } else if (A.cur === 'win') {
    const k = S(t / 140); q.by -= Math.abs(k) * 10; q.fang = -.3 * Math.abs(k);
    legs((i) => i === 0 ? [.2 + .15 * k, .9, .7] : [0, 0, 0]);
  }
  return q;
}
// dört ayaklı: her bacağın duruştaki bilek noktası ve pençe tabanı (gövde pv'sine göre), zemin ve boy
function quadLoad(rig) {
  const J = rig.J, bp = J.body.pv; rig.legs = [];
  // sıra: ön-yakın, arka-yakın, ön-uzak, arka-uzak
  for (const [t, far] of [['F', 0], ['H', 0], ['F', 1], ['H', 1]]) {
    const [p1, kn, p2, wr, p3, sole] = rig.LEG[t], s = J.sockets[t], hip = [s[0] - bp[0] + (far ? J.far[0] : 0), s[1] - bp[1] + (far ? J.far[1] : 0)];
    const k = J.ls || 1, v1 = [(kn[0] - p1[0]) * k, (kn[1] - p1[1]) * k], v2 = [(wr[0] - p2[0]) * k, (wr[1] - p2[1]) * k], ank = [hip[0] + v1[0] + v2[0], hip[1] + v1[1] + v2[1]];
    rig.legs.push({ t, far, hip, v1, v2, L1: Math.hypot(...v1), L2: Math.hypot(...v2), bend: Math.sign(v1[0] * (v1[1] + v2[1]) - v1[1] * (v1[0] + v2[0])) || 1, ank, foot: ank[1] + (sole - p3[1]) * k });
  }
  rig.ground = Math.max(...rig.legs.map(l => l.foot)); rig.cx = (rig.legs[0].ank[0] + rig.legs[1].ank[0]) / 2;
  rig.tall = rig.ground - (rig.R.body[1] - bp[1]);
}
const vang = v => Math.atan2(-v[0], v[1]); // 0 = aşağı, + = ileri (sola)
// iki parçalı IK: kalçadan hedef bileğe; dirsek/diz duruştaki yönde (bend) bükülür
function ik2(hip, tgt, L1, L2, bend) {
  const vx = tgt[0] - hip[0], vy = tgt[1] - hip[1], d = Math.max(Math.abs(L1 - L2) + 1, Math.min(Math.hypot(vx, vy), L1 + L2 - .5));
  const base = Math.atan2(vy, vx), A = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const k = [hip[0] + L1 * Math.cos(base - bend * A), hip[1] + L1 * Math.sin(base - bend * A)];
  const e = [k[0] + (tgt[0] - k[0]) * L2 / Math.hypot(tgt[0] - k[0], tgt[1] - k[1]), k[1] + (tgt[1] - k[1]) * L2 / Math.hypot(tgt[0] - k[0], tgt[1] - k[1])];
  return [k, e];
}
// dört ayaklı çizim: kök = ayak noktası (zeminde), sola bakar. q.legs[i] = { dx: ileri öteleme, dy: kalkma, p: pençe açısı }
function drawQuad(x, rig, P, q) {
  const J = rig.J, bp = J.body.pv, ta = q.body || 0, o = [-rig.cx + (q.bx || 0), -rig.ground + (q.by || 0)], g0 = [-rig.cx, -rig.ground];
  const bj = jt => { const r = rot2([jt[0] - bp[0], jt[1] - bp[1]], ta); return [o[0] + r[0], o[1] + r[1]]; };
  const put = (k, pv, at, a, dark, sc = 1) => { const p = P[k]; x.save(); x.translate(at[0], at[1]); x.rotate(a); x.scale(sc, sc); if (dark) x.filter = 'brightness(.6)'; x.drawImage(p.c, p.ox - pv[0], p.oy - pv[1]); x.restore(); };
  const bones = [], ls = J.ls || 1;
  const leg = i => {
    const l = rig.legs[i], L = rig.LEG[l.t], m = (q.legs && q.legs[i]) || {}, hr = rot2(l.hip, ta), hip = [o[0] + hr[0], o[1] + hr[1]];
    const tgt = [g0[0] + l.ank[0] - (m.dx || 0), g0[1] + l.ank[1] - (m.dy || 0)]; // hedef zemine göre (gövde sekse de pençe yerinde)
    const [kn, wr] = ik2(hip, tgt, l.L1, l.L2, l.bend), pa = (m.p || 0);
    put(l.t + '3', L[4], wr, pa, l.far, ls); put(l.t + '2', L[2], kn, vang([wr[0] - kn[0], wr[1] - kn[1]]) - vang(l.v2), l.far, ls);
    put(l.t + '1', L[0], hip, vang([kn[0] - hip[0], kn[1] - hip[1]]) - vang(l.v1), l.far, ls);
    bones.push([[hip, kn, wr, [wr[0], wr[1] + (L[5] - L[4][1]) * ls]], l.far ? '#2a9cc0' : '#4fd8ff']);
  };
  leg(2); leg(3); // uzak bacaklar gövdenin arkasında
  put('jaw', J.jaw.pv, bj(J.jaw.at), ta + (q.jaw || 0));
  put('body', bp, o, ta);
  put('tail', J.tail.pv, bj(J.tail.at), ta + (q.tail || 0)); // kuyruk gövdedeki yuvayı örter
  leg(1); leg(0); // yakın bacaklar yuvaları örter
  bones.push([[bj(J.tail.at), bj(J.sockets.H), bj(J.sockets.F), bj(J.jaw.at)], '#f2c14e']);
  drawBones(x, bones);
}
// kurt hareketleri: tırıs (çaprazdaki bacaklar birlikte), pençe yerde sabit (IK); salınımda pençe öne-yukarı yay çizer
function wolfPose(A, t) {
  const an = A.ANIMS[A.cur] || {}, p = Math.max(0, Math.min(1, A.at / (an.dur || 1))), S = Math.sin, br = S(t / 380);
  const q = { by: br * 3, body: .01 * br, tail: .1 * S(t / 420), jaw: -.03 - .03 * S(t / 300), legs: [{}, {}, {}, {}] };
  const feet = f => q.legs.forEach((m, i) => Object.assign(m, f(i)));
  if (A.cur === 'walk') {
    const ph = t / 85, D = 36, Hh = 30;
    const step = g => { const u = (((ph + g) / (2 * Math.PI)) % 1 + 1) % 1; return u < .5 ? { dx: -D + 4 * D * u, dy: S(u * 2 * Math.PI) * Hh, p: -.5 * S(u * 2 * Math.PI) } : { dx: D - 4 * D * (u - .5), dy: 0, p: 0 }; };
    feet(i => step([0, Math.PI, Math.PI, 0][i])); // ön-yakın ile arka-uzak, arka-yakın ile ön-uzak birlikte
    q.by += -Math.abs(S(ph)) * 6; q.tail += .18 * S(ph); q.body += .02 * S(ph * 2);
  } else if (A.cur === 'attack') { // geri çekil + ağzı aç, atıl ve ısır (hitAt .55'te çene kapanır), toparlan
    const wind = p < .4 ? p / .4 : 1, strike = p < .4 ? 0 : p < .55 ? (p - .4) / .15 : 1 - (p - .55) / .45, w2 = wind * (1 - strike);
    Object.assign(q, { bx: 40 * w2 - 120 * strike, by: 14 * w2 - 6 * strike, body: -.12 * strike + .08 * w2, tail: -.25 * strike,
      jaw: p < .52 ? -.6 * Math.min(1, p / .3) : -.6 * Math.max(0, 1 - (p - .52) / .08) });
    feet(i => ({ dx: -q.bx * (i % 2 ? .6 : 1) + (i % 2 ? 0 : 30 * strike), dy: i % 2 ? 0 : 26 * strike, p: i % 2 ? 0 : -.4 * strike })); // ön pençeler havalanır
  } else if (A.cur === 'block') { // uluma: baş yukarı, ağız açık, kuyruk havada
    const k = S(p * Math.PI); Object.assign(q, { body: .3 * k, jaw: -.5 * k, by: 4 * k, tail: -.4 * k });
  } else if (A.cur === 'hit') {
    const k = 1 - p; Object.assign(q, { bx: 34 * k, body: .12 * k, jaw: -.3 * k }); feet(() => ({ dx: -17 * k }));
  } else if (A.cur === 'death') { // bacaklar çözülür, gövde yere yığılır
    const k = Math.min(1, p * 1.4); Object.assign(q, { by: 150 * k, body: -.12 * k, jaw: -.3 * k, tail: .5 * k });
    feet(i => ({ dx: (i % 2 ? -40 : 40) * k, dy: 0, p: (i % 2 ? .6 : -.6) * k }));
  } else if (A.cur === 'win') { // zafer uluması: başı göğe
    const k = .7 + .3 * S(t / 260); Object.assign(q, { body: .32 * k, jaw: -.55 * k, tail: -.3 + .15 * S(t / 120) });
  }
  return q;
}
// insan gibi iskelet: zemin = duruşta en alttaki ayak ucu, boy = zeminden gövde tepesine (pelvis kök)
function humanoidLoad(rig) {
  const T = rig.JT, pl = T.pelvis, L = rig.LIMBS;
  const foot = k => { const [, , , kn, , lpv, tip] = L[k]; return (T[kn][1] - pl[1]) + (tip[1] - lpv[1]); };
  rig.ground = Math.max(foot('legL'), foot('legR')); rig.cx = 0;
  rig.tall = rig.ground - (rig.R.body[1] - pl[1]);
}
// q: body (gövde eğimi), bx/by, uzuv açıları <uzuv>1 (üst) ve <uzuv>2 (alt, üste göre); 0 = çizimdeki duruş, + = ileri (sola)
function drawHumanoid(x, rig, P, q) {
  const T = rig.JT, pl = T.pelvis, L = rig.LIMBS, ta = q.body || 0, o = [-rig.cx + (q.bx || 0), -rig.ground + (q.by || 0)];
  const bj = jt => { const r = rot2([jt[0] - pl[0], jt[1] - pl[1]], ta); return [o[0] + r[0], o[1] + r[1]]; };
  const put = (k, pv, at, a, dark) => { const p = P[k]; x.save(); x.translate(at[0], at[1]); x.rotate(a); if (dark) x.filter = 'brightness(.72)'; x.drawImage(p.c, p.ox - pv[0], p.oy - pv[1]); x.restore(); };
  const bones = [];
  const limb = (k, dark) => {
    const [up, lo, j0, j1, upv, lpv, tip] = L[k], leg = k.startsWith('leg'), base = leg ? 0 : ta; // bacaklar gövdeyle dönmez: ayaklar yere basık kalsın
    const a1 = base + (q[k + '1'] || 0), a2 = a1 + (q[k + '2'] || 0), root = leg ? [o[0] + T[j0][0] - pl[0], o[1] + T[j0][1] - pl[1]] : bj(T[j0]);
    if (leg) { const hp = bj(T[j0]); root[0] = hp[0]; root[1] = hp[1]; }
    const r1 = rot2([T[j1][0] - T[j0][0], T[j1][1] - T[j0][1]], a1), mid = [root[0] + r1[0], root[1] + r1[1]];
    const r2 = rot2([tip[0] - lpv[0], tip[1] - lpv[1]], a2), end = [mid[0] + r2[0], mid[1] + r2[1]];
    put(lo, lpv, mid, a2, dark); put(up, upv, root, a1, dark);
    bones.push([[root, mid, end], dark ? '#2a9cc0' : '#4fd8ff']);
  };
  limb('armR', true); limb('legR', true); limb('legL'); // arka kol ve bacaklar gövdenin arkasında
  put('body', pl, o, ta);
  limb('armL'); // bize dönük kol gövdenin önünde: öne-arkaya sallanırken görünür kalır
  bones.push([[bj(T.hipL), o, bj(T.hipR)], '#f2c14e'], [[o, bj([pl[0], rig.R.body[1] + 120])], '#f2c14e'], [[bj(T.shL), bj([pl[0], 280]), bj(T.shR)], '#f2c14e']);
  drawBones(x, bones);
}
// Mantar Adam: ağır adımlı; yürürken dizler bükülür, kollar ters sallanır; saldırıda kolunu kaldırıp yumruk indirir
function mushroomPose(A, t) {
  const an = A.ANIMS[A.cur] || {}, p = Math.max(0, Math.min(1, A.at / (an.dur || 1))), S = Math.sin, br = S(t / 360);
  const q = { by: br * 2, body: .01 * br, armL1: .04 * br, armL2: .06, armR1: -.04 * br, armR2: .06, legL1: 0, legL2: 0, legR1: 0, legR2: 0 };
  const add = o => { for (const k in o) q[k] = (q[k] || 0) + o[k]; };
  if (A.cur === 'walk') {
    const ph = t / 110, s = S(ph), lift = v => Math.max(0, v);
    add({ legL1: .42 * s, legL2: -.75 * lift(Math.cos(ph)), legR1: -.42 * s, legR2: -.75 * lift(-Math.cos(ph)),
      armL1: .45 * s, armL2: .25, armR1: -.45 * s, armR2: .25, by: -Math.abs(s) * 7 + 4, body: -.04 });
  } else if (A.cur === 'attack') { // kolu kaldır (geri), öne eğilip yumruğu indir (hitAt .55)
    const wind = p < .4 ? p / .4 : 1, strike = p < .4 ? 0 : p < .55 ? (p - .4) / .15 : 1 - (p - .55) / .45, w2 = wind * (1 - strike);
    add({ armL1: 2.4 * w2 + .9 * strike, armL2: .5 * w2 + .1 * strike, armR1: -.4 * w2 + .3 * strike, body: .12 * w2 - .3 * strike, bx: 20 * w2 - 90 * strike,
      legL1: .35 * strike, legL2: -.3 * strike, legR1: -.25 * strike, legR2: -.1 * strike, by: 8 * strike });
  } else if (A.cur === 'block') { // kollar önde çapraz, dizler bükük
    const k = S(p * Math.PI); add({ armL1: 1.5 * k, armL2: 1.2 * k, armR1: 1.3 * k, armR2: 1.3 * k, legL1: .35 * k, legL2: -.6 * k, legR1: .25 * k, legR2: -.55 * k, by: 22 * k, body: .1 * k });
  } else if (A.cur === 'hit') {
    const k = 1 - p; add({ bx: 30 * k, body: -.25 * k, armL1: -.6 * k, armR1: -.5 * k, legL1: -.15 * k });
  } else if (A.cur === 'death') { // dizleri çözülür, geriye devrilir
    const k = Math.min(1, p * 1.3); add({ legL1: .9 * k, legL2: -1.6 * k, legR1: .7 * k, legR2: -1.5 * k, body: -1.25 * k, bx: 60 * k, by: 120 * k, armL1: -1.2 * k, armR1: -.9 * k });
  } else if (A.cur === 'win') { // zıplayıp kollarını kaldırır
    const k = Math.abs(S(t / 150)); add({ by: -24 * k, armL1: 2.8 + .25 * S(t / 90), armL2: .3, armR1: 2.6 - .25 * S(t / 90), armR2: .3, legL2: -.4 * k, legR2: -.4 * k, legL1: .2 * k, legR1: .2 * k });
  }
  return q;
}
const RIG_POSE = { wolf: wolfPose, spider: spiderPose, mushroom: mushroomPose };
const MON_ANIMS = { idle: { loop: true, dur: 1000 }, walk: { loop: true, dur: 500 }, attack: { dur: 620, hitAt: .55 }, block: { dur: 600, cast: .5 },
  hit: { dur: 320, flash: true }, death: { dur: 900, hold: true }, win: { loop: true, dur: 700 } };
const monActor = (id, topH) => ({ mon: MON_DATA[id], id, cur: 'idle', at: 0, fired: false, waits: [], ended: false, endCb: null, hitT: -9999, x: 0, face: -1, off: 0, offY: 0, wp: {}, ANIMS: MON_ANIMS, topH });
// canavar çizimi: nefes alma, yürüme sekmesi, atılma, darbe, devrilme; resim sola bakar
function drawMonster(c, A, t, gx, gy, s) {
  const d = A.mon, an = A.ANIMS[A.cur] || MON_ANIMS.idle, p = Math.max(0, Math.min(1, A.at / an.dur)), h = d.h * 227 * s;
  let dx = 0, dy = d.float ? -h * .18 + Math.sin(t / 420) * 6 * s : 0, rot = 0, alpha = 1, sy = 1;
  if (A.cur === 'idle') sy = 1 + .025 * Math.sin(t / 320);
  else if (A.cur === 'walk') dy -= Math.abs(Math.sin(t / 95)) * 7 * s;
  else if (A.cur === 'attack') { const k = p < .55 ? monEase(p / .55) : 1 - (p - .55) / .45; dx = 46 * s * k; rot = .14 * k; }
  else if (A.cur === 'block') sy = 1 + .1 * Math.sin(p * Math.PI);
  else if (A.cur === 'hit') dx = -16 * s * (1 - p);
  else if (A.cur === 'death') { rot = -1.25 * Math.min(1, p * 1.6); alpha = 1 - .55 * p; dy = d.float ? dy + h * .18 * p : 0; }
  else if (A.cur === 'win') dy -= Math.abs(Math.sin(t / 150)) * 12 * s;
  const x = gx + A.off * A.face, P = RIGP[A.id];
  if (P) {
    const rig = MRIG[A.id], k = h / rig.tall;
    c.save(); c.globalAlpha *= A.cur === 'death' ? 1 - .45 * p : 1;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, gy + 2, h * .45, h * .06, 0, 0, 7); c.fill();
    c.translate(x, gy); c.scale(-A.face * k, k); ({ spider: drawSpider, humanoid: drawHumanoid }[rig.type] || drawQuad)(c, rig, P, RIG_POSE[A.id](A, t)); // çizim sola bakar
    c.restore(); return;
  }
  c.save(); c.globalAlpha *= alpha;
  // ayak gölgesi
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, gy + 2, h * .32, h * .06, 0, 0, 7); c.fill();
  c.translate(x, gy + dy); c.scale(A.face, 1); c.rotate(rot); c.scale(1, sy); // +x = baktığı yön
  const im = MON_IMG[A.id];
  if (im) { const w = h * im.naturalWidth / im.naturalHeight; c.scale(-1, 1); c.drawImage(im, -w / 2, -h, w, h); } // resim sola bakar
  else monSilhouette(c, d, h);
  c.restore();
}
// resim gelene kadar: renkli gövde, baş ve parlayan gözler (+x yönüne bakar)
function monSilhouette(c, d, h) {
  const w = h * (d.h < .65 ? 1.5 : .8);
  c.lineWidth = Math.max(2, h * .025); c.strokeStyle = '#120e18';
  c.fillStyle = d.color; c.beginPath(); c.ellipse(0, -h * .45, w * .5, h * .4, 0, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.arc(w * .38, -h * .72, h * .2, 0, 7); c.fill(); c.stroke();
  c.fillStyle = d.boss ? '#ff4a4a' : '#fff'; c.shadowColor = c.fillStyle; c.shadowBlur = 8;
  c.beginPath(); c.arc(w * .44, -h * .75, h * .035, 0, 7); c.arc(w * .3, -h * .75, h * .035, 0, 7); c.fill(); c.shadowBlur = 0;
  c.fillStyle = '#120e18'; for (const lx of [-w * .25, w * .2]) c.fillRect(lx, -h * .12, h * .05, h * .12);
}
function monPortrait(cv, id) {
  const x = cv.getContext('2d'), S = cv.width, d = MON_DATA[id];
  const g = x.createRadialGradient(S / 2, S * .6, 4, S / 2, S * .6, S * .65); g.addColorStop(0, d.color + '66'); g.addColorStop(1, '#0c0a12');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const P = RIGP[id];
  if (P) { // portrede sağa (rakibe) bakar; portrait verilmişse gövde parçasının yalnız o bölgesi (baş)
    const rig = MRIG[id], pp = P[rig.face || 'head'], bx = rig.portrait ? [rig.portrait[0] - pp.ox, rig.portrait[1] - pp.oy, rig.portrait[2] - rig.portrait[0], rig.portrait[3] - rig.portrait[1]] : [0, 0, pp.c.width, pp.c.height];
    const k = S * .92 / Math.max(bx[2], bx[3]); x.save(); x.translate(S / 2, S / 2); x.scale(-k, k); x.drawImage(pp.c, bx[0], bx[1], bx[2], bx[3], -bx[2] / 2, -bx[3] / 2, bx[2], bx[3]); x.restore(); return true; }
  const A = monActor(id, 0); A.face = -1; drawMonster(x, A, 0, S / 2, S * (d.h > 1 ? 1.25 : .95), S / 227 / Math.max(.5, d.h) * .95);
  return true;
}
