/* Stickman Arena: ortak iskelet + ekipman çizimi (aktör tabanlı).
   classes.js'teki RIG_CLASSES ve rigAnims kullanılır. Savaş oyunu bu dosyayı kullanır. */
(() => {
const R = Math.PI / 180;
const dd = a => [Math.sin(a * R), Math.cos(a * R)]; // 0 = aşağı, 90 = ileri, 180 = yukarı
const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const angOf = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) / R;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const now = () => performance.now();
const CL = window.RIG_CLASSES;

const L = window.RIG_BODY.L, BODY = window.RIG_BODY;
const EYES = [2, -2, .5]; // bütün sınıflarda aynı göz yeri; başlıklar kafaya göre yerleştirilir
// duruş: ayaklar kalçaların altında, kalça bacak boyuna yakın yükseklikte → bacaklar neredeyse düz (eskisi crouch 4, ayaklar ±30: dizler bükük)
const COMMON_BASE = { x: 0, lift: 0, rot: 0, lean: 0, head: 0, crouch: -5,
  uaS: -16, laS: 36, main: 40, uaK: 20, laK: 64, off: 0, offTilt: 0, footF: 12, footB: -26, liftF: 0, liftB: 0 };

/* ---------- Görseller ---------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('yüklenemedi: ' + src)); i.src = src; });
function darken(src, b) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const x = c.getContext('2d'); x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(0,0,0,${1 - b})`; x.fillRect(0, 0, c.width, c.height);
  return c;
}
// Arka plan rengini (yeşil ya da pembe) silip eşyaları ayırır
async function keyed(src, bg = 'green') {
  const img = await loadImg(src);
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h), p = d.data, mask = new Uint8Array(w * h), mag = bg === 'magenta' || bg === 'magenta-soft', soft = bg === 'magenta-soft';
  for (let i = 0, j = 0; i < p.length; i += 4, j++) {
    if (p[i + 3] < 30) { p[i + 3] = 0; continue; } // saydam arka planlı resim: boş piksel
    const r = p[i], g = p[i + 1], b = p[i + 2];
    if (soft && g > 70) { mask[j] = 1; continue; } // magenta-soft: mor parıltı eşyanın parçası, silinmez
    const key = mag ? Math.min(r, b) - g : g - Math.max(r, b);
    const strong = mag ? Math.min(r, b) > 110 : g > 110;
    const despill = s => { if (mag) { p[i] = r - s; p[i + 2] = b - s; } else p[i + 1] = g - s; };
    if (key > 70 && strong) p[i + 3] = 0;
    else if (key > 22) { const a = 1 - (key - 22) / 48; p[i + 3] = Math.round(255 * a); despill(key); if (a > .5) mask[j] = 1; }
    else { if (key > 0) despill(key); mask[j] = 1; }
  }
  x.putImageData(d, 0, 0);
  const lab = new Int32Array(w * h), stack = new Int32Array(w * h), comps = [], all = [];
  let n = 0;
  for (let j = 0; j < w * h; j++) {
    if (!mask[j] || lab[j]) continue;
    n++; let sp = 0; stack[sp++] = j; lab[j] = n;
    let minx = w, miny = h, maxx = 0, maxy = 0, area = 0;
    while (sp) {
      const k = stack[--sp], kx = k % w, ky = (k / w) | 0; area++;
      if (kx < minx) minx = kx; if (kx > maxx) maxx = kx; if (ky < miny) miny = ky; if (ky > maxy) maxy = ky;
      if (kx > 0 && mask[k - 1] && !lab[k - 1]) { lab[k - 1] = n; stack[sp++] = k - 1; }
      if (kx < w - 1 && mask[k + 1] && !lab[k + 1]) { lab[k + 1] = n; stack[sp++] = k + 1; }
      if (ky > 0 && mask[k - w] && !lab[k - w]) { lab[k - w] = n; stack[sp++] = k - w; }
      if (ky < h - 1 && mask[k + w] && !lab[k + w]) { lab[k + w] = n; stack[sp++] = k + w; }
    }
    const cp = { minx, miny, maxx, maxy, area, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2 };
    if (area > 3000) comps.push(cp);
    if (area > 40) all.push(cp); // sınıf sayfası: küçük parçalar (ince asa, süs boncuğu) da gerekir
  }
  const crop = cp => {
    const pad = 3, sw = cp.maxx - cp.minx + 1 + pad * 2, sh = cp.maxy - cp.miny + 1 + pad * 2;
    const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
    sc.getContext('2d').drawImage(c, cp.minx - pad, cp.miny - pad, sw, sh, 0, 0, sw, sh);
    return { c: sc, w: sw, h: sh };
  };
  const cellCrop = (row, col, rows, cols) => { // eşyalar birbirine değerse ızgara hücresine göre ayır
    const x0 = Math.floor(col * w / cols), x1 = Math.floor((col + 1) * w / cols), y0 = Math.floor(row * h / rows), y1 = Math.floor((row + 1) * h / rows);
    let minx = x1, miny = y1, maxx = x0, maxy = y0;
    for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) if (mask[y * w + xx]) { if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    const cp = crop({ minx, miny, maxx, maxy }), g = cp.c.getContext('2d'), pad = 3;
    g.clearRect(0, 0, cp.w, Math.max(0, y0 - (miny - pad))); g.clearRect(0, y1 - (miny - pad), cp.w, cp.h);
    return cp;
  };
  return { comps, all, crop, cellCrop, w, h, canvas: c };
}
// sınıfın bütün parçaları: eski set + seviye sayfaları (kol kılıfı, eldiven gibi yeni parçalar) + pelerin
const partsOf = id => { const C = CL[id]; return [...new Set([...C.order.filter(p => p !== 'shoulder'), ...Object.keys(C.tiers || {}), ...TierKit.sheets(C).flatMap(s => s.rows.flat()).filter(p => p[0] !== '_'), 'cape'])]; };
const SPRITES = {}, loading = {}, TIERS = {};
async function fromSheet(id) {
  const C = CL[id], out = {};
  const set = await keyed(C.set, C.bg);
  if (set.comps.length === C.order.length) {
    const rowOf = cp => Math.floor(cp.cy / (set.h / C.rows));
    set.comps.sort((a, b) => (rowOf(a) - rowOf(b)) || a.cx - b.cx);
    set.comps.forEach((cp, i) => out[C.order[i]] = set.crop(cp));
  } else {
    const cols = Math.round(C.order.length / C.rows);
    C.order.forEach((p, i) => out[p] = set.cellCrop(Math.floor(i / cols), i % cols, C.rows, cols));
  }
  if (C.cape) { const cp = await keyed(C.cape, C.bg); if (cp.comps.length) out.cape = cp.crop(cp.comps.sort((a, b) => b.area - a.area)[0]); }
  // Seviye sayfası olan parçalarda 1. seviye Common parçanın yerine geçer
  for (const [p, src] of Object.entries(C.tiers || {})) {
    const t = await TierKit.build(keyed, src, C.bg);
    (TIERS[id] = TIERS[id] || {})[p] = t; out[p] = t[0];
  }
  for (const sh of TierKit.sheets(C)) { // eşyalar seviyeleriyle bir ya da birkaç sayfada
    const T = await TierKit.buildSheet(keyed, sh, C.bg);
    for (const p in T) { (TIERS[id] = TIERS[id] || {})[p] = T[p]; out[p] = T[p][0]; }
  }
  if (out.cape) out.cape = { ...out.cape, c: darken(out.cape.c, C.capeTint || .85) };
  return out;
}
async function fromBaked(id) {
  const out = {};
  await Promise.all(partsOf(id).map(async p => {
    const img = await loadImg(`assets/baked/${id}_${p}.png?v=40`);
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    out[p] = { c, w: c.width, h: c.height };
  }));
  return out;
}
const DARK = ['foot', 'shaft', 'knee', 'bracer']; // arkadaki bacak ve kol parçaları koyu çizilir
function finish(out) {
  for (const k of DARK) if (out[k]) out[k].dark = darken(out[k].c, .72);
  return out;
}
/* Seviyeler: her sınıfın 10 seviyesi tek bir atlas resminde (assets/atlas/{id}.webp + .json);
   json her parça için seviye sırasıyla [x, y, w, h] tutar. */
const ATLAS = {}, atlasLoading = {};
function loadTiers(id) {
  if (ATLAS[id]) return Promise.resolve(ATLAS[id]);
  return atlasLoading[id] = atlasLoading[id] || (async () => {
    const [img, map] = await Promise.all([loadImg(`assets/atlas/${id}.webp?v=1`), fetch(`assets/atlas/${id}.json?v=1`).then(r => r.json())]);
    const C = CL[id], out = {};
    for (const [p, list] of Object.entries(map)) out[p] = list.map(([x, y, w, h]) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
      const sp = { c: p === 'cape' ? darken(c, C.capeTint || .85) : c, w, h };
      if (DARK.includes(p)) sp.dark = darken(sp.c, .72);
      return sp;
    });
    if (out.chest) out.chest.forEach(t => t.holeRef = out.chest[0]); // kol delikleri 1. seviyeden ölçülür
    return ATLAS[id] = out;
  })();
}
// tiers: tek sayı (bütün eşyalar aynı seviye) ya da { head: 3, boot: 5, ... }; bot konç ve ayağı birlikte yükselir
function withTiers(id, tiers) {
  const base = SPRITES[id] || {}, T = ATLAS[id];
  if (!tiers || !T) return base;
  const out = { ...base };
  for (const p in T) {
    const n = typeof tiers === 'number' ? tiers : (tiers[p] ?? tiers[p === 'shaft' || p === 'foot' ? 'boot' : p] ?? 1);
    const t = T[p][Math.min(T[p].length, Math.max(1, n)) - 1];
    if (t) out[p] = t;
  }
  return out;
}
function load(id, { noBaked } = {}) {
  if (SPRITES[id] && !noBaked) return Promise.resolve(SPRITES[id]);
  if (loading[id] && !noBaked) return loading[id];
  const p = (async () => {
    let out = null;
    if (!noBaked) { try { out = await fromBaked(id); } catch (e) { out = null; } }
    if (!out) out = await fromSheet(id);
    return SPRITES[id] = finish(out);
  })();
  if (!noBaked) loading[id] = p;
  return p;
}

