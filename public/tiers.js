/* Stickman Arena: seviye (tier) sayfaları.
   Bir eşyanın 10 seviyesi tek resimde 5 sütun x 2 satır durur (üst satır 1-5, alt satır 6-10).
   Boyu seviyeyle uzayan eşyalar (kılıç gibi) tek satırda 10 sütun olabilir: { src, rows: 1 }.
   Bütün seviyeler aynı çerçeveye hizalanır; böylece tek bir oturma ayarı (fit) hepsine uyar. */
(() => {
const N = 10;

// keyed() sonucundan 10 seviyeyi sırasıyla ayırır
function split(set, rows = 2) {
  const cols = N / rows;
  if (set.comps.length === N) {
    const rowOf = cp => rows === 1 ? 0 : Math.floor(cp.cy / (set.h / rows));
    return set.comps.slice().sort((a, b) => (rowOf(a) - rowOf(b)) || a.cx - b.cx).map(set.crop);
  }
  return Array.from({ length: N }, (_, i) => set.cellCrop(Math.floor(i / cols), i % cols, rows, cols));
}

// Eşyanın alt kısmı (yanak/ense korumaları gibi) bütün seviyelerde aynı kalır; tüy, kanat ve parlama
// üste ve yanlara taşar. Hizalama bu alt banda göre yapılır: alt kenar ve bandın ortası aynı noktaya gelir.
// Pelerin gibi üstten asılan eşyalarda (anchor: 'top') hizalama üst banda (tokalar) göre yapılır.
function measure(sp) {
  const d = sp.c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, sp.w, sp.h).data;
  const on = (x, y) => d[(y * sp.w + x) * 4 + 3] > 128;
  let top = sp.h, bot = 0;
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) if (on(x, y)) { if (y < top) top = y; bot = y; break; }
  return { top, bot, band: (bh, fromTop) => {
    let minx = sp.w, maxx = 0;
    const y0 = fromTop ? top : Math.max(0, Math.round(bot - bh)), y1 = fromTop ? Math.min(sp.h - 1, Math.round(top + bh)) : bot;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < sp.w; x++) if (on(x, y)) { if (x < minx) minx = x; if (x > maxx) maxx = x; }
    return { cx: (minx + maxx) / 2, w: maxx - minx + 1 };
  } };
}
// grow: 10. seviye 1. seviyenin kaç katı büyüklükte olsun (silahlar: resimde hepsi aynı boy, uzama burada yapılır)
function align(crops, anchor = 'bottom', grow = 1) {
  const top = anchor === 'top', ms = crops.map(measure), bh = (ms[0].bot - ms[0].top) * (top ? .15 : .3);
  const bands = ms.map(m => m.band(bh, top)), ay = ms.map(m => top ? m.top : m.bot);
  const k = bands.map((b, i) => Math.min(1.12, Math.max(.88, bands[0].w / b.w)) * (1 + (grow - 1) * i / Math.max(1, crops.length - 1)));
  let L = 0, R = 0, T = 0, B = 0;
  crops.forEach((sp, i) => {
    const ax = bands[i].cx;
    L = Math.max(L, ax * k[i]); R = Math.max(R, (sp.w - ax) * k[i]); T = Math.max(T, ay[i] * k[i]); B = Math.max(B, (sp.h - ay[i]) * k[i]);
  });
  const W = Math.ceil(L + R), H = Math.ceil(T + B);
  const out = crops.map((sp, i) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(sp.c, L - bands[i].cx * k[i], T - ay[i] * k[i], sp.w * k[i], sp.h * k[i]);
    return { c, w: W, h: H };
  });
  // 1. seviyenin kendi sınırları (çerçeve içinde): fit ayarı yaparken işe yarar
  out.box = { x: (L - bands[0].cx) / W, y: (T - ay[0] + ms[0].top) / H, w: crops[0].w / W, h: (ms[0].bot - ms[0].top) / H };
  return out;
}
// classes.js'teki tiers girdisi: 'yol.webp' ya da { src, rows, anchor }
async function build(keyed, entry, bg) {
  const { src, rows = 2, anchor } = typeof entry === 'string' ? { src: entry } : entry;
  return align(split(await keyed(src, bg), rows), anchor);
}
/* Sınıf sayfası: bir sınıfın bütün eşyaları tek resimde, her satır bir eşya, her sütun bir seviye.
   Satır sınırları yatay doluluk profilindeki en derin çukurlardan bulunur; böylece birbirine değen eşyalar
   (şapkalı kafanın boynu ile cüppe yakası gibi) ve farklı yükseklikteki satırlar (asa, pelerin) doğru ayrılır.
   Her hücre kendi dikdörtgenine kırpılır, dışarı taşan komşu parçalar alınmaz. */
