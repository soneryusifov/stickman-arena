/* Stickman Arena sesleri: dosya kullanmadan Web Audio ile üretilen ortaçağ temalı efektler ve müzik.
   Sfx.play(ad) efekt çalar, Sfx.music('town' | 'battle' | null) müziği değiştirir.
   Tarayıcılar sesi ancak ilk dokunuş/tuştan sonra açtığı için motor o an kurulur.
   Çalgılar: lavta (Karplus-Strong tel modeli), kaval, çarklı lir demi, borazan, koro, def, savaş davulu;
   efektlerde çelik, örs, çan ve tahta kalkan sesleri. */
(() => {
let ctx = null, master, sfxBus, musBus, verb;
const st = { sfx: true, music: true, track: null };
try { st.sfx = localStorage.getItem('sa.sfx') !== '0'; st.music = localStorage.getItem('sa.music') !== '0'; } catch (e) {}
const MUS_VOL = .38, SFX_VOL = .75;

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = .9; master.connect(comp);
  // taş salon yankısı: kısa bir yankı tepkisi, iki kanala da biraz gönderilir
  verb = ctx.createConvolver(); verb.buffer = hallIR(1.8); const vg = ctx.createGain(); vg.gain.value = .32; verb.connect(vg); vg.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = st.sfx ? SFX_VOL : 0; sfxBus.connect(master);
  musBus = ctx.createGain(); musBus.gain.value = st.music ? MUS_VOL : 0; musBus.connect(master);
  const s1 = ctx.createGain(); s1.gain.value = .25; sfxBus.connect(s1); s1.connect(verb);
  const s2 = ctx.createGain(); s2.gain.value = .55; musBus.connect(s2); s2.connect(verb);
  return true;
}
function hallIR(sec) {
  const sr = ctx.sampleRate, len = Math.floor(sr * sec), b = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  return b;
}
function unlock() {
  if (!init()) return;
  if (ctx.state === 'suspended') ctx.resume();
  loadFiles();
  if (st.track && !sched) startMusic(st.track);
}
addEventListener('pointerdown', unlock, { capture: true });
addEventListener('keydown', unlock, { capture: true });
document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : ctx.resume(); });