/* ---------- Aktör ---------- */
function torsoFor(C, SPR) {
  const sp = SPR.chest, f = C.fit.chest;
  if (!sp) return (sh => ({ ...sh, left: BODY.torso.left, right: Math.max(BODY.torso.right, sh.shK[0] + 3) }))({ shS: [-40, 22], shK: [22, 20] });
  // yeni sayfa düzenindeki sınıflarda omuzlar göğüs zırhının kol deliklerinin ortasına otomatik konur
  const A = C.tierSheet ? { ...C.chest, ...(TierKit.armHoles(sp) || {}), ...(C.holes || {}) } : C.chest; // holes: otomatik bulma yanılırsa elle
  const k = f.h / sp.h, w = sp.w * k * (f.sx || 1), h = sp.h * k;
  const loc = ([u, v]) => [(u - A.neck[0]) * w, (v - A.neck[1]) * h];
  return (sh => ({ ...sh, left: Math.max(BODY.torso.left, -A.neck[0] * w + 14), right: Math.max(BODY.torso.right, sh.shK[0] + 3) }))({ shS: loc(A.armS), shK: loc(A.armK) });
}
// tek eşyanın belli seviyedeki resmi (ekipman panelindeki küçük resimler); bot için ayak parçası
function tierSprite(id, item, n) {
  const p = item === 'boot' ? 'foot' : item, T = ATLAS[id];
  return T && T[p] ? T[p][Math.min(T[p].length, Math.max(1, n)) - 1] : (SPRITES[id] || {})[p];
}
function actor(id, x, face, tiers) {
  const C = CL[id], SPR = withTiers(id, tiers);
  return { id, C, SPR, tiers, TORSO: torsoFor(C, SPR), BASE: { ...COMMON_BASE, ...C.base }, ANIMS: window.rigAnims(id),
    cur: 'idle', at: 0, fired: false, waits: [], ended: false, endCb: null, hitT: -9999,
    capeDrag: 0, lastHipX: null, x, face, off: 0, wp: {} };
}
// Animasyonun "eylem anı": büyü çıkışı, ok bırakma, atış ya da darbe
const actAt = an => an.cast ?? an.release ?? an.shoot ?? an.vines ?? an.hitAt ?? .5;
function play(A, name) {
  if (!A.ANIMS[name]) name = 'idle';
  A.cur = name; A.at = 0; A.fired = false; A.ended = false;
  if (A.ANIMS[name].flash) A.hitT = now();
  return new Promise(r => A.endCb = r);
}
const waitAct = A => new Promise(r => A.waits.push(r));
function update(A, dt) {
  A.at += dt;
  const an = A.ANIMS[A.cur]; if (an.loop) return;
  const p = A.at / an.dur;
  if (!A.fired && p >= actAt(an)) { A.fired = true; const w = A.waits; A.waits = []; w.forEach(f => f()); }
  if (p >= 1 && !A.ended) {
    A.ended = true; const cb = A.endCb; A.endCb = null;
    if (!an.hold) { A.cur = 'idle'; A.at = 0; }
    if (cb) cb();
  }
}
function keyPose(A, keys, p) {
  let i = 0; while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
  const [t0, a] = keys[i], [t1, b] = keys[i + 1];
  const k = ease(Math.min(1, Math.max(0, (p - t0) / (t1 - t0))));
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) out[key] = lerp(key in a ? a[key] : A.BASE[key], key in b ? b[key] : A.BASE[key], k);
  return out;
}
function poseOf(A, t) {
  const an = A.ANIMS[A.cur], B = A.BASE;
  const p = an.loop ? (A.at % an.dur) / an.dur : Math.min(1, A.at / an.dur);
  const P = { ...B, _p: p };
  const br = Math.sin(t / 380 + A.x);
  if (A.cur === 'idle') Object.assign(P, { crouch: B.crouch + br * .5 - .5, uaS: B.uaS + br * 2, uaK: B.uaK - br * 1.5, main: B.main + br * 2, head: br });
  else if (A.cur === 'walk') {
    const s = Math.sin(p * Math.PI * 2), c = Math.cos(p * Math.PI * 2);
    const k = A.stride || 1; // adım boyu çarpanı (kasabada uzun adım)
    Object.assign(P, { lean: 6, footF: 16 + 24 * k * s, footB: -18 - 24 * k * s, liftF: Math.max(0, c) * 14 * k, liftB: Math.max(0, -c) * 14 * k, uaS: B.uaS - 6 * s, crouch: 6 + Math.abs(s) * 4, head: -2 });
  } else Object.assign(P, keyPose(A, an.keys, p));
  return P;
}
function legIK(hip, ankle) {
  const t = L.thigh, s = L.shin;
  let dx = ankle[0] - hip[0], dy = ankle[1] - hip[1], d = Math.hypot(dx, dy);
  const maxD = t + s - .05; // düz bacak: neredeyse tam uzanabilir
  if (d > maxD) { const k = maxD / d; dx *= k; dy *= k; d = maxD; ankle = [hip[0] + dx, hip[1] + dy]; }
  const base = Math.atan2(dy, dx), a = Math.acos(Math.min(1, Math.max(-1, (t * t + d * d - s * s) / (2 * t * d))));
  const k1 = [hip[0] + Math.cos(base + a) * t, hip[1] + Math.sin(base + a) * t];
  const k2 = [hip[0] + Math.cos(base - a) * t, hip[1] + Math.sin(base - a) * t];
  const knee = k1[0] > k2[0] ? k1 : k2;
  return { knee, ankle, th: angOf(hip, knee), sh: angOf(knee, ankle) };
}
function solve(A, P) {
  const T = A.TORSO;
  const hip = [P.x, -L.sole - (L.thigh + L.shin) * .95 + P.crouch - P.lift];
  const tA = 180 - P.lean, tD = dd(tA);
  const neck = add(hip, tD, L.torso);
  const hA = 180 - P.lean - P.head;
  const head = add(neck, dd(hA), L.headR - 6);
  const side = [Math.cos(P.lean * R), Math.sin(P.lean * R)], down = [-tD[0], -tD[1]];
  const local = (x, y) => [neck[0] + side[0] * x + down[0] * y, neck[1] + side[1] * x + down[1] * y];
  const shS = local(...T.shS), shK = local(...T.shK);
  const aS = P.uaS + P.laS, aK = P.uaK + P.laK;
  const elS = add(shS, dd(P.uaS), L.ua), haS = add(elS, dd(aS), L.la);
  const elK = add(shK, dd(P.uaK), L.ua), haK = add(elK, dd(aK), L.la);
  const hipF = add(hip, [BODY.hips[0], 0], 1), hipB = add(hip, [BODY.hips[1], 0], 1);
  const legF = legIK(hipF, [P.x + P.footF, -L.sole - P.liftF - P.lift * .9]);
  const legB = legIK(hipB, [P.x + P.footB, -L.sole - P.liftB - P.lift * .9]);
  return { hip, neck, head, tA, hA, shS, shK, elS, elK, haS, haK, aS, aK, hipF, hipB, legF, legB };
}