// fixed: satır sınırları elle verilmişse (resim yüksekliğinin oranı olarak) otomatik arama yapılmaz
function splitSheet(set, counts, fixed) {
  const rowCount = counts.length;
  const W = set.w, H = set.h, d = set.canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const prof = new Float32Array(H);
  for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) n++; prof[y] = n; }
  const sm = prof.map((_, y) => { let s = 0, k = 0; for (let i = y - 3; i <= y + 3; i++) if (i >= 0 && i < H) { s += prof[i]; k++; } return s / k; });
  // ilk ve son dolu satır arasında, birbirinden yeterince uzak en düşük rowCount-1 noktası
  let top = 0, bot = H - 1; while (top < H && !prof[top]) top++; while (bot > 0 && !prof[bot]) bot--;
  const minGap = (bot - top) / (rowCount * 2.2), picks = [];
  // çukurun derinliği iki yanındaki tepelere göre ölçülür: ince asaların seyrek satırı çukur sayılmaz,
  // ama dolu iki satırın arasındaki dar boyun bölgesi sayılır
  const win = Math.round(minGap * 1.5), peak = (u, v) => { let m = 0; for (let i = Math.max(top, u); i <= Math.min(bot, v); i++) if (sm[i] > m) m = sm[i]; return m; };
  const score = new Float32Array(H).fill(9);
  // derinlik: iki yandaki en yakın tepelere göre (pencere içindeki en yüksek değere göre değil; yoksa ince asaların
  // arasındaki hafif çukur, asanın tepesindeki kalabalık başlıklar yüzünden gerçek satır arasından derin görünür)
  const climb = (y, s) => { let i = y; while (i + s > top && i + s < bot && sm[i + s] >= sm[i]) i += s; return sm[i]; };
  for (let y = top + 1; y < bot; y++) score[y] = sm[y] / (Math.min(climb(y, -1), climb(y, 1)) + 1);
  const order = Array.from({ length: bot - top - 1 }, (_, i) => top + 1 + i).sort((p, q) => score[p] - score[q] || p - q);
  for (const y of order) {
    if (picks.length === rowCount - 1) break;
    if (y - top < minGap * .6 || bot - y < minGap * .6) continue;
    if (picks.every(p => Math.abs(p - y) >= minGap)) picks.push(y);
  }
  if (!fixed && picks.length !== rowCount - 1) throw new Error(`sınıf sayfasında ${picks.length + 1} satır bulundu, ${rowCount} bekleniyordu`);
  // çukurun ortasını sınır al (boş bir bant varsa tam ortası)
  const edge = [0, ...picks.sort((p, q) => p - q).map(y => {
    let u = y, v = y; while (u > top && sm[u - 1] <= sm[y] + .5) u--; while (v < bot && sm[v + 1] <= sm[y] + .5) v++; return (u + v) / 2;
  }), H];
  if (fixed) edge.splice(0, edge.length, 0, ...fixed.map(f => f * H), H);
  TierKit.lastEdges = edge; // hata ayıklama için
  return Array.from({ length: rowCount }, (_, ri) => rowPieces(set, Math.floor(edge[ri]), Math.min(H, Math.ceil(edge[ri + 1])), counts[ri], ri + 1));
}
/* Bir satır bandındaki parçalar: yapay zekâ eşyaları sütunlara tam eşit dizmediği için sabit ızgara kullanılmaz.
   Bant içindeki parçalar bulunur, kırıntılar atılır, yatayda üst üste binen parçalar (asanın ucu, süs boncuğu)
   birleştirilir ve soldan sağa sayılır. Beklenenden fazla küme varsa en dar boşluklar birleştirilir. */
