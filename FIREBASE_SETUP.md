# Firebase Kurulum Rehberi

## 1. Firebase Konsol Kurulumu

1. [Firebase Console](https://console.firebase.google.com)'a gidin
2. "Yeni Proje Oluştur" butonuna tıklayın
3. Proje adını girin (örn: "street-paws")
4. Google Analytics'i etkinleştirin (isteğe bağlı)
5. "Proje Oluştur"u tıklayın

## 2. Firebase Web Uygulaması Oluşturma

1. Firebase konsolunda projenize gidin
2. "Project Overview" sayfasında "</>" simgesine tıklayın (Web uygulaması)
3. Uygulama takma adı girin (örn: "street-paws-web")
4. "Register app" butonuna tıklayın
5. Size verilen Firebase yapılandırma kodunu kopyalayın

## 3. Authentication Ayarları

1. Sol menüden "Authentication"ı seçin
2. "Get Started" butonuna tıklayın
3. "Sign-in method" sekmesinde:
   - Email/Password'ü etkinleştirin
   - Google Sign-in'i etkinleştirin (opsiyonel)

## 4. Firestore Database Ayarları

1. Sol menüden "Firestore Database"i seçin
2. "Create Database" butonuna tıklayın
3. Production mode'u seçin
4. Bölge olarak "eur3 (europe-west)"i seçin
5. Güvenlik kurallarını aşağıdaki gibi güncelleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 5. Firebase Yapılandırma Dosyası

1. Firebase konsolundan aldığınız yapılandırma bilgilerini `src/config/firebase.ts` dosyasına ekleyin:

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