/* ---------- yapı taşları ---------- */
const N = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI notası -> Hz
const now = () => ctx.currentTime;
let noiseBuf = null;
function noiseBuffer() {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function env(g, t, a, peak, dur, sustain) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  if (sustain) g.gain.setValueAtTime(peak, t + Math.max(a, dur - sustain));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
// basit osilatör sesi. o: { f, to, type, vol, a, dur, t, bus, lp, hold }
function tone(o) {
  const t = o.t ?? now(), osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
  env(g, t, o.a || .005, o.vol ?? .3, o.dur, o.hold);
  let node = osc;
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
  node.connect(g); g.connect(o.bus || sfxBus);
  osc.start(t); osc.stop(t + o.dur + .05);
}
// süzgeçli gürültü. o: { dur, vol, ft, ff, fto, q, t, bus, a }
function noise(o) {
  const t = o.t ?? now(), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuffer(); src.loop = true;
  f.type = o.ft || 'lowpass'; f.frequency.setValueAtTime(o.ff || 1200, t); f.Q.value = o.q || 1;
  if (o.fto) f.frequency.exponentialRampToValueAtTime(o.fto, t + o.dur);
  env(g, t, o.a || .003, o.vol ?? .3, o.dur);
  src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
  src.start(t, Math.random() * 1.5); src.stop(t + o.dur + .05);
}
// metal: uyumsuz kısmi sesler (çelik, örs, çan). ratios: kısmi oranları
function metal(f, dur, vol, t = now(), ratios = [1, 2.76, 5.4, 8.93], bus = sfxBus) {
  ratios.forEach((r, i) => tone({ f: f * r, dur: dur / (1 + i * .55), vol: vol / (1 + i * .9), t, bus, a: .002 }));
}
// lavta: Karplus-Strong tel modeli; nota başına tampon bir kez üretilip saklanır
const plucks = {};
function pluckBuf(midi, bright = .5) {
  const key = midi + ':' + bright; if (plucks[key]) return plucks[key];
  const sr = ctx.sampleRate, f = N(midi), len = Math.floor(sr * 1.6), P = Math.max(2, Math.round(sr / f));
  const buf = ctx.createBuffer(1, len, sr), out = buf.getChannelData(0), line = new Float32Array(P);
  let prev = 0; for (let i = 0; i < P; i++) { const r = Math.random() * 2 - 1; prev = prev + bright * (r - prev); line[i] = prev; } // yumuşak tel başlangıcı
  const decay = .996 - Math.min(.006, f / 120000);
  for (let i = 0, k = 0; i < len; i++) { const v = line[k], n = line[(k + 1) % P]; out[i] = v; line[k] = decay * .5 * (v + n); k = (k + 1) % P; }
  return plucks[key] = buf;
}
function pluck(midi, t, vol, bus = musBus, dur = 1.4, bright = .5) {
  const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  src.buffer = pluckBuf(midi, bright); f.type = 'lowpass'; f.frequency.value = 3200;
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(bus); src.start(t); src.stop(t + dur + .05);
}
// kaval / flüt: sinüs + vibrato + nefes gürültüsü
function flute(midi, t, dur, vol, bus = musBus) {
  const f = N(midi), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'sine'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2;
  lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .006, t + Math.min(.35, dur * .6));
  lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  const g2 = ctx.createGain(); g2.gain.value = .12; o2.connect(g2); g2.connect(g);
  o.connect(g); env(g, t, .06, vol, dur, dur * .5); g.connect(bus);
  noise({ dur: Math.min(dur, .25), vol: vol * .18, ft: 'bandpass', ff: f * 2, q: 4, t, bus, a: .02 });
  [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + .05); });
}
// borazan: süzgeci zarfla açılan testere dişi
function horn(midi, t, dur, vol, bus = musBus) {
  const f = N(midi), o = ctx.createOscillator(), o2 = ctx.createOscillator(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 7;
  o.frequency.setValueAtTime(f * .97, t); o.frequency.linearRampToValueAtTime(f, t + .06);
  flt.type = 'lowpass'; flt.Q.value = 2; flt.frequency.setValueAtTime(f * 1.2, t); flt.frequency.linearRampToValueAtTime(f * 5, t + .08); flt.frequency.exponentialRampToValueAtTime(f * 2.5, t + dur);
  o.connect(flt); o2.connect(flt); flt.connect(g); env(g, t, .05, vol, dur, dur * .55); g.connect(bus);
  [o, o2].forEach(x => { x.start(t); x.stop(t + dur + .05); });
}
// koro "aaa": testere dişi + iki biçimlendirici süzgeç
function choir(midis, t, dur, vol, bus = sfxBus) {
  midis.forEach((m, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = N(m); o.detune.value = (i - 1) * 6;
    [[730, 6], [1150, 8]].forEach(([ff, q]) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; o.connect(b); b.connect(g); });
    env(g, t, dur * .35, vol, dur, dur * .3); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  });
}
// davullar
function drum(t, f, vol, bus = musBus, dur = .35) { tone({ f: f * 1.6, to: f, dur, vol, t, bus }); noise({ dur: dur * .4, vol: vol * .35, ff: 900, t, bus }); }
function tambour(t, vol, bus = musBus) { noise({ dur: .09, vol, ft: 'bandpass', ff: 5200, q: 3, t, bus }); noise({ dur: .05, vol: vol * .7, ft: 'bandpass', ff: 8000, q: 4, t: t + .02, bus }); }

