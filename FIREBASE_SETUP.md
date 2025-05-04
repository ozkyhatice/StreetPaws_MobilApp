# Firebase Kurulumu

Bu uygulama Firebase Authentication kullanmaktadır. Projeyi çalıştırmadan önce Firebase projesi oluşturup, gerekli konfigürasyonları yapmanız gerekmektedir.

## Adım 1: Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin ve Google hesabınızla giriş yapın
2. "Proje Ekle" butonuna tıklayın
3. Projenize bir isim verin (örn. "Sokak Dostları")
4. Google Analytics'i etkinleştirmeyi seçin
5. "Proje Oluştur" butonuna tıklayın ve proje oluşturulmasını bekleyin

## Adım 2: Authentication Servisini Etkinleştirme

1. Sol menüden "Authentication" seçeneğine tıklayın
2. "Get Started" veya "Başlangıç" butonuna tıklayın
3. "Sign-in method" (Oturum açma yöntemi) sekmesine tıklayın
4. "Email/Password" (E-posta/Şifre) satırına tıklayın ve etkinleştirin
5. "Save" (Kaydet) butonuna tıklayın

## Adım 3: Firebase Web Uygulaması Oluşturma

1. Ana sayfa dashboard'a dönün
2. "Add app" (Uygulama ekle) butonuna tıklayın ve web simgesini (</>)  seçin
3. Uygulamanıza bir takma ad verin (örn. "Sokak Dostları Web")
4. "Register app" (Uygulamayı kaydet) butonuna tıklayın
5. Firebase konfigürasyon bilgilerini kopyalayın

## Adım 4: Firebase Konfigürasyonu

1. `src/config/firebase.ts` dosyasını açın
2. Aşağıdaki bilgileri Firebase konsolundan aldığınız bilgilerle değiştirin:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Adım 5: Uygulamayı Başlatma

Firebase entegrasyonu tamamlandıktan sonra uygulamayı şu komutla başlatabilirsiniz:

```bash
npx expo start
```

## İpuçları

- Firebase Authentication'a ek olarak Firestore veya Firebase Storage gibi diğer Firebase hizmetlerini de kullanmak isterseniz, bu servisleri Firebase konsolundan etkinleştirmeniz gerekecektir.
- Üretim ortamında Firebase Authentication için güvenlik kurallarını yapılandırmayı unutmayın. 