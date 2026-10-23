# Sarı Wave Challange

Tek tuşla kontrol edilen, sarı temalı bir wave hassasiyet oyunu.

- 18 ana bölüm ve deterministik olarak üretilen 2.482 keşif parkuru.
- Biri başlangıçta açık, diğerleri oynayarak kazanılan 12 karakter.
- Özgün elektronik müzikler, XP, ustalık hedefleri ve bölüm araması.
- Normal ve mini wave; hız ve yerçekimi portalları.
- Kontrol noktalarıyla antrenman, yerel kayıt ve ses/ışık ayarları.
- Ana kampanyanın en zor finali: **Sarı Grief**.

## Çalıştırma

Node.js ve npm ile:

```sh
npm ci
npm start
```

Tarayıcıda `http://127.0.0.1:5174` adresini aç. Masaüstü uygulaması için `npm run desktop` kullan.

## Kontroller

Boşluk, yukarı ok veya sol fare tuşuna basılı tutarak yüksel; bırakarak alçal.
`P` / `Esc`: duraklat, `R`: yeniden başlat, `C`: karakter koleksiyonu.

## Doğrulama

```sh
npm run check
npm test
```

## Paketleme

```sh
npm run build:win
npm run build:mac
npm run build:linux
```

Mac paketleme komutunu macOS üzerinde çalıştır. Oluşturulan kurulum dosyaları proje klasörünün bir üstüne kopyalanır.