/* ---------- efektler ---------- */
const SFX = {
  // kılıç çeliği ve darbe
  hit()   { noise({ dur: .05, vol: .5, ft: 'highpass', ff: 1800 }); metal(1150 + Math.random() * 300, .35, .16); tone({ f: 130, to: 60, dur: .12, vol: .4 }); },
  crit()  { noise({ dur: .07, vol: .6, ft: 'highpass', ff: 1500 }); metal(980, .9, .17); metal(1470, .7, .09, now() + .02); tone({ f: 110, to: 45, dur: .2, vol: .42 }); },
  big()   { tone({ f: 85, to: 32, dur: .45, vol: .52 }); noise({ dur: .3, vol: .45, ff: 700, fto: 120 }); metal(620, .8, .2); },
  // kılıç savurma vınlaması
  miss()  { noise({ dur: .22, vol: 1.1, ft: 'bandpass', ff: 600, fto: 2600, q: 3, a: .06 }); },
  // tahta kalkan gümlemesi + metal kenar
  block() { tone({ f: 190, to: 120, dur: .18, vol: .5, type: 'triangle' }); noise({ dur: .12, vol: .4, ff: 900 }); metal(1650, .4, .07, now() + .01); },
  // büyü: parlak çan ve pırıltı
  bolt()  { const t = now(); metal(1320, 1, .1, t, [1, 2.0, 3.01]); tone({ f: 600, to: 1500, dur: .3, vol: .1, type: 'triangle' }); noise({ dur: .35, vol: .06, ft: 'highpass', ff: 7000, t: t + .05, a: .05 }); },
  // ok: yay teli + ıslık
  arrow() { const t = now(); pluck(43, t, .7, sfxBus, .35, .9); noise({ dur: .2, vol: .35, ft: 'bandpass', ff: 3200, fto: 1400, q: 5, t: t + .05 }); },
  meteor(){ noise({ dur: .8, vol: .45, ff: 400, fto: 2500, a: .25 }); tone({ f: 70, to: 28, dur: 1, vol: .6, a: .3 }); },
  // sarmaşık: hışırtı ve odun çatırtısı
  vines() { const t = now(); noise({ dur: .4, vol: .8, ft: 'bandpass', ff: 900, fto: 2200, q: 1.2 }); for (let i = 0; i < 4; i++) noise({ dur: .03, vol: .35, ft: 'bandpass', ff: 1800, q: 6, t: t + .08 + i * .07 }); },
  // iyileşme: koro ve kilise çanı
  heal()  { const t = now(); choir([62, 66, 69], t, 1.2, .12); metal(N(86), 1.4, .11, t + .1, [1, 2.0, 3.0, 4.2]); },
  // iksir: mantar tıpa ve gulgul
  potion(){ const t = now(); tone({ f: 900, to: 300, dur: .06, vol: .4, type: 'triangle' }); noise({ dur: .03, vol: .4, ft: 'highpass', ff: 3000 }); for (let i = 0; i < 4; i++) tone({ f: 220 + i * 25, to: 420 + i * 40, dur: .09, vol: .25, t: t + .18 + i * .1 }); },
  // kalkan duruşu: metal çınlama ve kısa koro
  shield(){ const t = now(); metal(880, .9, .18, t, [1, 2.01, 3.0]); choir([57, 64], t + .05, .8, .05); },
  // öfke: savaş borusu
  rage()  { const t = now(); horn(50, t, .55, .22, sfxBus); horn(57, t, .55, .14, sfxBus); tone({ f: 70, to: 45, dur: .5, vol: .4, t }); },
  // sersemleme: el çanı
  stun()  { const t = now(); metal(1800, .7, .1, t, [1, 2.4, 4.1]); metal(1800, .6, .07, t + .18, [1, 2.4, 4.1]); },
  // zafer: borazan fanfarı ve davul
  win()   { const t = now(); [[62, 0, .18], [62, .2, .12], [62, .34, .12], [69, .5, .3], [66, .85, .2], [74, 1.1, 1]].forEach(([n, d, l]) => horn(n, t + d, l, .2, sfxBus)); drum(t + 1.1, 70, .5, sfxBus, .5); },
  // yenilgi: alçak, inen boru ve davul
  lose()  { const t = now(); [[57, 0, .5], [53, .45, .5], [50, .9, 1.2]].forEach(([n, d, l]) => horn(n, t + d, l, .18, sfxBus)); drum(t + .9, 55, .45, sfxBus, .6); },
  // altın: para şıngırtısı
  coin()  { const t = now(); for (let i = 0; i < 5; i++) metal(2600 + Math.random() * 1400, .25, .13, t + i * .045 + Math.random() * .02, [1, 2.7]); },
  // yükseltme: örse iki çekiç darbesi
  upgrade(){ const t = now(); [0, .16].forEach((d, i) => { metal(i ? 1560 : 1380, .9, .2, t + d, [1, 2.52, 4.1, 6.3]); noise({ dur: .03, vol: .4, ft: 'highpass', ff: 2500, t: t + d }); }); },
  click() { noise({ dur: .02, vol: .2, ft: 'bandpass', ff: 2200, q: 3 }); }
};
/* ---------- kayıtlı efekt dosyaları (ElevenLabs ile üretildi) ----------
   Yüklenen dosya varsa o çalar, yoksa yukarıdaki üretilmiş ses yedek olarak çalar.
   Dosyalar yüklenirken baştaki sessizlik kırpılır ve ses düzeyi eşitlenir;
   max: en uzun çalma süresi (sn), g: ek ses düzeyi çarpanı */
