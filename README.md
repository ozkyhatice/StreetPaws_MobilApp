# StreetPaws Mobile App

StreetPaws, sokak hayvanlarına yardım etmek için oluşturulmuş bir mobil uygulamadır. Gönüllüler, görevleri üstlenebilir, tamamlayabilir ve sokak hayvanlarına yardım ederek XP kazanabilirler.

## Özellikler

- Görev yönetimi (görüntüleme, üstlenme, tamamlama)
- Kullanıcı kimlik doğrulama
- QR kod tarama
- Harita entegrasyonu
- Gönüllü profil sayfası
- Bağış sistemi

## Gereksinimler

- Node.js (v14 veya üzeri)
- npm (v6 veya üzeri)
- Expo CLI
- iOS için: Xcode (macOS)
- Android için: Android Studio ve JDK

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/ozkyhatice/StreetPaws_MobilApp.git
cd StreetPaws_MobilApp
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirici istemcisini yükleyin:
```bash
npx expo install expo-dev-client
```

## Bağımlılıklar

Projenin ana bağımlılıkları şunlardır:

```
"dependencies": {
  "@react-navigation/bottom-tabs": "^6.5.11",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/native-stack": "^6.9.17",
  "expo": "~50.0.11",
  "expo-barcode-scanner": "~12.5.3",
  "expo-camera": "~13.2.1",
  "expo-dev-client": "~2.2.1",
  "expo-location": "~16.1.0",
  "expo-status-bar": "~1.6.0",
  "lucide-react-native": "^0.302.0",
  "react": "18.2.0",
  "react-native": "0.72.6",
  "react-native-maps": "1.7.1",
  "react-native-paper": "^5.11.1",
  "react-native-safe-area-context": "4.6.3",
  "react-native-screens": "~3.22.0",
  "react-native-vector-icons": "^10.0.0"
}
```

## Uygulamayı Çalıştırma

Uygulamayı geliştirme modunda başlatmak için:

```bash
npx expo start
```

Expo Go uygulaması ile test etmek için:

```bash
npx expo start --dev-client
```

iOS simülatöründe çalıştırmak için:

```bash
npx expo run:ios
```

Android emülatöründe çalıştırmak için:

```bash
npx expo run:android
```

## Notlar ve Sorun Giderme

1. İlk kurulum sırasında expo-dev-client yüklemek gereklidir:
   ```bash
   npx expo install expo-dev-client
   ```

2. iOS'ta "AirGoogleMaps dizini bulunamadı" hatası alırsanız, Google Maps yerine varsayılan harita sağlayıcısını kullanın.

3. QR kod tarayıcısı için kamera izinlerinin verildiğinden emin olun.

4. Expo'nun en son sürümünü kullanmak için düzenli olarak güncelleme yapmanız önerilir:
   ```bash
   npm install -g expo-cli
   ```

## Projeyi Hazırlama ve Derleme

Üretim için APK/IPA oluşturmak için:

```bash
eas build --platform android
eas build --platform ios
```

Önce EAS CLI'yi yüklemeniz gerekebilir:

```bash
npm install -g eas-cli
```

## Proje Yapısı

```
streetpaws/
├── assets/           # Görsel ve statik dosyalar
├── src/
│   ├── components/   # Yeniden kullanılabilir bileşenler
│   ├── contexts/     # React context dosyaları
│   ├── hooks/        # Özel hook'lar
│   ├── navigation/   # Navigasyon yapılandırması
│   ├── screens/      # Uygulama ekranları
│   ├── services/     # Veri ve API servisleri
│   └── types/        # TypeScript tip tanımlamaları
├── App.tsx           # Ana uygulama bileşeni
└── package.json      # Paket bağımlılıkları
```

## Lisans

MIT Lisansı

---
