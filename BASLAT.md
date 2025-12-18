# 🚀 HIZLI BAŞLATMA REHBERİ

## 📱 Telefonunuzda Test İçin 3 Adım

### 1️⃣ Backend'i Başlat

```bash
# Terminal 1
cd backend

# Virtual environment (isteğe bağlı)
python -m venv venv
source venv/bin/activate  # Mac/Linux
# VEYA
venv\Scripts\activate  # Windows

# Bağımlılıkları yükle
pip install -r requirements.txt

# .env dosyası gerekli!
# MONGO_URL ve EMERGENT_LLM_KEY olmalı

# Backend'i başlat
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

✅ Backend hazır: http://localhost:8001

---

### 2️⃣ Frontend'i Başlat

```bash
# Terminal 2 (yeni terminal aç)
cd frontend

# Bağımlılıkları yükle (ilk seferinde)
yarn install
# VEYA
npm install

# .env dosyasını düzenle
# EXPO_PUBLIC_BACKEND_URL=http://SIZIN_IP:8001
# Not: localhost değil, gerçek IP adresiniz!

# IP adresinizi öğrenin:
# Windows: ipconfig
# Mac/Linux: ifconfig

# Expo sunucusunu başlat
npx expo start
```

✅ QR kod ekranda görünecek!

---

### 3️⃣ Telefonunuzda Aç

**Android:**
1. Google Play → **Expo Go** indir
2. Expo Go'yu aç
3. QR kodu tara
4. Uygulama açılsın! 🎉

**iOS:**
1. App Store → **Expo Go** indir
2. Kamera ile QR kodu tara
3. Expo Go'da aç
4. Uygulama açılsın! 🎉

---

## ⚠️ ÖNEMLİ NOTLAR

### ❌ YANLIŞ Komutlar (Çalışmaz!)
```bash
❌ npx react-native run-android
❌ react-native start
❌ npm run android
```

### ✅ DOĞRU Komutlar
```bash
✅ npx expo start
✅ yarn start
✅ npx expo start --tunnel  # WiFi sorunu varsa
```

---

## 🔧 Sorun mu var?

### WiFi Sorunu:
```bash
npx expo start --tunnel
```

### Backend Bağlantı Sorunu:
```bash
# frontend/.env dosyasını düzenle
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001
# (Kendi IP'nizi yazın!)
```

### Cache Sorunu:
```bash
npx expo start -c
```

---

## 🎯 Test Listesi

Telefonunuzda şunları test edin:

- [ ] Uygulama açıldı mı?
- [ ] Giriş ekranı görünüyor mu?
- [ ] Ana ekranda kartlar var mı?
- [ ] Premium butonu görünüyor mu?
- [ ] Premium butonuna tıkla → Modal açılıyor mu?
- [ ] "🎉 ÜCRETSİZ ABONE OL" butonu görünüyor mu?
- [ ] Butona tıkla → Premium aktif oluyor mu?

---

## 🆘 Yardım

Daha fazla bilgi için:
- 📖 `TELEFONUNUZDA_TEST.md` - Detaylı rehber
- 🐛 `HATALAR_VE_COZUMLER.md` - Hata çözümleri
- 📝 `CHANGES_SUMMARY.md` - Yapılan değişiklikler

---

**Başarılar!** 🚀📱