const FILES = {
  hit: { max: .6 }, crit: { max: 1.2 }, big: { max: 1.4 }, miss: { max: .8 }, block: { max: .8 }, bolt: { max: 1.2 },
  arrow: { max: .8 }, meteor: { max: 1.8 }, vines: { max: 1.5 }, heal: { max: 1.5, g: .8 }, potion: { max: 2 },
  shield: { max: 1.2 }, rage: { max: 1.4 }, stun: { max: 1.2, g: .8 }, win: { max: 3, g: .85 }, lose: { max: 2.5, g: .85 },
  coin: { max: 1, g: .7 }, upgrade: { max: 1 }, click: { max: .25, g: .4 }
};
const BUFS = {};
let filesLoading = false;
// dosyayı çözer; baştaki sessizliği ve gereken yükseltmeyi hesaplar
async function decodeFile(url) {
  const r = await fetch(url); if (!r.ok) return null;
  const b = await ctx.decodeAudioData(await r.arrayBuffer());
  let pk = 0; for (let c = 0; c < b.numberOfChannels; c++) for (const v of b.getChannelData(c)) pk = Math.max(pk, Math.abs(v));
  if (pk < .001) return null;
  const d = b.getChannelData(0); let s = 0; while (s < d.length && Math.abs(d[s]) < pk * .1) s++;
  return { b, off: Math.max(0, s / b.sampleRate - .005), gain: Math.min(20, .8 / pk) };
}
async function loadFiles() {
  if (filesLoading) return; filesLoading = true;
  await Promise.all(Object.keys(FILES).map(async n => { try { const F = await decodeFile(`assets/sfx/${n}.mp3?v=2`); if (F) BUFS[n] = F; } catch (e) {} }));
  for (const c of pendingSkills) loadSkills(c);
}
/* ---------- sınıfa özgü yetenek sesleri: assets/sfx/skills/{sınıf}_{0-3}.mp3, savaşa girerken yüklenir ---------- */
const SKILL_MAX = [1.4, 1.6, 1.6, 2];  // yetenek sırasına göre en uzun süre (4. yetenek büyük vuruş)
const SKILLS = {}, skillLoading = {}, pendingSkills = new Set();
function loadSkills(cls) {
  if (!ctx) { pendingSkills.add(cls); return; }
  if (skillLoading[cls]) return; skillLoading[cls] = true;
  [0, 1, 2, 3].forEach(async i => { try { const F = await decodeFile(`assets/sfx/skills/${cls}_${i}.mp3?v=1`); if (F) SKILLS[cls + '_' + i] = { ...F, max: SKILL_MAX[i] }; } catch (e) {} });
}
function playBuf(F, max, g = 1) {
  const t = now(), src = ctx.createBufferSource(), gn = ctx.createGain(), dur = Math.min(max, F.b.duration - F.off), v = F.gain * g;
  gn.gain.setValueAtTime(v, t); gn.gain.setValueAtTime(v, t + Math.max(0, dur - .15)); gn.gain.linearRampToValueAtTime(0.0001, t + dur);
  src.buffer = F.b; src.connect(gn); gn.connect(sfxBus); src.start(t, F.off); src.stop(t + dur + .02);
}
// yeteneğin kendi sesini çalar; dosya yoksa false döner (oyun genel sesi çalar)
function skill(key) {
  if (!st.sfx || !ctx || ctx.state !== 'running') return !!SKILLS[key];
  const F = SKILLS[key]; if (!F) return false;
  try { playBuf(F, F.max, .9); } catch (e) {}
  return true;
}
function playFile(name) {
  const F = BUFS[name], o = FILES[name]; if (!F) return false;
  const t = now(), src = ctx.createBufferSource(), g = ctx.createGain(), dur = Math.min(o.max, F.b.duration - F.off);
  const v = F.gain * (o.g || 1);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0, dur - .12)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  src.buffer = F.b; src.connect(g); g.connect(sfxBus); src.start(t, F.off); src.stop(t + dur + .02);
  return true;
}
function play(name) {
  if (!st.sfx || !ctx || ctx.state !== 'running') return;
  try { if (!playFile(name) && SFX[name]) SFX[name](); } catch (e) {}
}