function rowPieces(set, y0, y1, count, rowNo) {
  const W = set.w, h = y1 - y0, band = document.createElement('canvas'); band.width = W; band.height = h;
  const bx = band.getContext('2d', { willReadFrequently: true }); bx.drawImage(set.canvas, 0, y0, W, h, 0, 0, W, h);
  const img = bx.getImageData(0, 0, W, h), d = img.data, lab = new Int32Array(W * h), st = new Int32Array(W * h), comps = [null];
  for (let j = 0; j < W * h; j++) {
    if (lab[j] || d[j * 4 + 3] <= 128) continue;
    const n = comps.length, cp = { n, area: 0, minx: W, maxx: 0, miny: h, maxy: 0 }; let sp = 0; st[sp++] = j; lab[j] = n;
    while (sp) {
      const k = st[--sp], kx = k % W, ky = (k / W) | 0; cp.area++;
      if (kx < cp.minx) cp.minx = kx; if (kx > cp.maxx) cp.maxx = kx; if (ky < cp.miny) cp.miny = ky; if (ky > cp.maxy) cp.maxy = ky;
      for (const m of [kx > 0 ? k - 1 : -1, kx < W - 1 ? k + 1 : -1, k - W, k + W])
        if (m >= 0 && m < W * h && !lab[m] && d[m * 4 + 3] > 128) { lab[m] = n; st[sp++] = m; }
    }
    comps.push(cp);
  }
  // Komşu eşyalar yatayda üst üste binebilir (şapka ucu ile yandaki şapkanın kenarı), bu yüzden kümeler
  // x aralığına göre değil, büyük parçalara göre kurulur: en büyük parçalar eşyanın kendisi, küçükler
  // (süs boncuğu, kopuk asa ucu) yatayda en çok örtüştükleri ya da en yakın büyük parçaya eklenir.
  const all = comps.slice(1).filter(c => c.area >= 20).sort((p, q) => q.area - p.area);
  const xo = (p, q) => Math.max(0, Math.min(p.maxx, q.maxx) - Math.max(p.minx, q.minx)) / Math.min(p.maxx - p.minx + 1, q.maxx - q.minx + 1);
  const anchors = [], rest = [];
  for (const c of all) {
    // büyük bir parçanın altında/üstünde duran ve yatayda büyük ölçüde örtüşen parça aynı eşyanın parçasıdır
    if (anchors.length < count && !anchors.some(an => xo(an, c) > .5)) anchors.push(c); else rest.push(c);
  }
  const cl = anchors.map(c => ({ ids: [c.n], minx: c.minx, maxx: c.maxx, miny: c.miny, maxy: c.maxy, cx: (c.minx + c.maxx) / 2 }));
  for (const c of rest) {
    if (c.area < (all[0] ? all[0].area : 0) * .002) continue; // kırıntı
    const ccx = (c.minx + c.maxx) / 2;
    let best = null, bs = -1;
    for (const k of cl) { const sc = xo(k, c) * 1e6 - Math.abs(k.cx - ccx); if (sc > bs) { bs = sc; best = k; } }
    if (!best) continue;
    best.ids.push(c.n); best.minx = Math.min(best.minx, c.minx); best.maxx = Math.max(best.maxx, c.maxx); best.miny = Math.min(best.miny, c.miny); best.maxy = Math.max(best.maxy, c.maxy);
  }
  cl.sort((p, q) => p.cx - q.cx);
  // Yan yana iki eşya birbirine değiyorsa (ör. iki pelerinin kenarı) tek küme olur: en geniş kümeyi,
  // ortasındaki en ince sütundan ikiye böl. Böl ve tekrar dene, ta ki sayı tutana kadar.
  for (let guard = 0; cl.length < count && guard < count; guard++) {
    let wi = 0; cl.forEach((c, i) => { if ((c.clipR ?? c.maxx) - (c.clipL ?? c.minx) > (cl[wi].clipR ?? cl[wi].maxx) - (cl[wi].clipL ?? cl[wi].minx)) wi = i; });
    const c = cl[wi], L = c.clipL ?? c.minx, R = c.clipR ?? c.maxx, ids = new Set(c.ids);
    let bx = -1, bv = Infinity;
    for (let x = Math.round(L + (R - L) * .2); x <= Math.round(L + (R - L) * .8); x++) {
      let v = 0; for (let y = c.miny; y <= c.maxy; y++) if (ids.has(lab[y * W + x])) v++;
      if (v < bv) { bv = v; bx = x; }
    }
    if (bx < 0) break;
    const a = { ...c, clipL: L, clipR: bx - 1, minx: L, maxx: bx - 1 }, b = { ...c, clipL: bx + 1, clipR: R, minx: bx + 1, maxx: R };
    a.cx = (a.minx + a.maxx) / 2; b.cx = (b.minx + b.maxx) / 2;
    cl.splice(wi, 1, a, b);
  }
  if (cl.length < count) throw new Error(`${rowNo}. satırda ${count} parça bekleniyordu, ${cl.length} bulundu`);
  return cl.map(c => {
    const ids = new Set(c.ids), pad = 3, w = c.maxx - c.minx + 1 + pad * 2, hh = c.maxy - c.miny + 1 + pad * 2;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = hh;
    const cx = cv.getContext('2d'), out = cx.createImageData(w, hh), o = out.data;
    for (let y = c.miny; y <= c.maxy; y++) for (let x = c.minx; x <= c.maxx; x++) {
      const j = y * W + x;
      if (c.clipL != null && (x < c.clipL || x > c.clipR)) continue; // bölünmüş kümenin kendi yarısı
      if (lab[j] ? !ids.has(lab[j]) : !(d[j * 4 + 3] && [j - 1, j + 1, j - W, j + W].some(m => ids.has(lab[m])))) continue; // yumuşak kenar: komşusu bu eşyadansa
      const t = ((y - c.miny + pad) * w + (x - c.minx + pad)) * 4;
      o[t] = d[j * 4]; o[t + 1] = d[j * 4 + 1]; o[t + 2] = d[j * 4 + 2]; o[t + 3] = d[j * 4 + 3];
    }
    cx.putImageData(out, 0, 0);
    return { c: cv, w, h: hh };
  });
}
// classes.js'teki tierSheet: { src, rows: ['head', ['shaft', 'foot'], ...], anchors: { cape: 'top' } }
// satırdaki dizi: o satırın her hücresinde yan yana birkaç parça var (soldan sağa)
// per: bir satırdaki seviye sayısı (varsayılan 10). Geniş eşyalar 5'li iki satırda gelir: aynı adı taşıyan
// satırlar sırayla birleştirilir (rows: ['chest', 'chest', ...], per: 5).
// Yapay zekâ bir satıra 10 yerine 9 eşya çizdiyse (per: 9) eksik son seviye, bir öncekinin daha parlak altın
// tonlu kopyası olarak tamamlanır (geçici çözüm; yeni çizim gelene kadar).
function brighter(sp) {
  const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h;
  const x = c.getContext('2d'); x.drawImage(sp.c, 0, 0);
  // yalnızca renkli kısımlar altına çalar; siyah iskelet/yüz ve siyah dış çizgiler siyah kalır
  const img = x.getImageData(0, 0, sp.w, sp.h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10 || Math.max(d[i], d[i + 1], d[i + 2]) < 70) continue;
    d[i] = Math.min(255, d[i] * .82 + 255 * .18); d[i + 1] = Math.min(255, d[i + 1] * .82 + 220 * .18); d[i + 2] = d[i + 2] * .82 + 120 * .18;
  }
  x.putImageData(img, 0, 0);
  return { c, w: sp.w, h: sp.h };
}
async function buildSheet(keyed, sheet, bg) {
  // per: tek sayı ya da satır başına sayı dizisi (yapay zekâ bazen satıra 6-7 eşya sığdırıyor)
  const perOf = i => Array.isArray(sheet.per) ? sheet.per[i] : (sheet.per || N);
  const counts = sheet.rows.map((p, i) => perOf(i) * (Array.isArray(p) ? p.length : 1));
  const rows = splitSheet(await keyed(sheet.src, sheet.bg || bg), counts, sheet.edges), // sayfa kendi zemin rengini belirtebilir
    out = {}, an = sheet.anchors || {}, gr = sheet.grow || {}, sy = sheet.stretch || {}, nx = sheet.narrow || {};
  // stretch: parçayı boyuna uzat (ör. katana resimde kısa çiziliyor; ince ve uzun görünsün diye)
  // narrow: parçayı enine sıkıştır (ör. geniş hücreye çizilmiş pelerin fazla enli çıkıyor)
  const tall = (list, p) => !sy[p] && !nx[p] ? list : list.map(sp => {
    const c = document.createElement('canvas'); c.width = Math.round(sp.w * (nx[p] || 1)); c.height = Math.round(sp.h * (sy[p] || 1));
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(sp.c, 0, 0, c.width, c.height);
    return { c, w: c.width, h: c.height };
  });
  const raw = {}, add = (q, list) => (raw[q] = (raw[q] || []).concat(list));
  sheet.rows.forEach((p, i) => {
    // çok parçalı satırda parçalar soldan sağa: 1. seviyenin a, b, c'si, sonra 2. seviyenin...
    if (Array.isArray(p)) p.forEach((q, k) => add(q, rows[i].filter((_, j) => j % p.length === k)));
    else add(p, rows[i]);
  });
  // order: yapay zekâ seviyeleri karışık sıraladıysa çizim sırasından seviye sırasına (ör. { chest: [0,1,2,5,3,...] })
  for (const [q, ix] of Object.entries(sheet.order || {})) if (raw[q]) raw[q] = ix.map(k => raw[q][k]);
  for (const [q, all] of Object.entries(raw)) {
    // 10'dan fazla çizildiyse yükselişi koruyarak eşit aralıklı 10 tanesi seçilir; azsa son seviye tamamlanır
    const list = all.length > N ? Array.from({ length: N }, (_, i) => all[Math.round(i * (all.length - 1) / (N - 1))]) : all;
    while (list.length < N) list.push(brighter(list[list.length - 1]));
    out[q] = align(tall(list, q), an[q], gr[q]);
  }
  // "_" ile başlayan satırlar kullanılmaz (ör. yapay zekânın iki kez çizdiği satır)
  for (const p in out) if (p[0] === "_") delete out[p];
  if (out.chest) out.chest.forEach(t => t.holeRef = out.chest[0]);
  // same: başka bir yuva aynı resmi kullanır (ör. samurayın iki elinde aynı katana: { off: 'main' })
  for (const [p, q] of Object.entries(sheet.same || {})) out[p] = out[q];
  return out;
}
/* Göğüs zırhının kol delikleri: omuz eklemi tam deliğin ortasına konur.
   Yakın kol deliği (görselin solunda) zırhın içindeki en büyük koyu boşluktur; uzak kol deliği çoğu zaman
   görünmez, o yüzden aynı yükseklikte zırhın sağ kenarının biraz içine konur. Sonuç resmin oranı olarak döner. */
