// Oyun dosyalarını ana klasörden public/ içine kopyalar. Oyunu ana klasörde
// (stickman-arena.html, rig.js ...) değiştirdikten sonra: node build.js
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'public');
fs.rmSync(OUT, { recursive: true, force: true });

let count = 0, bytes = 0;
function copy(rel, to = rel) {
  const dst = path.join(OUT, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(SRC, rel), dst);
  count++; bytes += fs.statSync(dst).size;
}
const list = dir => fs.readdirSync(path.join(SRC, dir)).filter(f => fs.statSync(path.join(SRC, dir, f)).isFile());

// sayfa: claude.ai'nin eklediği iskeleti burada biz ekliyoruz
const page = fs.readFileSync(path.join(SRC, 'stickman-arena.html'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'),
  '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  + '<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}</style></head><body>\n' + page + '\n</body></html>\n');
count++;

for (const f of ['audio.js', 'classes.js', 'rig.js', 'tiers.js']) copy(f);
for (const f of list('assets/atlas')) if (/\.(webp|json)$/.test(f)) copy('assets/atlas/' + f);
// seviyeler atlas'tan gelir; baked içinden yalnızca temel parçalar, portreler ve kasaba binaları
for (const f of list('assets/baked')) if (/\.png$/.test(f) && !/_t\d+\.png$/.test(f)) copy('assets/baked/' + f);
for (const f of ['mage_common_set.webp', 'mage_common_cape.webp', 'tank_common_set.webp', 'tank_common_cape.webp']) copy('assets/' + f);
for (const f of list('assets/sfx')) if (/\.mp3$/.test(f)) copy('assets/sfx/' + f);
for (const f of list('assets/sfx/skills')) if (/\.mp3$/.test(f)) copy('assets/sfx/skills/' + f);
for (const f of list('assets/bg')) if (/\.(webp|png)$/.test(f)) copy('assets/bg/' + f);
for (const f of list('assets/npc')) if (/\.(webp|png)$/.test(f)) copy('assets/npc/' + f);

console.log(`public/ hazır: ${count} dosya, ${(bytes / 1048576).toFixed(1)} MB`);
