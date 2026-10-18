/* Stickman Arena: 15 sınıfın iskelet/ekipman ayarları ve animasyonları.
   Karakter Atölyesi ve savaş oyunu bu dosyayı ortak kullanır. */
(() => {
window.RIG_CLASSES = {
  tank: {
    name: 'Tank', set: 'assets/tank_common_set.webp', cape: 'assets/tank_common_cape.webp', rows: 3,
    order: ['head', 'chest', 'shoulder', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off'],
    // metal merdiveni, üç sayfa: küçük eşyalar (miğfer kafayla çizili), iki parçalı bot (bilekte top-oyuk),
    // büyük eşyalar. Kılıçlar resimde aynı boyda; 10. seviye 1.5 kat uzun olacak şekilde burada büyütülür.
    tierSheet: [
      { src: 'assets/tank_small2.webp', rows: ['head', 'sleeve', 'bracer', 'glove', 'knee'] },
      { src: 'assets/tank_boots_split.webp', rows: ['shaft', 'foot'] },
      { src: 'assets/tank_big.webp', rows: ['chest', 'off', 'main', 'cape'], anchors: { cape: 'top' }, grow: { main: 1.5 } }
    ],
    faceInHead: true,
    items: [['head', 'Miğfer'], ['chest', 'Göğüs'], ['sleeve', 'Zincir kol'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Kılıç'], ['off', 'Kalkan'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 150, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      glove:  { h: 32,  px: .5,  py: .62, s: 0 },
      bracer: { h: 44,  px: .5,  py: .5,  s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 170, px: .5,  py: .82, s: 180 },
      off:    { h: 112, px: .5,  py: .5,  s: 180, sx: .88 },
      cape:   { h: 210, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    eyes: [4, 5, .56], capeTint: .82,
    base: { uaS: -16, laS: 36, main: 40, uaK: 20, laK: 64 },
    attackLabel: 'Saldır', glow: '#ffd27a'
  },
  mage: {
    name: 'Mage', set: 'assets/mage_common_set.webp', cape: 'assets/mage_common_cape.webp', rows: 2,
    // bütün eşyalar 10 seviyesiyle tek sayfada; kapüşon yapay zekânın çizdiği yüzle birlikte (faceInHead)
    // üç sayfa: küçük eşyalar (2. satır yanlış çizildi, atlanır), ayrı kol kılıfı satırı, büyük eşyalar
    tierSheet: [
      { src: 'assets/mage_small.webp', rows: ['head', '_robe', 'bracer', 'glove', 'knee', ['shaft', 'foot']] },
      { src: 'assets/mage_sleeve.webp', rows: ['sleeve'] },
      { src: 'assets/mage_big.webp', rows: ['chest', 'off', 'main', 'cape'], anchors: { cape: 'top' }, grow: { main: 1.5 } }
    ],
    faceInHead: true,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off'],
    items: [['head', 'Şapka'], ['chest', 'Cüppe'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Bileklik'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Asa'], ['off', 'Kitap'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 130, px: .47, py: .68, s: 180 },
      chest:  { h: 150, px: .45, py: .1, s: 180 },
      sleeve: { h: 40,  px: .5,  py: .5, s: 0 },
      glove:  { h: 26,  px: .5,  py: .62, s: 0 },
      bracer: { h: 38,  px: .5,  py: .5, s: 0 },
      knee:   { h: 48,  px: .5,  py: .38, s: 0 },
      shaft:  { h: 56,  px: .5,  py: .55, s: 0 },
      foot:   { h: 42,  px: .3,  py: .3, s: 0 },
      main:   { h: 160, px: .5,  py: .7,  s: 180 },
      off:    { h: 66,  px: .5,  py: .5, s: 180 },
      cape:   { h: 210, px: .49, py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.12, .3], armK: [.9, .28] },
    // kapüşonun yüz açıklığı x .45–.85, y .35–.8 (merkez ≈ .65,.55)
    eyes: [-1, -6, .56], capeTint: .8,
    // asa gövdenin yanında dik durur (yüzü kapatmaz)
    base: { uaS: -10, laS: 16, main: 170, uaK: 30, laK: 54 },
    attackLabel: 'Büyü', glow: '#c77dff', floatOff: true, castBolt: true
  },
  // Warrior: pelerin sprite sheet'in 9. hücresinde; sol eldeki balta ön kolla birlikte döner
  warrior: {
    name: 'Warrior', set: 'assets/warrior_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // samuray: 10 eşya 10 seviyesiyle tek sayfada; kabuto yapay zekânın çizdiği yüzle (faceInHead).
    // İki elde aynı katana: resimde seviye başına tek katana, sol el (off) onun kopyasını kullanır.
    // Katana resimde kısa çiziliyor: boyuna 1.3 kat uzatılır; seviyeyle büyüme %50.
    // üç sayfa: küçük eşyalar (2. satır yanlışlıkla dō zırhı, atlanır), ayrı kote satırı, büyük eşyalar.
    // İki elde aynı katana: sol el (off) sağ elin resmini kullanır; seviyeyle büyüme %50.
    tierSheet: [
      { src: 'assets/warrior_small.webp', rows: ['head', '_do', 'sleeve', 'glove', 'knee', ['shaft', 'foot']] },
      { src: 'assets/warrior_kote.webp', rows: ['bracer'] },
      { src: 'assets/warrior_big.webp', rows: ['chest', 'main', 'cape'], anchors: { cape: 'top' }, grow: { main: 1.5 }, same: { off: 'main' } }
    ],
    faceInHead: true,
    items: [['head', 'Kabuto'], ['chest', 'Dō zırhı'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kote'], ['glove', 'Tekko'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Katana'], ['off', 'Sol katana'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 118, px: .5,  py: .62, s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 40,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 170, px: .5,  py: .82, s: 180 },
      off:    { h: 170, px: .5,  py: .82, s: 180 },
      cape:   { h: 205, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    eyes: [-10, 4, .56], capeTint: .82,
    base: { uaS: -16, laS: 36, main: 40, uaK: 18, laK: 50, off: 92 },
    attackLabel: 'Çift darbe', glow: '#ff6a5a', offFollow: true
  },
  // Vampire: sağ elde meç, sol elde kıvrık hançer (ön kolla döner)
  vampire: {
    name: 'Vampire', set: 'assets/vampire_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // gotik soylu, motif merdiveni (gül 4-7, yarasa 8-10). Üç sayfa: büyük eşyalar, küçük eşyalar (kapüşon,
    // eldiven, dizlik; diğer satırları yanlış çizildi, atlanır), kol kılıfı + manşet + iki parçalı bot (saydam zemin).
    tierSheet: [
      { src: 'assets/vampire_small.webp', rows: ['head', 'glove', 'knee', '_cuff', '_vest', ['_shaft', '_foot']] },
      { src: 'assets/vampire_arms.webp', rows: [['shaft', 'foot'], 'bracer', 'sleeve'] },
      { src: 'assets/vampire_big.webp', rows: ['chest', 'off', 'main', 'cape'], anchors: { cape: 'top' }, grow: { main: 1.5, off: 1.3 } }
    ],
    faceInHead: true,
    items: [['head', 'Kapüşon'], ['chest', 'Yelek'], ['sleeve', 'Kadife kol'], ['bracer', 'Manşet'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Meç'], ['off', 'Hançer'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 118, px: .5,  py: .62, s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 42,  px: .5,  py: .5,  s: 0 },
      bracer: { h: 40,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 165, px: .5,  py: .82, s: 180 },
      off:    { h: 80,  px: .5,  py: .8,  s: 180 },
      cape:   { h: 205, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: -6, laS: 50, main: 30, uaK: 22, laK: 46, off: 110 },
    attackLabel: 'Saplama', glow: '#ff2a3d', offFollow: true
  },
  // Elf okçu: pembe arka planlı sheet; sol elde aynalanmış uzun yay, sağ elde ok (açısı hedefe göre, koldan bağımsız)
  elf: {
    name: 'Elf', set: 'assets/elf_common_set.webp', rows: 3, bg: 'magenta',
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // güneş sarayı okçusu, motif merdiveni (yaprak 4-5, çelenk 6-7, güneş 8-10). İki sayfa (pembe zemin).
    tierSheet: [
      // 10x10 ızgara (yapay zekâ satır başına 9 çizdi; 10. seviye geçici olarak 9'un parlak kopyası)
      { src: 'assets/elf_grid1.webp', per: 9, rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', ['shaft', 'foot'], 'main', 'off'], grow: { off: 1.3, main: 1.2 } },
      // tunik ve pelerin: 5'li iki satırda
      { src: 'assets/elf_grid2.webp', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .6 } }
    ],
    faceInHead: true,
    items: [['head', 'Kapüşon'], ['chest', 'Tunik'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Bileklik'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Ok'], ['off', 'Yay'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 118, px: .5,  py: .62, s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 110, px: .5,  py: .93, s: 180 },
      off:    { h: 175, px: .62, py: .5,  s: 180 }, // tutuş: deri sargı
      cape:   { h: 190, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: -8, laS: 30, main: 60, uaK: 26, laK: 30, offTilt: 12 },
    attackLabel: 'Ok at', glow: '#8ad06a', mainAbs: true
  },
  // Support şifacı: sağ elde topuz, sol elin önünde süzülen kutsal kitap
  support: {
    name: 'Support', set: 'assets/support_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // simyacı hekim (pirinç + turkuaz). 1. sayfa satır başına 9 (10. seviye tamamlanır); 2. sayfa 5'li bantlar.
    tierSheet: [
      { src: 'assets/support_grid1.webp', per: 9, rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', ['shaft', 'foot'], 'main'], grow: { main: 1.3 } },
      { src: 'assets/support_grid2.webp', per: 5, rows: ['chest', 'chest', 'off', 'off', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .6 } }
    ],
    faceInHead: true,
    items: [['head', 'Gözlüklü başlık'], ['chest', 'Önlük'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Diz sargısı'], ['boot', 'Bot'], ['main', 'Havan eli'], ['off', 'Reçete kitabı'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .62, s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 120, px: .5,  py: .8,  s: 180 },
      off:    { h: 62,  px: .5,  py: .5,  s: 180 },
      cape:   { h: 190, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .78,
    base: { uaS: -14, laS: 34, main: 40, uaK: 30, laK: 54 },
    attackLabel: 'Topuz', glow: '#ffd27a', floatOff: true
  },
  // Assassin: iki elde hançer (sol hançer ön kolla döner); kapüşonda maske, gözler dar yarıkta
  assassin: {
    name: 'Assassin', set: 'assets/assassin_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // çöl haşhaşisi (bakır, bronz, zehir yeşili; pembe zemin). 1. sayfa satır başına 9 (10. seviye tamamlanır);
    // iki elde aynı hançer.
    tierSheet: [
      { src: 'assets/assassin_grid1.webp', bg: 'magenta', per: 9, rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', ['shaft', 'foot'], 'main'], grow: { main: 1.25 }, same: { off: 'main' } },
      { src: 'assets/assassin_grid2.webp', bg: 'magenta', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .6 } }
    ],
    faceInHead: true,
    items: [['head', 'Peçeli başlık'], ['chest', 'Yelek'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Bileklik'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Hançer'], ['off', 'Hançer 2'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .62, s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 100, px: .5,  py: .82, s: 180 },
      off:    { h: 100, px: .5,  py: .82, s: 180 },
      cape:   { h: 190, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .9,
    base: { uaS: 0, laS: 50, main: 60, uaK: 24, laK: 40, off: 100 },
    attackLabel: 'Çift saplama', glow: '#3ab0a8', offFollow: true
  },
  // Ranger avcı: sağ elde uzun mızrak, sol elde ayı kapanı (fırlatılır)
  ranger: {
    name: 'Ranger', set: 'assets/ranger_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // kar dağı avcısı (kürk, kemik, buz; altın yok). 1. sayfa satır başına 8 (9-10. seviye tamamlanır);
    // mızrak resimde kısa ve kalın: boyuna uzatılır.
    tierSheet: [
      { src: 'assets/ranger_grid1.webp', per: 8, rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', ['shaft', 'foot'], 'off', 'main'], grow: { main: 1.3 }, stretch: { main: 1.6 } },
      { src: 'assets/ranger_grid2.webp', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .6 } }
    ],
    faceInHead: true,
    items: [['head', 'Kurt postu'], ['chest', 'Ceket'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Bileklik'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Mızrak'], ['off', 'Kapan'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 118, px: .5,  py: .62, s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 40,  px: .3,  py: .3,  s: 0 },
      main:   { h: 200, px: .5,  py: .62, s: 180 },
      off:    { h: 40,  px: .12, py: .75, s: 180 }, // kapan zincirinin ucundan tutulur
      cape:   { h: 190, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .82,
    base: { uaS: -10, laS: 18, main: 166, uaK: 14, laK: 24 },
    attackLabel: 'Mızrak', glow: '#ff8a3d'
  },
  // Paladin: sağ elde savaş çekici, sol elde yuvarlak güneş kalkanı; gözler T vizörün yatay yarığında
  paladin: {
    name: 'Paladin', set: 'assets/paladin_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // mermer tapınak muhafızı (taş, mermer, gümüş, gök mavisi; altın yok). Üç sayfa: küçük eşyalar + çekiç,
    // konç ve ayak ayrı satırlarda (bilek topu yok), göğüs + yuvarlak kalkan + pelerin.
    tierSheet: [
      { src: 'assets/paladin_grid1.webp', rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', ['_shaft', '_foot'], 'main'], grow: { main: 1.3 } },
      { src: 'assets/paladin_boots.webp', rows: ['shaft', 'foot'] },
      { src: 'assets/paladin_grid2.webp', per: 5, rows: ['chest', 'chest', 'off', 'off', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .8 } }
    ],
    holes: { armS: [.2, .27], armK: [.83, .25] }, // taş dokusu otomatik kol deliği bulmayı şaşırtıyor
    faceInHead: true,
    items: [['head', 'Tapınak miğferi'], ['chest', 'Göğüslük'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Bileklik'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Çekiç'], ['off', 'Kalkan'], ['cape', 'Pelerin']],
    fit: {
      // kapalı kova miğfer: gözler T vizörün yatay yarığında (x .5–.85, y .35–.45)
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 150, px: .5,  py: .82, s: 180 },
      off:    { h: 100, px: .5,  py: .5,  s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .8,
    base: { uaS: -16, laS: 36, main: 40, uaK: 20, laK: 64 },
    attackLabel: 'Çekiç', glow: '#ffd27a'
  },
  // Berserker: sağ elde büyük savaş baltası (ağzı rakibe dönsün diye aynalı), sol elde el baltası
  berserker: {
    name: 'Berserker', set: 'assets/berserker_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // volkan savaşçısı (kül, obsidyen, lav; altın yok). Balta satırları 3 çizildi: orta satır atlanır.
    // 2. sayfada ikinci bant geri gidiyor: seviyeler lav miktarına göre yeniden sıralanır.
    tierSheet: [
      { src: 'assets/berserker_grid1.webp', rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', 'shaft', 'foot', 'main', '_axe2', 'off'], grow: { main: 1.3, off: 1.2 } },
      { src: 'assets/berserker_grid2.webp', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .75 },
        order: { chest: [0, 1, 2, 5, 6, 3, 7, 4, 8, 9], cape: [0, 1, 2, 3, 5, 4, 6, 7, 8, 9] } }
    ],
    holes: { armS: [.18, .26], armK: [.82, .25] }, // otomatik kol deliği bulma deliğin altındaki gölgeyi seçiyor
    faceInHead: true,
    items: [['head', 'Miğfer'], ['chest', 'Koşum zırhı'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Savaş baltası'], ['off', 'El baltası'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 130, px: .5,  py: .82, s: 180 },
      off:    { h: 90,  px: .5,  py: .82, s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: -14, laS: 34, main: 50, uaK: 18, laK: 46, off: 96 },
    attackLabel: 'Yarma', glow: '#ff3a2a', offFollow: true
  },
  // Druid: pembe arka planlı sheet; asa gövdenin yanında dik, sol elin önünde süzülen totem
  druid: {
    name: 'Druid', set: 'assets/druid_common_set.webp', rows: 3, bg: 'magenta',
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // mantar ve yosun bilgesi (pembe zemin; altın ve yaprak yok). Konç satırı iki kez çizildi, ikincisi atlanır.
    // 2. sayfada ikinci bantlar geri gidiyor: seviyeler mantar miktarına göre yeniden sıralanır.
    tierSheet: [
      { src: 'assets/druid_grid1.webp', bg: 'magenta-soft', rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', 'shaft', '_shaft2', 'foot', 'off', 'main'], grow: { main: 1.3 },
        // yapay zekâ seviyeleri karışık çizdi; görünüşe göre sıralandı
        order: { head: [2,0,1,3,5,4,6,7,8,9], sleeve: [0,1,2,5,3,4,6,7,8,9], bracer: [0,1,2,5,3,4,6,7,8,9], glove: [0,1,2,5,3,4,6,7,8,9], knee: [0,1,2,5,3,4,6,7,8,9], shaft: [0,1,2,5,3,4,6,7,8,9], foot: [0,1,2,5,3,4,6,7,8,9], off: [0,1,2,5,3,4,6,7,8,9], main: [0,1,2,5,3,4,6,7,8,9] } },
      { src: 'assets/druid_grid2.webp', bg: 'magenta-soft', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .85 },
        order: { chest: [0, 1, 2, 5, 3, 6, 4, 7, 8, 9], cape: [0, 1, 2, 5, 6, 3, 7, 8, 4, 9] } }
    ],
    holes: { armS: [.16, .25], armK: [.84, .24] },
    faceInHead: true,
    items: [['head', 'Yosunlu kapüşon'], ['chest', 'Kabuk cüppe'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Asa'], ['off', 'Totem'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 175, px: .5,  py: .62, s: 180 },
      off:    { h: 60,  px: .5,  py: .5,  s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: -10, laS: 16, main: 170, uaK: 30, laK: 54 },
    attackLabel: 'Sarmaşık', glow: '#8ad04a', floatOff: true, healColor: '#9be36a'
  },
  // Necromancer: pembe arka planlı sheet; kafatası asa, tutacağından sallanan kafatası fener
  necromancer: {
    name: 'Necromancer', set: 'assets/necromancer_common_set.webp', rows: 3, bg: 'magenta',
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // kemik lordu (yeşil zemin; altın, yeşil, mor yok). 1. sayfa satır başına 9 çizildi (10. seviye tamamlanır);
    // bot o sayfada tek parça çizildiği için ayrı sayfadan gelir, 1. sayfanın konç/bot/fazla satırları atlanır.
    tierSheet: [
      { src: 'assets/necromancer_grid1.webp', bg: 'green', per: 9, rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', '_shaft', '_boot', '_extra', 'off', 'main'], grow: { main: 1.3 } },
      { src: 'assets/necromancer_boots.webp', bg: 'green', rows: ['shaft', 'foot'] },
      { src: 'assets/necromancer_grid2.webp', bg: 'green', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .85 },
        order: { chest: [0, 1, 2, 3, 5, 4, 6, 7, 8, 9] } }
    ],
    faceInHead: true,
    items: [['head', 'Kemik kapüşon'], ['chest', 'Kemik cüppe'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Kafatası asa'], ['off', 'Kemik fener'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 175, px: .5,  py: .6,  s: 180 },
      off:    { h: 56,  px: .5,  py: .03, s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: -10, laS: 16, main: 170, uaK: 20, laK: 30 },
    attackLabel: 'Ruh oku', glow: '#7dff8a', castBolt: true, tipIdle: .15, lantern: true, healColor: '#7dff8a'
  },
  // Monk: başta hasır şapka (yüz açık, kafa görünür), sağ elde bo sopası, sol elden sarkan tespih, pelerin yerine kuşak
  monk: {
    name: 'Monk', set: 'assets/monk_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // safran dağ tapınağı (yeşil zemin; altın yalnız 9-10'da küçük vurgu). Bot iki parça, bo sopası iki satır boyunda.
    // sıra küçük eşyaların merdivenine göre: 5 ahşap, 6 demir grisi, 7 kırmızı, 8-9 dua çarkı, 10 altın vurgu.
    tierSheet: [
      { src: 'assets/monk_grid1.webp', bg: 'green', rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', 'shaft', 'foot', 'off', 'main'], grow: { main: 1.15 },
        order: { head: [0, 3, 4, 1, 2, 5, 6, 7, 8, 9] } },
      { src: 'assets/monk_grid2.webp', bg: 'green', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .85 },
        order: { chest: [0, 1, 2, 3, 4, 7, 5, 6, 8, 9] } }
    ],
    faceInHead: true,
    items: [['head', 'Hasır şapka'], ['chest', 'Safran cüppe'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'El sargısı'], ['knee', 'Dizlik'], ['boot', 'Sandalet'], ['main', 'Bo sopası'], ['off', 'Tespih'], ['cape', 'Atkı']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 190, px: .5,  py: .55, s: 180 },
      off:    { h: 58,  px: .5,  py: .03, s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: -10, laS: 16, main: 170, uaK: 20, laK: 40 },
    attackLabel: 'Sopa dalgası', glow: '#ffb35a', hang: true,
    // şapka geometrisi (kafa ekseninde): bant çizgisi, kenar elipsinin merkezi ve yarıçapları
    hat: { ring: -19, lipY: -12, rx: 60, ry: 8 }
  },
  // Inquisitor: geniş kenarlı avcı şapkası (3 katmanlı), sağ elde arbalet (hep hedefe bakar), sol elde gümüş uçlu kazık
  inquisitor: {
    name: 'Inquisitor', set: 'assets/inquisitor_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // parşömen ve mühür yargıcı (yeşil zemin; altın, gümüş, şişe yok). Bot iki parça, arbalet iki satır boyunda.
    tierSheet: [
      { src: 'assets/inquisitor_grid1.webp', bg: 'green', rows: ['head', 'sleeve', 'bracer', 'glove', 'knee', 'shaft', 'foot', 'off', 'main'], grow: { main: 1.2 },
        order: { glove: [0, 1, 2, 4, 3, 5, 6, 7, 8, 9] } },
      { src: 'assets/inquisitor_grid2.webp', bg: 'green', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .75 } }
    ],
    faceInHead: true,
    items: [['head', 'Yargıç şapkası'], ['chest', 'Yargıç ceketi'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Arbalet'], ['off', 'Kazık'], ['cape', 'Pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 125, px: .5,  py: .7,  s: 180 },
      off:    { h: 62,  px: .5,  py: .6,  s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .85,
    base: { uaS: 30, laS: 40, main: 70, uaK: 20, laK: 50, off: 100 },
    attackLabel: 'Arbalet', glow: '#ffd9a0', mainAbs: true, offFollow: true,
    hat: { ring: -12, lipY: -7, rx: 54, ry: 7 }
  },
  // Shadow: iki elde küçük orak (sol orak ön kolla döner)
  shadow: {
    name: 'Shadow', set: 'assets/shadow_common_set.webp', rows: 3,
    order: ['head', 'chest', 'bracer', 'knee', 'shaft', 'foot', 'main', 'off', 'cape'],
    // kuzgun gölgesi (yeşil zemin; mor, altın, kırmızı yok). Küçük eşyalar iki sayfada, satır başına tek eşya;
    // iki elde aynı orak.
    tierSheet: [
      { src: 'assets/shadow_grid1a.webp', bg: 'green', rows: ['head', 'sleeve', 'bracer', 'glove'] },
      { src: 'assets/shadow_grid1b.webp', bg: 'green', rows: ['knee', 'shaft', 'foot', 'main'], same: { off: 'main' } },
      { src: 'assets/shadow_grid2.webp', bg: 'green', per: 5, rows: ['chest', 'chest', 'cape', 'cape'], anchors: { cape: 'top' }, narrow: { cape: .85 },
        order: { chest: [0, 1, 2, 3, 5, 6, 4, 7, 8, 9] } }
    ],
    faceInHead: true,
    items: [['head', 'Kuzgun kapüşonu'], ['chest', 'Tüylü yelek'], ['sleeve', 'Kol kılıfı'], ['bracer', 'Kolluk'], ['glove', 'Eldiven'], ['knee', 'Dizlik'], ['boot', 'Bot'], ['main', 'Pençe orak'], ['off', 'Pençe orak 2'], ['cape', 'Tüy pelerin']],
    fit: {
      head:   { h: 112, px: .5,  py: .6,  s: 180 },
      chest:  { h: 145, px: .45, py: .1,  s: 180 },
      sleeve: { h: 54,  px: .5,  py: .55, s: 0 },
      bracer: { h: 42,  px: .5,  py: .5,  s: 0 },
      glove:  { h: 30,  px: .5,  py: .62, s: 0 },
      knee:   { h: 46,  px: .5,  py: .42, s: 0 },
      shaft:  { h: 54,  px: .5,  py: .55, s: 0 },
      foot:   { h: 36,  px: .3,  py: .25, s: 0 },
      main:   { h: 90,  px: .35, py: .8,  s: 180 },
      off:    { h: 90,  px: .35, py: .8,  s: 180 },
      cape:   { h: 195, px: .5,  py: .07, s: 180 }
    },
    chest: { neck: [.45, .1], armS: [.13, .3], armK: [.88, .28] },
    capeTint: .95,
    base: { uaS: 0, laS: 50, main: 60, uaK: 24, laK: 40, off: 100 },
    attackLabel: 'Gölge kesiği', glow: '#9fb6d6', offFollow: true
  }
};

/* Ortak iskelet ölçüleri (oyun ve atölye ikisi de buradan okur).
   Uzun boylu, uzun bacaklı, ince gövdeli iskelet. Eski ölçülere göre ayarlanmış fit değerleri
   PART_SCALE ile yeni iskelete uyarlanır: y = boy (uzunluk), x = en. */
window.RIG_BODY = {
  L: { thigh: 58, shin: 58, torso: 88, ua: 38, la: 35, headR: 29, sole: 9, arm: 13, leg: 14 },
  torso: { left: -33, right: 16 },  // siyah gövde (eskisi -42..21)
  hips: [1, -17],                   // ön ve arka kalça (eskisi 3, -23)
  capeW: 1.35,                      // pelerin eni = göğüs zırhının eni x bu oran
  capeMaxH: 180                     // pelerin boyu en çok (yere sürünmesin)
};
const PART_SCALE = {
  chest:  { y: 1.07, x: .8 },
  sleeve: { y: 1.1,  x: .92 },
  bracer: { y: 1.1,  x: .95 },
  knee:   { y: 1.05, x: 1 },
  shaft:  { y: 1.26, x: 1 },
  cape:   { y: 1.18, x: .85 },
  main:   { y: 1.1,  x: 1.1 },
  off:    { y: 1.05, x: 1.05 }
};
for (const C of Object.values(window.RIG_CLASSES)) for (const [p, s] of Object.entries(PART_SCALE)) {
  const f = C.fit && C.fit[p]; if (!f) continue;
  f.h = Math.round(f.h * s.y); f.sx = +(((f.sx || 1) * s.x / s.y).toFixed(3));
}

window.rigAnims = function (id) {
  const common = {
    idle: { label: 'Bekle', loop: true, dur: 2400 },
    walk: { label: 'Yürü', loop: true, dur: 900 },
    hit:  { label: 'Hasar al', dur: 600, flash: true, keys: [[0, {}], [.16, { x: -24, lean: -14, head: -14, uaS: -6, laS: 60, uaK: 0, crouch: 10 }], [1, {}]] }
  };
  const DEAD = { rot: -90, x: -10, lean: -6, head: -10, uaS: 150, laS: 10, uaK: 165, laK: 5, footF: 18, footB: -8, crouch: 0 };
  if (id === 'mage') {
    const CAST = { uaS: 86, laS: 4, main: 70, lean: 10, x: 10, crouch: 10, uaK: 64, laK: 22, footF: 40, footB: -30 };
    const WARD = { uaK: 74, laK: 8, offTilt: 0, lean: 6, crouch: 12, uaS: 30, laS: 60, main: 85, footF: 30, footB: -34 };
    return { ...common,
      attack: { label: 'Büyü', dur: 1000, cast: .5, keys: [[0, {}], [.32, { uaS: 40, laS: 70, main: 70, lean: -6, crouch: 6, uaK: 40, laK: 40 }], [.5, CAST], [.78, CAST], [1, {}]] },
      block:  { label: 'Büyü kalkanı', dur: 1300, ward: true, keys: [[0, {}], [.2, WARD], [.8, WARD], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 90 }], [1, { ...DEAD, main: 90 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { uaS: 168, laS: 4, main: 8, lean: -4, head: -10, lift: 10 }], [1, { uaS: 168, laS: 4, main: 8, lean: -4, head: -10 }]] }
    };
  }
  if (id === 'warrior') {
    // çift darbe: önce kılıç, hemen ardından balta
    const SWORD = { uaS: 100, laS: 2, main: -6, lean: 14, x: 40, crouch: 14, footF: 52, footB: -30, uaK: 10, laK: 40, off: 100 };
    const AXE_UP = { ...SWORD, uaS: 70, laS: 20, main: 10, uaK: -140, laK: -20, off: 70, lean: 4, x: 34 };
    const AXE = { uaS: 40, laS: 40, main: 30, uaK: 100, laK: 4, off: -10, lean: 18, x: 54, crouch: 16, footF: 58, footB: -28 };
    const GUARD = { uaS: 50, laS: 50, main: 60, uaK: 46, laK: 54, off: 64, lean: 8, crouch: 16, footF: 34, footB: -34, head: 4 };
    const WIN = { uaS: 168, laS: 4, main: 4, uaK: 160, laK: 6, off: 10, lean: -4, head: -10, footF: 22, footB: -22, crouch: 0 };
    return { ...common,
      attack: { label: 'Çift darbe', dur: 1150, keys: [[0, {}], [.2, { uaS: -150, laS: -22, main: 62, lean: -6, x: -8, crouch: 8 }], [.36, SWORD], [.52, AXE_UP], [.68, AXE], [.82, AXE], [1, {}]] },
      block:  { label: 'Çapraz savunma', dur: 1100, keys: [[0, {}], [.22, GUARD], [.75, GUARD], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20, off: 20 }], [1, { ...DEAD, main: 20, off: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'shadow') {
    // gölge kesiği: dumana dönüşüp kaybolur, rakibin önünde belirip iki orakla çapraz keser; gölgeye karış: yarı saydam olur
    const VANISH = { x: 10, crouch: 24, lean: 10, uaS: -10, laS: 80, main: 90, uaK: -10, laK: 80, off: 110, footF: 30, footB: -30 };
    const CROSS1 = { x: 70, lean: 24, crouch: 22, uaS: 100, laS: 10, main: -20, uaK: 40, laK: 60, off: 100, footF: 62, footB: -34, head: 6 };
    const CROSS2 = { ...CROSS1, uaS: 40, laS: 70, main: 60, uaK: 100, laK: 6, off: -20 };
    const MELD = { crouch: 26, lean: 12, x: -20, uaS: 10, laS: 90, main: 80, uaK: 10, laK: 90, off: 110, footF: 24, footB: -40, head: 4 };
    const WIN = { uaS: 120, laS: 60, main: 30, uaK: 120, laK: 60, off: 30, lean: -4, head: -8, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Gölge kesiği', dur: 1100, ghostIn: .45, keys: [[0, {}], [.3, VANISH], [.5, CROSS1], [.62, CROSS1], [.74, CROSS2], [.86, CROSS2], [1, {}]] },
      block:  { label: 'Gölgeye karış', dur: 1200, ghost: true, keys: [[0, {}], [.3, MELD], [.7, MELD], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20, off: 20 }], [1, { ...DEAD, main: 20, off: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.5, WIN], [1, WIN]] }
    };
  }
  if (id === 'inquisitor') {
    // arbaleti kaldırıp nişan alır ve atar (geri tepme); kazıkla saplama yeteneği
    const AIM = { uaS: 86, laS: 4, main: 90, lean: -2, head: 4, crouch: 10, footF: 30, footB: -36, uaK: 30, laK: 60, off: 90 };
    const KICK = { ...AIM, uaS: 70, laS: 20, main: 100, lean: -8, x: -8 };
    const STAKE = { uaK: 90, laK: 2, off: 0, lean: 20, x: 44, crouch: 20, footF: 60, footB: -30, uaS: 20, laS: 50, main: 60 };
    const WIN = { uaS: 150, laS: 20, main: 170, uaK: 20, laK: 50, off: 100, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Arbalet', dur: 1000, shoot: .55, keys: [[0, {}], [.3, AIM], [.55, AIM], [.62, KICK], [.8, KICK], [1, {}]] },
      block:  { label: 'Kazık', dur: 900, keys: [[0, {}], [.3, { ...STAKE, uaK: -40, laK: 60, off: 120, x: 0, lean: -6 }], [.5, STAKE], [.7, STAKE], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 120, off: 20 }], [1, { ...DEAD, main: 120, off: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'monk') {
    // sopa dalgası: geri çekip yatay süpürme, ardından düz itme; odak: çömelip yoğunlaşır, altın halka
    const COIL = { uaS: -30, laS: 100, main: 100, lean: -10, x: -10, crouch: 22, footF: 14, footB: -40, uaK: 60, laK: 40 };
    const SWEEP = { uaS: 90, laS: 0, main: 90, lean: 16, x: 40, crouch: 20, footF: 58, footB: -30, uaK: 30, laK: 60 };
    const PUSH = { ...SWEEP, main: 0, uaS: 96, x: 56, lean: 22 };
    const FOCUS = { crouch: 26, lean: 4, head: 6, uaS: 40, laS: 90, main: 130, uaK: 40, laK: 100, footF: 34, footB: -34 };
    const WIN = { uaS: 170, laS: 4, main: 0, uaK: 40, laK: 100, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Sopa dalgası', dur: 1000, keys: [[0, {}], [.28, COIL], [.46, SWEEP], [.62, PUSH], [.78, PUSH], [1, {}]] },
      block:  { label: 'Odak', dur: 1400, ward: true, keys: [[0, {}], [.25, FOCUS], [.8, FOCUS], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 90 }], [1, { ...DEAD, main: 90 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'necromancer') {
    // ruh oku (asa ucundan yeşil mermi) ve can emme (fener kalkar, yeşil parçacıklar akar)
    const CAST = { uaS: 86, laS: 4, main: 70, lean: 10, x: 10, crouch: 10, uaK: 30, laK: 30, footF: 40, footB: -30 };
    const DRAIN = { uaK: 100, laK: 10, uaS: -10, laS: 16, main: 170, lean: -8, head: -8, crouch: 8, footF: 24, footB: -26 };
    const WIN = { uaS: 160, laS: 10, main: 10, uaK: 100, laK: 10, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Ruh oku', dur: 1000, cast: .5, keys: [[0, {}], [.32, { uaS: 40, laS: 70, main: 70, lean: -6, crouch: 6 }], [.5, CAST], [.78, CAST], [1, {}]] },
      block:  { label: 'Can emme', dur: 1500, ward: true, heal: true, keys: [[0, {}], [.25, DRAIN], [.8, DRAIN], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 90 }], [1, { ...DEAD, main: 90 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'druid') {
    // asayı yere vurur, önünde yerden sarmaşık/diken fışkırır; şifa: totem yükselir, yeşil yapraklar döner
    const RAISE = { uaS: 40, laS: 70, main: 70, lean: -8, crouch: 6, uaK: 40, laK: 40, head: -6 };
    const SLAM = { uaS: 70, laS: 10, main: 110, lean: 16, x: 10, crouch: 20, uaK: 60, laK: 20, footF: 40, footB: -32, head: 6 };
    const BLOOM = { uaK: 120, laK: 10, uaS: -10, laS: 16, main: 170, lean: -6, head: -10, crouch: 6, lift: 4, footF: 20, footB: -22 };
    const WIN = { uaS: 160, laS: 10, main: 10, uaK: 120, laK: 10, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Sarmaşık', dur: 1100, vines: .5, keys: [[0, {}], [.32, RAISE], [.5, SLAM], [.78, SLAM], [1, {}]] },
      block:  { label: 'Doğanın şifası', dur: 1500, ward: true, heal: true, keys: [[0, {}], [.25, BLOOM], [.8, BLOOM], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 90 }], [1, { ...DEAD, main: 90 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'berserker') {
    // dev baltayla yukarıdan yarma + el baltasıyla yatay savuruş; öfke: öne eğilip bağırır, kırmızı parlama
    const RAISE = { uaS: -170, laS: -6, main: 20, uaK: 30, laK: 40, off: 90, lean: -14, x: -10, crouch: 8, head: -10, footF: 20, footB: -36 };
    const CLEAVE = { uaS: 112, laS: 8, main: -30, uaK: 10, laK: 50, off: 100, lean: 26, x: 46, crouch: 26, footF: 60, footB: -30, head: 8 };
    const SWIPE = { ...CLEAVE, uaS: 60, laS: 30, main: 10, uaK: 96, laK: 0, off: -4, lean: 18, x: 54 };
    const RAGE = { lean: 22, head: -14, crouch: 26, uaS: -40, laS: 90, main: 80, uaK: -30, laK: 90, off: 80, footF: 36, footB: -40 };
    const WIN = { uaS: 170, laS: 4, main: 0, uaK: 160, laK: 6, off: 10, lean: -6, head: -14, footF: 24, footB: -24, crouch: 0 };
    return { ...common,
      attack: { label: 'Yarma', dur: 1200, keys: [[0, {}], [.32, RAISE], [.48, CLEAVE], [.62, CLEAVE], [.76, SWIPE], [.86, SWIPE], [1, {}]] },
      block:  { label: 'Öfke', dur: 1300, ward: true, keys: [[0, {}], [.25, RAGE], [.8, RAGE], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20, off: 20 }], [1, { ...DEAD, main: 20, off: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'paladin') {
    // yukarıdan aşağı ağır çekiç darbesi ve kutsal kalkan (kalkan öne, altın halka)
    const RAISE = { uaS: -170, laS: -6, main: 10, uaK: 40, laK: 40, lean: -12, x: -10, crouch: 6, head: -8, footF: 20, footB: -34 };
    const SMASH = { uaS: 110, laS: 10, main: -40, uaK: 20, laK: 60, lean: 24, x: 44, crouch: 24, footF: 58, footB: -30, head: 8 };
    const HOLY = { uaK: 66, laK: 22, offTilt: -4, lean: 8, crouch: 16, head: 2, uaS: -10, laS: 50, main: 30, footF: 32, footB: -34 };
    const WIN = { uaS: 172, laS: 2, main: 0, uaK: 22, laK: 62, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Çekiç', dur: 1050, keys: [[0, {}], [.4, RAISE], [.56, SMASH], [.76, SMASH], [1, {}]] },
      block:  { label: 'Kutsal kalkan', dur: 1300, ward: true, keys: [[0, {}], [.22, HOLY], [.8, HOLY], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20 }], [1, { ...DEAD, main: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'ranger') {
    // uzun mızrak saplaması (yarı mesafeden) ve kapan fırlatma
    const AIM = { uaS: 20, laS: 70, main: 0, uaK: 40, laK: 40, lean: -8, x: -14, crouch: 16, footF: 20, footB: -40 };
    const THRUST = { uaS: 92, laS: 2, main: -2, uaK: 20, laK: 40, lean: 18, x: 36, crouch: 18, footF: 60, footB: -34, head: 4 };
    const WIND = { uaK: -150, laK: -10, uaS: -10, laS: 18, main: 166, lean: -8, crouch: 10, footF: 22, footB: -36 };
    const TOSS = { uaK: 110, laK: 4, uaS: -10, laS: 18, main: 166, lean: 14, x: 10, crouch: 12, footF: 40, footB: -30 };
    const WIN = { uaS: 150, laS: 20, main: 10, uaK: 14, laK: 24, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Mızrak', dur: 950, keys: [[0, {}], [.32, AIM], [.5, THRUST], [.68, THRUST], [1, {}]] },
      block:  { label: 'Kapan at', dur: 1100, release: .5, proj: 'off', hideOff: [.5, .95], keys: [[0, {}], [.32, WIND], [.5, TOSS], [.7, TOSS], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 90 }], [1, { ...DEAD, main: 90 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'assassin') {
    // hızlı çift saplama ve gölge adımı (yarı saydam olup geri kayar)
    const STAB1 = { uaS: 86, laS: 4, main: -2, uaK: 10, laK: 60, off: 90, lean: 22, x: 60, crouch: 22, footF: 64, footB: -36, head: 6 };
    const STAB2 = { ...STAB1, uaS: 30, laS: 60, main: 40, uaK: 88, laK: 4, off: -2, x: 70 };
    const STEP = { x: -60, lean: -10, crouch: 24, uaS: 20, laS: 70, main: 60, uaK: 10, laK: 70, off: 100, footF: 10, footB: -50 };
    const WIN = { uaS: 120, laS: 60, main: 30, uaK: -20, laK: 30, off: 150, lean: -2, head: -6, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Çift saplama', dur: 900, keys: [[0, {}], [.2, { uaS: -20, laS: 110, main: 70, lean: -6, x: -10, crouch: 18 }], [.36, STAB1], [.5, STAB1], [.62, STAB2], [.76, STAB2], [1, {}]] },
      block:  { label: 'Gölge adımı', dur: 1000, ghost: true, keys: [[0, {}], [.3, STEP], [.7, STEP], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20, off: 20 }], [1, { ...DEAD, main: 20, off: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.5, WIN], [1, WIN]] }
    };
  }
  if (id === 'support') {
    // topuz vuruşu ve iyileştirme (kitap havaya kalkar, ışık halkası)
    const SMITE = { uaS: 100, laS: 2, main: -10, lean: 14, x: 40, crouch: 14, footF: 52, footB: -30, uaK: 20, laK: 50 };
    const PRAY = { uaK: 120, laK: 10, uaS: 60, laS: 70, main: 60, lean: -6, head: -8, crouch: 6, lift: 4, footF: 20, footB: -22 };
    const WIN = { uaS: 170, laS: 4, main: 0, uaK: 120, laK: 10, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Topuz', dur: 850, keys: [[0, {}], [.36, { uaS: -150, laS: -20, main: 62, lean: -8, x: -10, crouch: 8 }], [.52, SMITE], [.7, { ...SMITE, uaS: 88, main: 0 }], [1, {}]] },
      block:  { label: 'İyileştir', dur: 1500, ward: true, heal: true, keys: [[0, {}], [.25, PRAY], [.8, PRAY], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20 }], [1, { ...DEAD, main: 20 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'elf') {
    // ok atma: yay kalkar, ok yerleşir, kiriş geri çekilir, bırakılır
    const NOCK = { uaK: 86, laK: 4, offTilt: 0, uaS: 88, laS: 2, main: 90, lean: -2, crouch: 8, footF: 34, footB: -36 };
    const DRAW = { ...NOCK, uaS: 40, laS: 120, head: 3, lean: -4 };
    const LOOSE = { ...DRAW, uaS: 24, laS: 104, lean: -6 };
    const EVADE = { lean: -16, x: -26, crouch: 22, uaK: 60, laK: 30, offTilt: 20, uaS: 20, laS: 60, main: 40, footF: 10, footB: -46, head: -8 };
    const WIN = { uaK: 168, laK: 4, offTilt: 0, uaS: -10, laS: 30, main: 60, lean: -4, head: -10, footF: 18, footB: -20, crouch: 0 };
    return { ...common,
      attack: { label: 'Ok at', dur: 1300, release: .56, proj: 'main', hideMain: [.56, .9],
        keys: [[0, {}], [.22, NOCK], [.48, DRAW], [.56, DRAW], [.66, LOOSE], [.86, LOOSE], [1, {}]] },
      block:  { label: 'Kaçın', dur: 900, keys: [[0, {}], [.25, EVADE], [.7, EVADE], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 120 }], [1, { ...DEAD, main: 120 }]] },
      win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
    };
  }
  if (id === 'vampire') {
    // hızlı saplama (meç) + hançerle geri kesiş
    const THRUST = { uaS: 88, laS: 2, main: 0, lean: 20, x: 62, crouch: 18, footF: 66, footB: -34, uaK: -10, laK: 30, off: 120, head: 6 };
    const SLASH_UP = { ...THRUST, uaS: 40, laS: 40, main: 40, uaK: 120, laK: -30, off: 40, lean: 10, x: 50 };
    const SLASH = { uaS: 20, laS: 50, main: 40, uaK: 40, laK: 40, off: 150, lean: 16, x: 56, crouch: 14, footF: 60, footB: -30 };
    const PARRY = { uaS: 40, laS: 70, main: 50, uaK: 10, laK: 70, off: 100, lean: -4, crouch: 14, footF: 26, footB: -40, head: -4 };
    const SALUTE = { uaS: 60, laS: 100, main: 30, uaK: -10, laK: 20, off: 100, lean: -4, head: -6, footF: 14, footB: -16, crouch: 0 };
    return { ...common,
      attack: { label: 'Saplama', dur: 1000, keys: [[0, {}], [.22, { uaS: -20, laS: 110, main: 70, lean: -10, x: -14, crouch: 16, footF: 10, footB: -40 }], [.36, THRUST], [.52, THRUST], [.64, SLASH_UP], [.78, SLASH], [1, {}]] },
      block:  { label: 'Savuşturma', dur: 1000, keys: [[0, {}], [.2, PARRY], [.75, PARRY], [1, {}]] },
      death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20, off: 20 }], [1, { ...DEAD, main: 20, off: 20 }]] },
      win:    { label: 'Selam', dur: 1100, hold: true, keys: [[0, {}], [.5, SALUTE], [1, SALUTE]] }
    };
  }
  const STRIKE = { uaS: 100, laS: 2, main: -6, lean: 14, x: 46, crouch: 14, footF: 54, footB: -30, uaK: 28, laK: 58 };
  const BLOCK = { uaK: 56, laK: 30, offTilt: -6, lean: 10, head: 4, crouch: 18, footF: 34, footB: -34, uaS: -4, laS: 40, main: 0 };
  const WIN = { uaS: 172, laS: 2, main: 0, lean: -4, head: -10, uaK: 22, laK: 62, footF: 18, footB: -20, crouch: 0 };
  return { ...common,
    attack: { label: 'Saldır', dur: 850, keys: [[0, {}], [.36, { uaS: -150, laS: -22, main: 62, lean: -8, x: -12, crouch: 8, footF: 16, footB: -30 }], [.52, STRIKE], [.7, { ...STRIKE, uaS: 88, main: 2, lean: 10, x: 40 }], [1, {}]] },
    block:  { label: 'Blokla', dur: 1100, keys: [[0, {}], [.22, BLOCK], [.75, BLOCK], [1, {}]] },
    death:  { label: 'Düş', dur: 1400, hold: true, keys: [[0, {}], [.18, { x: -16, lean: -22, head: -16, uaS: 40, uaK: 30 }], [.62, { ...DEAD, main: 20 }], [.78, { ...DEAD, main: 20, lift: 6 }], [1, { ...DEAD, main: 20 }]] },
    win:    { label: 'Zafer', dur: 1100, hold: true, keys: [[0, {}], [.45, { ...WIN, lift: 10 }], [1, WIN]] }
  };
};
})();
