// Dil desteği (Türkçe / Русский / Հայերեն). Oyun Türkçe yazılır; bu katman ekrandaki metni çalışırken çevirir:
// DOM metinleri ve title/aria-label/placeholder/alt öznitelikleri (MutationObserver), tuval yazıları (fillText/strokeText).
// Sözlük: i18n-dict.js → window.I18N_DICT = { 'Türkçe metin': ['русский', 'հայերեն'], ... }
// '{0}', '{1}' içeren anahtarlar şablondur; yer tutucuya düşen parça da ayrıca çevrilir (beceri adı, sınıf adı gibi).
(function () {
  const LANGS = { tr: 'Türkçe', ru: 'Русский', hy: 'Հայերեն' };
  let lang = 'tr';
  try { lang = localStorage.getItem('sa.lang') || ''; } catch (e) {}
  if (!LANGS[lang]) { const n = (navigator.language || '').slice(0, 2).toLowerCase(); lang = LANGS[n] ? n : 'tr'; }
  const api = window.I18N = {
    LANGS, lang,
    set(l) { if (!LANGS[l] || l === lang) return; try { localStorage.setItem('sa.lang', l); } catch (e) {} location.reload(); },
    t: s => s, miss: new Set(),
  };
  document.documentElement.lang = lang;
  if (lang === 'tr') return;

  // Cinzel / Barlow'da Kiril ve Ermeni harfi yok: harf bazında yedek yazı tipleri
  const fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=' + (lang === 'ru' ? 'Cormorant+SC:wght@600;700&family=Roboto+Condensed:wght@400;600;700' : 'Noto+Serif+Armenian:wght@600;800&family=Noto+Sans+Armenian:wght@400;600;700') + '&display=swap';
  document.head.appendChild(fl);
  const DISP = lang === 'ru' ? "'Cormorant SC'" : "'Noto Serif Armenian'", BODY = lang === 'ru' ? "'Roboto Condensed'" : "'Noto Sans Armenian'";
  const st = document.createElement('style');
  st.textContent = `:root{--font-display:'Cinzel',${DISP},Georgia,serif;--font-body:'Barlow Semi Condensed',${BODY},'Arial Narrow',system-ui,sans-serif}`;
  document.head.appendChild(st);

  const I = lang === 'ru' ? 0 : 1, D = window.I18N_DICT || {};
  const exact = new Map(), tpls = [];
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [k, v] of Object.entries(D)) {
    const tr = v && v[I]; if (!tr) continue;
    const key = norm(k);
    if (/\{\d[#w]?\}/.test(key)) { // {0} herhangi bir parça, {0#} yalnız sayı, {0w} tek kelime
      const order = [];
      const re = new RegExp('^' + key.split(/(\{\d[#w]?\})/).map(p => { const m = /^\{(\d)([#w]?)\}$/.exec(p); if (m) { order.push(+m[1]); return m[2] === "w" ? '([^\\s,()]+)' : m[2] ? '([-+]?\\d[\\d.,]*)' : '([\\s\\S]*?)'; } return esc(p); }).join('') + '$');
      tpls.push({ re, order, tr, lit: key.replace(/\{\d[#w]?\}/g, '').length });
    } else exact.set(key, tr);
  }
  tpls.sort((a, b) => b.lit - a.lit); // en çok sabit metni olan şablon önce denenir

  const HAS_TR = /[A-Za-zçğıöşüÇĞİÖŞÜ]/;
  const cache = new Map();
  const L = 'A-Za-zçğıöşüÇĞİÖŞÜ', sub = (s, d) => d < 9 ? tr(s, d + 1) : s;
  function core(s, depth) {
    if (exact.has(s)) return exact.get(s);
    for (const t of tpls) {
      const m = t.re.exec(s); if (!m) continue;
      const g = []; t.order.forEach((n, i) => { g[n] = m[i + 1]; });
      return t.tr.replace(/\{(\d)\}/g, (_, n) => sub(g[+n] || '', depth));
    }
    if (depth >= 9) return null;
    // baştaki parantez: "(kritik!), sersemledi"
    let m = /^\(([^()]+)\)(\s*)(.*)$/.exec(s);
    if (m) return '(' + sub(m[1], depth) + ')' + m[2] + (m[3] ? sub(m[3], depth) : '');
    // güçlü ayraçlar: "A · B", "A — B"
    for (const sep of [' · ', ' — ', ' | ', '; ']) {
      const i = s.indexOf(sep);
      if (i > 0) return sub(s.slice(0, i), depth) + sep + sub(s.slice(i + sep.length), depth);
    }
    // baştaki işaret/sayı: "+120 Altın", "· Lig 3'e yükseldin!", ", sersemledi"
    const lead = re => { const x = re.exec(s); if (x) { const r = core(x[2], depth + 1); if (r !== null) return x[1] + r; } return null; };
    let r = lead(new RegExp('^([^' + L + '\\d%+-]+)(.+)$')); if (r !== null) return r;
    // zayıf ayraçlar: "A: B", "A, B"
    for (const sep of [': ', ', ']) {
      const i = s.indexOf(sep);
      if (i > 0) return sub(s.slice(0, i), depth) + sep + sub(s.slice(i + sep.length), depth);
    }
    r = lead(new RegExp('^([^' + L + '%]+)(.+)$')); if (r !== null) return r;
    m = /^(.*\S) \(([^()]+)\)$/.exec(s);
    if (m) return sub(m[1], depth) + ' (' + sub(m[2], depth) + ')';
    // sondaki işaret: "Altın:", "Seviye 3!"
    m = new RegExp('^(.*[' + L + '])([^' + L + ']+)$').exec(s);
    if (m) { const r = core(m[1], depth + 1); if (r !== null) return r + m[2]; }
    return null;
  }
  function tr(raw, depth = 0) {
    if (!raw || !HAS_TR.test(raw)) return raw;
    const lead = /^\s*/.exec(raw)[0], tail = /\s*$/.exec(raw)[0], s = norm(raw);
    let r = cache.get(s);
    if (r === undefined) {
      r = core(s, depth);
      if (r === null) { if (depth === 0 && /[çğıöşüÇĞİÖŞÜ]|\b(ve|ile|bir|için|Sv|Lig|Tur|TUR|Altın)\b/.test(s)) api.miss.add(s); r = s; }
      if (cache.size > 4000) cache.clear();
      cache.set(s, r);
    }
    return r === s ? raw : lead + r + tail;
  }
  api.t = s => tr(String(s));

  // ---- DOM ----
  const SKIP = 'script,style,textarea,.cm:not(.sys),[data-noi18n]';
  const doneText = new WeakMap(), doneAttr = new WeakMap(), ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  function textNode(n) {
    const v = n.data; if (doneText.get(n) === v) return;
    const p = n.parentElement; if (!p || p.closest(SKIP) || p.closest('[data-i18n-html]')) return;
    const t = tr(v); doneText.set(n, t); if (t !== v) n.data = t;
  }
  function attrs(el) {
    let m = doneAttr.get(el);
    for (const a of ATTRS) {
      const v = el.getAttribute(a); if (v == null || (m && m[a] === v)) continue;
      if (el.closest(SKIP)) return;
      const t = tr(v); if (!m) doneAttr.set(el, m = {}); m[a] = t; if (t !== v) el.setAttribute(a, t);
    }
  }
  function rich(el) { // satır içi etiketlerle bölünmüş paragraf: bütün HTML tek anahtar
    const v = el.innerHTML; if (el.__i18n === v) return;
    const k = norm(v), t = exact.get(k); el.__i18n = t || v; if (t) el.innerHTML = t;
  }
  function walk(root) {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1) return;
    if (root.matches(SKIP)) return;
    if (root.hasAttribute('data-i18n-html')) rich(root);
    attrs(root);
    for (const el of root.querySelectorAll('[data-i18n-html]')) rich(el);
    for (const el of root.querySelectorAll('[title],[aria-label],[placeholder],[alt]')) attrs(el);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) textNode(n);
  }
  const mo = new MutationObserver(list => {
    for (const r of list) {
      if (r.type === 'characterData') textNode(r.target);
      else if (r.type === 'attributes') attrs(r.target);
      else for (const n of r.addedNodes) walk(n);
      if (r.type === 'childList' && r.target.nodeType === 1) { const h = r.target.closest('[data-i18n-html]'); if (h) rich(h); }
    }
  });
  const start = () => { walk(document.body); document.title = tr(document.title); mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS }); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  // ---- tuval ----
  const P = CanvasRenderingContext2D.prototype;
  for (const fn of ['fillText', 'strokeText', 'measureText']) {
    const o = P[fn]; P[fn] = function (s, ...a) { return o.call(this, typeof s === 'string' ? tr(s) : s, ...a); };
  }
  const fd = Object.getOwnPropertyDescriptor(P, 'font');
  Object.defineProperty(P, 'font', { configurable: true, get() { return fd.get.call(this); }, set(v) { fd.set.call(this, String(v).replace(/(Cinzel|"Barlow Semi Condensed")/, m => m + ', ' + (m === 'Cinzel' ? DISP : BODY))); } });

  // ---- tarayıcı pencereleri (alert/confirm) ----
  for (const fn of ['alert', 'confirm', 'prompt']) { const o = window[fn]; if (o) window[fn] = (m, ...a) => o.call(window, tr(String(m)), ...a); }
})();