/* ---------- müzik ---------- */
// kasaba: D dorian, 6/8 halk havası (adım = sekizlik). melodi: [adım, nota, uzunluk]
const TOWN_MEL = [
  [[0, 69, 2], [2, 67, 1], [3, 65, 2], [5, 64, 1]],
  [[0, 62, 3], [3, 64, 1], [4, 65, 1], [5, 67, 1]],
  [[0, 69, 2], [2, 72, 1], [3, 71, 2], [5, 69, 1]],
  [[0, 67, 3], [3, 64, 3]],
  [[0, 69, 2], [2, 67, 1], [3, 65, 2], [5, 64, 1]],
  [[0, 62, 2], [2, 64, 1], [3, 65, 1], [4, 67, 1], [5, 69, 1]],
  [[0, 72, 2], [2, 71, 1], [3, 69, 1], [4, 67, 1], [5, 64, 1]],
  [[0, 62, 6]]
];
const TOWN_CH = [[50, 53, 57], [50, 53, 57], [53, 57, 60], [48, 52, 55], [50, 53, 57], [55, 59, 62], [48, 52, 55], [50, 53, 57]];
// savaş: D minör, 4/4 (adım = onaltılık); tellilerin ostinatosu ve borazan çağrıları
const WAR_OST = [0, 0, 12, 0, 3, 0, 7, 5, 0, 0, 12, 0, 3, 5, 7, 3];
const WAR_ROOT = [38, 38, 34, 36];
const HORN_CALL = [[0, 62, 2], [3, 62, 1], [4, 69, 4], [8, 67, 2], [10, 65, 2], [12, 62, 4]];
const SONGS = {
  town: { stepSec: 60 / 104 / 2, bars: 8, steps: 6,
    drone: [[38, .05], [45, .035]],
    step(i, bar, t, d) {
      const ch = TOWN_CH[bar];
      // lavta eşliği: kök, beşli, üçlü dolaşan arpej
      const arp = [ch[0], ch[2], ch[1] + 12, ch[0] + 12, ch[2], ch[1] + 12][i];
      pluck(arp, t, i === 0 ? .55 : .38, musBus, 1.3, .45);
      // kaval melodisi (her döngünün ikinci yarısında bir oktav yukarı süslenir)
      for (const [s, n, l] of TOWN_MEL[bar]) if (s === i) flute(n + (bar >= 4 && bar < 7 && Math.random() < .25 ? 12 : 0), t, l * d * .95, .16);
      // def ve tef: 6/8 vuruşu
      if (i === 0) drum(t, 90, .28);
      if (i === 3) drum(t, 110, .16);
      if (i === 2 || i === 5) tambour(t, .07);
    } },
  battle: { stepSec: 60 / 116 / 4, bars: 4, steps: 16,
    drone: [[26, .07], [33, .05]],
    step(i, bar, t, d) {
      const r = WAR_ROOT[bar];
      // savaş davulları
      if (i === 0 || i === 6 || i === 8 || i === 11) drum(t, i === 0 ? 55 : 65, i === 0 ? .7 : .45, musBus, .5);
      if (i === 4 || i === 12) { drum(t, 140, .3, musBus, .18); tambour(t, .1); }
      if (i % 2 === 1) tambour(t, .035);
      // tellilerin gergin ostinatosu
      if (i % 2 === 0) pluck(r + 12 + WAR_OST[i], t, .32, musBus, .5, .8);
      // borazan çağrısı: 1. ve 3. ölçüde
      if (bar === 0 || bar === 2) for (const [s, n, l] of HORN_CALL) if (s === i) horn(n - (bar === 2 ? 2 : 0), t, l * d * 1.05, .1);
    } }
};
let sched = null, step = 0, nextT = 0, droneNodes = [];
function startMusic(name) {
  stopMusic();
  const S = SONGS[name]; if (!S || !ctx) return;
  step = 0; nextT = now() + .12;
  // sürekli dem (çarklı lir): hafif titreşimli testere dişi
  droneNodes = S.drone.flatMap(([m, v]) => {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = N(m); f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 1.5;
    l.frequency.value = 4.5; lg.gain.value = v * .25; l.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0.0001, now()); g.gain.exponentialRampToValueAtTime(v, now() + 1.5);
    o.connect(f); f.connect(g); g.connect(musBus); o.start(); l.start();
    return [{ o, g }, { o: l }];
  });
  sched = setInterval(() => {
    while (nextT < now() + .3) {
      const bar = Math.floor(step / S.steps) % S.bars, i = step % S.steps;
      try { S.step(i, bar, nextT, S.stepSec); } catch (e) {}
      step++; nextT += S.stepSec;
    }
  }, 60);
}
function stopMusic() {
  if (sched) { clearInterval(sched); sched = null; }
  for (const n of droneNodes) { try { if (n.g) n.g.gain.setTargetAtTime(0.0001, now(), .2); n.o.stop(now() + .8); } catch (e) {} }
  droneNodes = [];
}
function music(name) {
  if (st.track === name) return;
  st.track = name;
  if (!ctx || ctx.state !== 'running') return; // ilk dokunuşta başlar
  name ? startMusic(name) : stopMusic();
}
function setSfx(on) { st.sfx = on; try { localStorage.setItem('sa.sfx', on ? '1' : '0'); } catch (e) {} if (sfxBus) sfxBus.gain.value = on ? SFX_VOL : 0; }
function setMusic(on) {
  st.music = on; try { localStorage.setItem('sa.music', on ? '1' : '0'); } catch (e) {}
  if (musBus) musBus.gain.setTargetAtTime(on ? MUS_VOL : 0, now(), .15);
}
window.Sfx = { play, skill, loadSkills, music, setSfx, setMusic, unlock, get sfx() { return st.sfx; }, get musicOn() { return st.music; }, get running() { return !!ctx && ctx.state === 'running'; }, get files() { return Object.keys(BUFS); } };
})();