/* ---------- Çizim ---------- */
// Göğüs zırhının ana rengi ve kenar rengi (kodla çizilen kol için); her resimde bir kez hesaplanır
function toneOf(sp) {
  if (sp.tone !== undefined) return sp.tone;
  const d = sp.c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, sp.w, sp.h).data, px = [];
  for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) {
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l > 45 && l < 235) px.push([d[i], d[i + 1], d[i + 2], l]);
  }
  if (px.length < 20) return sp.tone = null;
  px.sort((a, b) => a[3] - b[3]);
  const avg = arr => [0, 1, 2].map(k => Math.round(arr.reduce((s, p) => s + p[k], 0) / arr.length));
  const mid = avg(px.slice(px.length * .25, px.length * .7)), hi = avg(px.slice(px.length * .9));
  const rgb = (c, k = 1) => `rgb(${c.map(v => Math.round(v * k)).join(',')})`;
  return sp.tone = { base: rgb(mid, .8), dark: rgb(mid, .58), trim: rgb(hi), trimDark: rgb(hi, .72) }; // kumaş ten rengine benzemesin diye biraz koyu
}
// Üst kol: resmi varsa kol kılıfı, yoksa göğüs zırhının renginde kodla çizilen kumaş kol
function sleeve(c, A, a, b, dark) {
  if (item(c, A, 'sleeve', mix(a, b, .5), angOf(a, b), dark)) return;
  const sp = A.SPR.chest; if (!sp) return;
  const tn = toneOf(sp); if (!tn) return;
  const seg = (p, q, col, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); };
  c.save(); c.lineCap = 'round';
  seg(mix(a, b, .1), mix(a, b, .9), '#1a1620', L.arm + 10);
  seg(mix(a, b, .1), mix(a, b, .9), dark ? tn.dark : tn.base, L.arm + 5);
  c.lineCap = 'butt'; seg(mix(a, b, .76), mix(a, b, .9), dark ? tn.trimDark : tn.trim, L.arm + 5);
  c.restore();
}
function limb(c, a, b, w) {
  c.lineCap = 'round';
    c.strokeStyle = '#050407'; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
}
function dot(c, p, r) {
  c.fillStyle = '#050407'; c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fill();
}
function item(c, A, id, pos, ang, dark) {
  const sp = A.SPR[id]; if (!sp) return false;
  const f = A.C.fit[id], k = f.h / sp.h;
  c.save();
  c.translate(pos[0], pos[1]); c.rotate((f.s - ang) * R); c.scale(k * (f.sx || 1) * (f.flip ? -1 : 1), k);
  c.drawImage(dark && sp.dark ? sp.dark : sp.c, -f.px * sp.w, -f.py * sp.h);
  c.restore();
  return true;
}
function itemPoint(A, id, pos, ang, u, v) {
  const sp = A.SPR[id], f = A.C.fit[id]; if (!sp) return pos;
  const k = f.h / sp.h, lx = (u - f.px) * sp.w * k * (f.sx || 1) * (f.flip ? -1 : 1), ly = (v - f.py) * sp.h * k, th = (f.s - ang) * R;
  return [pos[0] + lx * Math.cos(th) - ly * Math.sin(th), pos[1] + lx * Math.sin(th) + ly * Math.cos(th)];
}
function glowAt(c, p, r, col, a) {
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
  const g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fill(); c.restore();
}
function drawLeg(c, A, hp, lg, lift, dark) {
  limb(c, hp, lg.knee, L.leg); limb(c, lg.knee, lg.ankle, L.leg - 1);
  const fa = lift * 1.2;
  if (!item(c, A, 'foot', lg.ankle, fa, dark)) {
    c.save(); c.translate(lg.ankle[0], lg.ankle[1]); c.rotate(-fa * R);
    c.fillStyle = '#050407'; c.beginPath(); c.ellipse(9, 6, 16, 7, 0, 0, 7); c.fill(); c.restore();
  }
  item(c, A, 'shaft', mix(lg.knee, lg.ankle, .66), lg.sh, dark);
  item(c, A, 'knee', lg.knee, lg.sh, dark);
}
function drawCape(c, A, J, t, dt) {
  const sp = A.SPR.cape; if (!sp) return;
  const hx = J.hip[0] + A.off;
  if (A.lastHipX == null) A.lastHipX = hx;
  const vx = (hx - A.lastHipX) / Math.max(dt, 1) * 16; A.lastHipX = hx;
  A.capeDrag = lerp(A.capeDrag, Math.max(-30, Math.min(30, vx * 3)), .12);
  const f = A.C.fit.cape, ch = A.SPR.chest, cf = A.C.fit.chest;
  // pelerin göğüs zırhıyla orantılı: eni göğsün eni x capeW; çok uzunsa boyu kısalır
  const kx = ch ? ch.w * (cf.h / ch.h) * (cf.sx || 1) * BODY.capeW / sp.w : f.h / sp.h;
  const ky = Math.min(kx, BODY.capeMaxH / sp.h);
  const top = add(mix(J.shS, J.shK, .5), [-10, -10], 1);
  c.save(); c.translate(top[0], top[1]); c.rotate((f.s - J.tA) * R); c.scale(kx, ky);
  const x0 = -f.px * sp.w, y0 = -f.py * sp.h, strip = 8, walking = A.cur === 'walk' ? 1 : 0;
  for (let y = 0; y < sp.h; y += strip) {
    const fr = y / sp.h, fall = Math.pow(fr, 1.4);
    const off = Math.sin(t / 260 - fr * 5) * (5 + walking * 6) * fall - A.capeDrag * 3 * fall - fall * 14;
    c.drawImage(sp.c, 0, y, sp.w, Math.min(strip + 1, sp.h - y), x0 + off, y0 + y, sp.w, Math.min(strip + 1, sp.h - y));
  }
  c.restore();
}
function headPath(c) {
  c.beginPath();
  c.moveTo(-2, -30);
  c.bezierCurveTo(-20, -30, -29, -16, -27, 0);
  c.bezierCurveTo(-26, 12, -20, 20, -12, 24);
  c.bezierCurveTo(-4, 29, 6, 30, 12, 27);
  c.bezierCurveTo(19, 24, 23, 17, 24, 10);
  c.bezierCurveTo(25, 6, 26, 3, 27, 0);
  c.bezierCurveTo(26, -3, 24, -5, 24, -9);
  c.bezierCurveTo(24, -20, 14, -30, -2, -30);
  c.closePath();
}
function drawHead(c, A, J) {
  // yüzü resimde çizili başlık (faceInHead): oyunun kafası ve gözleri yerine resimdeki yüz kullanılır
  if (A.C.faceInHead && A.SPR.head) { item(c, A, 'head', J.head, J.hA); return; }
  const C = A.C, H = C.hat && A.SPR.head ? C.hat : null, ang = (180 - J.hA) * R;
  if (H) item(c, A, 'head', J.head, J.hA); // şapka: tamamı önce kafanın arkasına
  c.save(); c.translate(J.head[0], J.head[1]); c.rotate(ang);
  headPath(c); c.fillStyle = '#050407'; c.fill();
  c.restore();
  if (H) { // kubbe ve kenarın ön yarısı kafanın önüne: kafa şapkanın içine girmiş gibi görünür
    const inHead = clip => { c.save(); c.translate(J.head[0], J.head[1]); c.rotate(ang); clip(); c.rotate(-ang); c.translate(-J.head[0], -J.head[1]); item(c, A, 'head', J.head, J.hA); c.restore(); };
    inHead(() => { c.beginPath(); c.rect(-300, -300, 600, 300 + H.ring); c.clip(); });
    inHead(() => {
      c.beginPath(); c.rect(-300, H.lipY, 600, 300); c.clip();
      c.beginPath(); c.ellipse(0, H.lipY, H.rx, H.ry, 0, 0, 7); c.ellipse(0, H.lipY, H.rx * .9, H.ry * .35, 0, 0, 7); c.clip('evenodd');
    });
  } else item(c, A, 'head', J.head, J.hA);
  const [ex, ey, es] = EYES;
  c.save(); c.translate(J.head[0], J.head[1]); c.rotate(ang);
  c.fillStyle = '#f4f1ea'; c.translate(ex, ey); c.scale(es, es);
  c.beginPath(); c.moveTo(-2, 10); c.quadraticCurveTo(8, 0, 21, 4); c.quadraticCurveTo(19, 20, 7, 21); c.quadraticCurveTo(-2, 18, -2, 10); c.fill();
  c.beginPath(); c.moveTo(26, 5); c.quadraticCurveTo(32, 2, 37, 4); c.quadraticCurveTo(37, 16, 31, 18); c.quadraticCurveTo(25, 14, 26, 5); c.fill();
  c.restore();
}

