# Stickman Arena (çevrimiçi)

Chibi stickman sıra tabanlı RPG. Kasaba, arena ve ilerleme tarayıcıda çalışır; lobi, sohbet ve
düello için `server.js` WebSocket sunucusu kullanılır.

## Klasör

- `public/` — oyunun kendisi (index.html, js dosyaları, görseller, sesler)
- `server.js` — oyunu sunar ve `/ws` adresinde lobi mesajlarını taşır
- `build.js` — oyunu üst klasörden `public/` içine kopyalar (oyunu değiştirince: `node build.js`)
- `render.yaml` — Render ayarları

## Bilgisayarda çalıştırma

```
npm install
npm start
```

Sonra tarayıcıda http://localhost:3000 adresini aç. İki sekme açıp lobide birbirine meydan okuyabilirsin.

## Render'a yükleme

1. GitHub'da yeni bir depo aç ve bu klasörün içeriğini yükle (`node_modules` hariç).
2. Render'da **New → Blueprint** seç ve depoyu bağla. `render.yaml` her şeyi ayarlar.
   (Ya da **New → Web Service**: Runtime Node, Build `npm install`, Start `npm start`.)
3. Yayınlanınca `https://stickman-arena-xxxx.onrender.com` gibi bir adres verir. Bu adresi paylaş.

Ücretsiz planda sunucu 15 dakika boş kalınca uyur, ilk açılış 30–60 sn sürebilir.
Sunucu yeniden başlarken lobidekiler birkaç saniye içinde kendiliğinden tekrar bağlanır.

## Notlar

- Oyuncu kayıtları (altın, ekipman) her oyuncunun kendi tarayıcısında tutulur.
- Düello sonucunu sunucu değil iki tarayıcı ortak zar tohumuyla hesaplar; arkadaşlar arası oyun
  içindir, hile korumalı değildir.