function armHoles(sp) {
  // seviyeler aynı kalıba hizalı: delikler 1. seviyeden ölçülür (koyu boyalı üst seviyeler deliği şaşırtmasın)
  if (sp.holeRef && sp.holeRef !== sp) return armHoles(sp.holeRef);
  if (sp.holes !== undefined) return sp.holes;
  const w = sp.w, h = sp.h, d = sp.c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const x1 = Math.floor(w * .5), y0 = Math.floor(h * .12), y1 = Math.floor(h * .62);
  const dark = j => d[j * 4 + 3] > 200 && Math.max(d[j * 4], d[j * 4 + 1], d[j * 4 + 2]) < 50;
  const seen = new Uint8Array(w * h), st = [];
  let best = null;
  for (let y = y0; y < y1; y++) for (let x = 0; x < x1; x++) {
    const j = y * w + x; if (seen[j] || !dark(j)) continue;
    let n = 0, sx = 0, sy = 0, minx = x, maxx = x, miny = y, maxy = y; st.push(j); seen[j] = 1;
    while (st.length) {
      const k = st.pop(), kx = k % w, ky = (k / w) | 0; n++; sx += kx; sy += ky;
      if (kx < minx) minx = kx; if (kx > maxx) maxx = kx; if (ky < miny) miny = ky; if (ky > maxy) maxy = ky;
      for (const m of [kx > 0 ? k - 1 : -1, kx < x1 - 1 ? k + 1 : -1, ky > y0 ? k - w : -1, ky < y1 - 1 ? k + w : -1])
        if (m >= 0 && !seen[m] && dark(m)) { seen[m] = 1; st.push(m); }
    }
    // kol deliği: yeterince büyük ve yuvarlağa yakın koyu boşluk
    const bw = maxx - minx + 1, bh = maxy - miny + 1;
    if (n > w * h * .004 && bw > w * .06 && bh > h * .06 && bw / bh < 2.5 && bh / bw < 2.5 && (!best || n > best.n)) best = { n, cx: sx / n, cy: sy / n };
  }
  if (!best) return sp.holes = null;
  // uzak omuz: yakın deliğin biraz üstünde, zırhın sağ kenarının %8 içinde
  const ry = Math.max(0, Math.round(best.cy - h * .03)); let rx = 0;
  for (let x = w - 1; x >= 0; x--) if (d[(ry * w + x) * 4 + 3] > 128) { rx = x; break; }
  return sp.holes = { armS: [best.cx / w, best.cy / h], armK: [(rx - w * .08) / w, ry / h] };
}
// bir sınıfın sayfaları: tierSheet tek sayfa ya da sayfa dizisi olabilir (ör. küçük eşyalar + botlar + büyük eşyalar)
const sheets = C => [].concat(C.tierSheet || []);
window.TierKit = { sheets, N, split, align, build, buildSheet, splitSheet, rowPieces, armHoles };
})();
