# 🐛 Yaygın Hatalar ve Çözümleri

## ❌ HATA 1: "inflight deprecated" Uyarısı

```
npm warn deprecated inflight@1.0.6: This module is not supported
```

**Neden:** Eski bir bağımlılık, npm tarafından kullanılıyor

**Çözüm:** 
- ✅ Görmezden gelebilirsiniz (sadece uyarı, hata değil)
- ✅ Uygulama çalışır, sorun yok

**Kalıcı Çözüm:**
```bash
# .npmrc dosyası zaten eklendi
# Uyarıları gizler
```

---

## ❌ HATA 2: "rimraf deprecated" Uyarısı

```
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
```

**Neden:** Eski paket versiyonu

**Çözüm:**
- ✅ Görmezden gelebilirsiniz
- ✅ Uygulama çalışır

---

## ❌ HATA 3: "glob deprecated" Uyarısı

```
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
```

**Neden:** Eski paket versiyonu

**Çözüm:**
- ✅ Görmezden gelebilirsiniz
- ✅ Uygulama çalışır

---

## ❌ HATA 4: "@react-native-community/cli" Hatası

```
⚠️ react-native depends on @react-native-community/cli for cli commands
```

**NEDEN:** Siz React Native CLI komutu kullanıyorsunuz, ama bu **EXPO** projesi!

**YANLIŞ KOMUT:**
```bash
❌ npx react-native run-android
❌ react-native start
```

**DOĞRU KOMUT:**
```bash
✅ npx expo start
✅ yarn start
✅ npx expo start --android
```

**Açıklama:**
- Bu bir Expo projesi, React Native CLI değil
- `package.json` içinde `"main": "expo-router/entry"` var
- React Native CLI komutları çalışmaz!

---

## ❌ HATA 5: "npx react-native run-android" Çalışmıyor

**NEDEN:** Expo projesi, React Native CLI değil!

**ÇÖZÜM:**
```bash
# Android için
✅ npx expo start --android

# Veya Expo Go kullanın
✅ npx expo start
# Sonra QR kod ile telefona bağlanın
```

---

## ❌ HATA 6: "Metro bundler cannot start"

```
Error: Metro bundler failed to start
```

**ÇÖZÜM:**
```bash
# Cache temizle ve başlat
npx expo start -c

# Veya
rm -rf node_modules
yarn install
npx expo start
```

---

## ❌ HATA 7: "Unable to resolve module"

```
Error: Unable to resolve module react-native-google-mobile-ads
```

**ÇÖZÜM:**
```bash
# Tekrar yükle
cd frontend
rm -rf node_modules
yarn install

# Veya
npm install
```

**Not:** AdMob zaten mock moda alındı, bu hata gelmemeli.

---

## ❌ HATA 8: "Couldn't connect to development server"

**NEDEN:** 
- Telefon ve bilgisayar farklı WiFi'lerde
- Firewall engelliyor

**ÇÖZÜM 1: Tunnel Mode**
```bash
npx expo start --tunnel
```

**ÇÖZÜM 2: Aynı WiFi**
- Telefon ve bilgisayarı aynı WiFi'ye bağlayın
- Firewall'u geçici olarak kapatın

**ÇÖZÜM 3: LAN**
```bash
npx expo start --lan
```

---

## ❌ HATA 9: Backend'e Bağlanamıyor

```
Network request failed
```

**ÇÖZÜM:**
```bash
# 1. Backend çalışıyor mu kontrol edin
curl http://localhost:8001/api/vitamins/templates

# 2. .env dosyasını kontrol edin
# frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://SIZIN_IP:8001

# 3. IP adresinizi öğrenin
# Windows: ipconfig
# Mac/Linux: ifconfig

# 4. Backend'i başlatın
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

---

## ❌ HATA 10: "Expo Go version mismatch"

```
Error: This version of Expo Go is not compatible
```

**ÇÖZÜM:**
```bash
# 1. Expo Go uygulamasını güncelleyin (telefonda)

# 2. Veya Expo SDK versiyonunu güncelleyin
npx expo install --fix
```

---

## ❌ HATA 11: QR Kod Görünmüyor

**ÇÖZÜM 1: Tunnel Mode**
```bash
npx expo start --tunnel
```

**ÇÖZÜM 2: Manuel Bağlantı**
1. Expo Go uygulamasını açın
2. "Enter URL manually" seçin
3. Terminal'deki exp:// URL'sini girin

---

## ❌ HATA 12: "Port 8081 already in use"

```
Error: Port 8081 is already in use
```

**ÇÖZÜM 1: Farklı Port**
```bash
npx expo start --port 8082
```

**ÇÖZÜM 2: Process'i Öldür**
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8081 | xargs kill -9
```

---

## ✅ BAŞARILI KURULUM KONTROL LİSTESİ

Kurulum başarılı mı kontrol edin:

```bash
# 1. Node.js versiyonu
node --version  # v18+ olmalı

# 2. Dependencies yüklendi mi?
cd frontend
ls node_modules  # Dolu olmalı

# 3. Expo çalışıyor mu?
npx expo start
# QR kod görünmeli

# 4. Backend çalışıyor mu?
curl http://localhost:8001/api/vitamins/templates
# JSON dönmeli

# 5. Telefon bağlandı mı?
# Expo Go'da uygulama açılmalı
```

---

## 🎯 ÖZET: EN YAYIN HATALAR

| Hata | Çözüm |
|------|-------|
| `npx react-native run-android` çalışmıyor | ❌ Yanlış komut! ✅ `npx expo start` kullanın |
| deprecated uyarıları | ✅ Görmezden gelin, sorun değil |
| Backend'e bağlanamıyor | ✅ .env dosyasında IP'yi düzeltin |
| QR kod görünmüyor | ✅ `--tunnel` modu kullanın |
| Metro bundler hatası | ✅ Cache temizleyin: `npx expo start -c` |

---

## 🆘 HALA ÇÖZÜLMEDI Mİ?

### Debug Modu:
```bash
# Verbose log ile başlat
npx expo start --verbose

# Console logları
# Telefonda: Shake → Debug Remote JS
```

### Log Dosyaları:
```bash
# Metro bundler log
# Terminal'de tüm logları göreceksiniz

# Expo diagnostics
npx expo doctor
```

---

## 📞 DESTEK

Eğer hâlâ çalışmıyorsa, şunları paylaşın:

1. **Hangi komutu çalıştırdınız?**
2. **Tam hata mesajı nedir?**
3. **Node.js versiyonu?** (`node --version`)
4. **İşletim sistemi?** (Windows/Mac/Linux)
5. **Telefon:** Android/iOS?

---

**Başarılar!** 🚀

Unutmayın: Bu bir **EXPO** projesi, React Native CLI değil!
