# 📱 Diet Uygulamasını Telefonunuzda Test Etme Rehberi

## ⚠️ ÖNEMLİ: Bu Bir EXPO Projesidir!

React Native CLI değil, **EXPO** kullanıyoruz. Bu yüzden komutlar farklı!

---

## 🚀 HIZLI BAŞLANGIÇ (Önerilen)

### Adım 1: Gerekli Programlar
```bash
# Node.js yüklü mü kontrol edin
node --version  # v18 veya üzeri olmalı

# Expo CLI yükleyin (global)
npm install -g expo-cli

# Veya npx ile kullanın (yükleme gerektirmez)
```

### Adım 2: Proje Klasörüne Gidin
```bash
cd diet-main/frontend
```

### Adım 3: Bağımlılıkları Yükleyin
```bash
# YARN kullanın (önerilir)
yarn install

# Veya NPM
npm install
```

### Adım 4: Uygulamayı Başlatın
```bash
# Expo sunucusunu başlat
npx expo start

# Veya
yarn start
```

### Adım 5: Telefonunuzda Açın

**Android:**
1. Google Play'den **Expo Go** uygulamasını indirin
2. Bilgisayarınızla aynı WiFi'ye bağlanın
3. Expo Go uygulamasını açın
4. QR kodu tarayın (ekranda görünecek)

**iOS:**
1. App Store'dan **Expo Go** uygulamasını indirin
2. Bilgisayarınızla aynı WiFi'ye bağlanın
3. Kamera uygulamasıyla QR kodu tarayın
4. Expo Go'da aç butonuna tıklayın

---

## ❌ YAPMAYIN (Yanlış Komutlar)

```bash
❌ npx react-native run-android    # Bu çalışmaz!
❌ react-native start               # Bu çalışmaz!
❌ npm run android                  # Bu da çalışmaz!
```

---

## ✅ DOĞRU KOMUTLAR

```bash
✅ npx expo start                   # Sunucuyu başlat
✅ yarn start                       # Sunucuyu başlat
✅ yarn android                     # Android emulator için
✅ expo start --tunnel              # Farklı ağlarda çalışır
```

---

## 🔧 SORUN GİDERME

### Hata 1: "inflight deprecated" vb. uyarılar
**Çözüm:** Bunlar sadece uyarı, sorun değil. Görmezden gelebilirsiniz.

### Hata 2: "@react-native-community/cli" hatası
**Çözüm:** Bu Expo projesi, CLI gerekmez. `npx expo start` kullanın.

### Hata 3: "Metro bundler cannot start"
**Çözüm:**
```bash
# Cache temizleyin
npx expo start -c

# Veya
yarn start --clear
```

### Hata 4: "Couldn't connect to development server"
**Çözüm:**
1. Bilgisayar ve telefon aynı WiFi'de mi kontrol edin
2. Firewall kapalı mı kontrol edin
3. Tunnel mode deneyin: `npx expo start --tunnel`

### Hata 5: "react-native-google-mobile-ads" hatası
**Çözüm:** Zaten mock moda aldık, sorun olmamalı. Ama olursa:
```bash
cd frontend
yarn install
```

---

## 🏗️ BACKEND AYARLARI

Backend'i de çalıştırmanız gerekiyor!

### Backend Başlatma:
```bash
# Yeni terminal açın
cd diet-main/backend

# Python virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyasını ayarla
# MONGO_URL ve EMERGENT_LLM_KEY ekleyin

# Sunucuyu başlat
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend .env Ayarı:
`frontend/.env` dosyasında:
```
EXPO_PUBLIC_BACKEND_URL=http://SIZIN_IP_ADRESINIZ:8001
```

**IP adresinizi öğrenin:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

---

## 📱 TEST ADIMLARI

1. **Backend'i başlatın** (port 8001)
2. **Frontend'i başlatın** (`npx expo start`)
3. **Expo Go** uygulamasıyla QR kodu tarayın
4. Uygulama telefonunuzda açılacak!

---

## 🎯 TEST ETMENİZ GEREKENLER

### 1. Giriş Ekranı
- [ ] Emergent Auth ile giriş yapabiliyor musunuz?

### 2. Ana Ekran (Dashboard)
- [ ] Kalori kartı görünüyor mu?
- [ ] Su kartı görünüyor mu?
- [ ] Adım kartı görünüyor mu?
- [ ] Premium butonu görünüyor mu?

### 3. Premium Butonu
- [ ] Premium butonuna tıkladığınızda modal açılıyor mu?
- [ ] "🎉 ÜCRETSİZ ABONE OL" butonu görünüyor mu?
- [ ] Butona tıkladığınızda premium aktif oluyor mu?

### 4. Reklam İzleme (Mock)
- [ ] Ayarlar → Temalar
- [ ] Kilitli temaya tıkla
- [ ] "Reklam İzle" butonu
- [ ] 2 saniye bekle, ödül geliyor mu?
- [ ] 3 reklam sonrası tema açılıyor mu?

### 5. Pembe Yıldız Teması
- [ ] 3 reklam izleyin
- [ ] Pembe yıldız teması açıldı mı?
- [ ] Temayı aktif edin
- [ ] Uygulama pembe görünüyor mu?

---

## 🆘 HALA SORUN VAR MI?

### Konsol Loglarını Gönderin:
```bash
# Frontend logları
npx expo start

# Backend logları  
# Terminal'de hataları göreceksiniz
```

### Yaygın Hatalar ve Çözümleri:

**"Network request failed"**
→ Backend çalışmıyor veya .env yanlış

**"Unable to resolve module"**
→ `yarn install` veya `npm install` tekrar çalıştırın

**"Expo Go version mismatch"**
→ Expo Go uygulamanızı güncelleyin

**QR kod görünmüyor**
→ `npx expo start --tunnel` deneyin

---

## 💡 İPUÇLARI

1. **WiFi sorunu varsa:** `--tunnel` modu kullanın
2. **Hızlı geliştirme:** Fast Refresh aktif, değişiklikler otomatik yansır
3. **Debug:** Telefonu sallayın → Developer Menu açılır
4. **Hot Reload:** Dosya kaydettiğinizde otomatik güncellenir

---

## 🎉 BAŞARILI TEST!

Eğer uygulama telefonunuzda açıldıysa ve giriş yapabiliyorsanız, tebrikler! 

**Test etmeniz gereken özellikler:**
- ✅ Giriş yapma
- ✅ Premium butonu görünürlüğü
- ✅ Premium aktivasyonu (ücretsiz)
- ✅ Reklam izleme (mock - 2 saniye)
- ✅ Tema kilidi açma (3 reklam)
- ✅ Pembe yıldız teması

---

**Başarılar!** 🚀📱

Herhangi bir sorun olursa, hata mesajlarını tam olarak paylaşın.