/* Aktörü (gx, gy) noktasına s ölçeğinde çizer. fx (yalnız ana sahnede): fx.spark({x,y,vx,vy,max,color}) */
function draw(c, A, t, dt, gx, gy, s, fx) {
  const P = poseOf(A, t), J = solve(A, P), C = A.C, an = A.ANIMS[A.cur];
  const world = (p) => { const m = c.getTransform(), w = m.transformPoint(new DOMPoint(p[0], p[1])); return [w.x, w.y]; };
  c.save();
  c.translate(gx + A.off * A.face, gy); c.scale(s * A.face, s);
  const fall = Math.abs(P.rot) / 90;
  c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(P.x - fall * 40, 0, 62 + fall * 84, 8, 0, 0, 7); c.fill();
  // düşüş: kalça yüksekliği etrafında döner, sonra yere iner (iskelet boyu değişse de beden yere düz yatar)
  const hipH = L.sole + (L.thigh + L.shin) * .95, pv = (hipH - 6.4) * fall, drop = (52 + hipH - 96.4) * fall;
  if (P.rot) { c.translate(0, drop); c.translate(P.x, -pv); c.rotate(P.rot * R); c.translate(-P.x, pv); }
  let alpha = 1;
  if (an.ghost) alpha = 1 - .7 * Math.sin(Math.min(1, P._p) * Math.PI);
  if (an.ghostIn && P._p < an.ghostIn) alpha = 1 - .85 * Math.sin(P._p / an.ghostIn * Math.PI);
  c.globalAlpha = alpha;
  if (fx && C.smoke && Math.random() < .35) { const w = world([J.hip[0] + (Math.random() - .5) * 90, J.hip[1] + 40 - Math.random() * 170]); fx.spark({ x: w[0], y: w[1], vx: (Math.random() - .5) * 14, vy: -20 - Math.random() * 30, max: 1, color: '#7a4aff' }); }

  drawCape(c, A, J, t, dt);
  drawLeg(c, A, J.hipB, J.legB, P.liftB, true);
  limb(c, J.shK, J.elK, L.arm); limb(c, J.elK, J.haK, L.arm - 1);
  sleeve(c, A, J.shK, J.elK, true);
  item(c, A, 'bracer', mix(J.elK, J.haK, .5), J.aK, true);
  if (!item(c, A, 'glove', J.haK, J.aK, true)) dot(c, J.haK, 9);
  c.save(); c.translate(J.neck[0], J.neck[1]); c.rotate((180 - J.tA) * R);
  const T = A.TORSO, tw = T.right - T.left, th = L.torso + 4;
  c.fillStyle = '#050407'; c.beginPath(); c.roundRect(T.left, 4, tw, th, [20, 20, 14, 14]); c.fill();
  c.restore();
  drawLeg(c, A, J.hipF, J.legF, P.liftF, false);
  item(c, A, 'chest', J.neck, J.tA);
  drawHead(c, A, J);
  // sol el eşyası
  const hideOff = an.hideOff && P._p > an.hideOff[0] && P._p < an.hideOff[1];
  if (C.floatOff) {
    const orbAt = add(J.haK, [10, -14 + Math.sin(t / 300) * 4], 1);
    if (A.SPR.off) glowAt(c, orbAt, 46, C.glow, .35 + (an.ward ? .4 : 0));
    item(c, A, 'off', orbAt, 180 - P.offTilt);
  } else if (hideOff) { /* fırlatıldı */ }
  else if (C.offFollow) item(c, A, 'off', J.haK, J.aK + P.off);
  else if (C.lantern || C.hang) {
    const sway = Math.sin(t / 420) * 6 + (P.lean || 0) * .5;
    item(c, A, 'off', J.haK, 180 - sway);
    if (C.lantern && A.SPR.off) glowAt(c, itemPoint(A, 'off', J.haK, 180 - sway, .5, .62), 40, C.glow, (A.cur === 'attack' || A.cur === 'block') ? .55 + .35 * Math.sin(t / 70) : .18);
  } else item(c, A, 'off', add(J.haK, [6, -2], 1), 180 - P.offTilt - P.lean * .5);
  // sağ kol + silah
  limb(c, J.shS, J.elS, L.arm); limb(c, J.elS, J.haS, L.arm - 1);
  sleeve(c, A, J.shS, J.elS);
  item(c, A, 'bracer', mix(J.elS, J.haS, .5), J.aS);
  const mainAng = C.mainAbs ? P.main : J.aS + P.main;
  const hideMain = an.hideMain && P._p > an.hideMain[0] && P._p < an.hideMain[1];
  if (!hideMain) item(c, A, 'main', J.haS, mainAng);
  if (!item(c, A, 'glove', J.haS, J.aS)) dot(c, J.haS, 9);
  if (C.castBolt && A.SPR.main) {
    const tip = itemPoint(A, 'main', J.haS, mainAng, .5, .08);
    const charge = A.cur === 'attack' ? Math.sin(Math.min(1, P._p / .5) * Math.PI / 2) : 0;
    glowAt(c, tip, 30 + charge * 40, C.glow, (C.tipIdle ?? .45) + charge * .5);
  }
  if (an.ward) {
    const k = Math.sin(Math.min(1, Math.max(0, P._p)) * Math.PI);
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = C.glow;
    c.beginPath(); c.ellipse(J.hip[0] + 6, J.hip[1] - 40, 95, 130, 0, 0, 7);
    c.globalAlpha = k * .18; c.lineWidth = 14; c.stroke();
    c.globalAlpha = k * .7; c.lineWidth = 4; c.stroke();
    c.globalAlpha = k * .12; c.fillStyle = C.glow; c.fill(); c.restore();
    if (fx && an.heal && Math.random() < .6 * k) { const w = world([J.hip[0] + (Math.random() - .5) * 140, J.hip[1] + 30 - Math.random() * 160]); fx.spark({ x: w[0], y: w[1], vx: (Math.random() - .5) * 20, vy: -60 - Math.random() * 60, max: .9, color: C.healColor || '#ffe08a' }); }
  }
  // oyun mantığı için dünya koordinatları (mermi çıkış noktaları)
  if (fx) A.wp = {
    tip: world(A.SPR.main ? itemPoint(A, 'main', J.haS, mainAng, .5, C.castBolt ? .08 : .05) : J.haS),
    handS: world(J.haS), handK: world(J.haK), chest: world([J.hip[0], J.hip[1] - 50]), feet: world([J.hip[0], 0])
  };
  c.restore();
}
function portrait(canvas, id, face = 1, glow, tiers) {
  const c = canvas.getContext('2d'), S = canvas.width;
  c.clearRect(0, 0, S, S);
  const g = c.createRadialGradient(S / 2, S * .6, 4, S / 2, S * .6, S * .65);
  g.addColorStop(0, (glow || '#3b3350') + '55'); g.addColorStop(1, '#0c0a12');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  if (!SPRITES[id]) return false;
  const A = actor(id, 0, face, tiers), J = solve(A, poseOf(A, 0)), s = S / 110;
  draw(c, A, 0, 16, S / 2 - J.head[0] * s * face, S * .62 - J.head[1] * s, s, null);
  return true;
}
// Geliştirme: sheet'ten kesip küçültülmüş PNG'leri ve portreyi yerel sunucuya yükler
async function bake(id, upload) {
  const S = await load(id, { noBaked: true }), C = CL[id], res = [];
  for (const p of partsOf(id)) {
    const sp = S[p]; if (!sp) continue;
    const th = Math.min(sp.h, Math.round(C.fit[p].h * 2.8)), k = th / sp.h;
    const c = document.createElement('canvas'); c.width = Math.round(sp.w * k); c.height = th;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(sp.c, 0, 0, c.width, c.height);
    res.push(await upload(`assets/baked/${id}_${p}.png`, c));
  }
  for (const [p, t] of Object.entries(TIERS[id] || {})) for (let n = 0; n < t.length; n++) {
    const sp = t[n], th = Math.min(sp.h, Math.round(C.fit[p].h * 2.8)), k = th / sp.h;
    const c = document.createElement('canvas'); c.width = Math.round(sp.w * k); c.height = th;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(sp.c, 0, 0, c.width, c.height);
    res.push(await upload(`assets/baked/${id}_${p}_t${n + 1}.png`, c));
  }
  const pc = document.createElement('canvas'); pc.width = pc.height = 160;
  portrait(pc, id, 1, C.glow);
  res.push(await upload(`assets/baked/${id}_portrait.png`, pc));
  return res;
}

window.Rig = { L, load, loadTiers, tierSprite, keyed, actor, play, waitAct, update, draw, portrait, bake, sprites: SPRITES, partsOf, actAt };
})();
