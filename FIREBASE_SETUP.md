# Firebase Kurulum Talimatları

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. "Add project" (Proje Ekle) butonuna tıklayın
3. Proje adını girin ve devam edin
4. Google Analytics'i isterseniz açabilirsiniz (isteğe bağlı)
5. Projeyi oluşturun

## 2. Firestore Database Oluşturma

1. Firebase Console'da projenizi açın
2. Sol menüden "Firestore Database" seçin
3. "Create database" (Veritabanı oluştur) butonuna tıklayın
4. Test modunda başlatın (geliştirme için)
5. Location seçin (Türkiye için `europe-west1` veya size yakın bir bölge)

## 3. Firebase Config Keys'i Alma

1. Firebase Console'da proje ayarlarına gidin (⚙️ ikonu)
2. "Project settings" seçin
3. "General" sekmesinde aşağı kaydırın
4. "Your apps" bölümünde Web uygulaması ekleyin (</> ikonu)
5. App nickname verin ve "Register app" tıklayın
6. Config değerlerini kopyalayın

## 4. Environment Variables Ayarlama

1. Proje root dizininde `.env.local` dosyası oluşturun
2. Aşağıdaki değerleri Firebase Console'dan aldığınız değerlerle doldurun:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 5. Firestore Security Rules

Firebase Console > Firestore Database > Rules sekmesine gidin ve şu kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - herkes okuyabilir, yeni kayıt için write izni ver
    match /users/{userId} {
      allow read: if true;
      // Yeni kullanıcı kaydı için: gerekli alanlar kontrol ediliyor
      allow create: if request.resource.data.keys().hasAll(['name', 'username', 'password', 'role', 'createdAt']) &&
                     request.resource.data.role is string &&
                     (request.resource.data.role == 'student' || request.resource.data.role == 'teacher');
      // Update ve delete app logic ile kontrol ediliyor
      allow update, delete: if true;
    }

    // Books collection - herkes okuyabilir, authenticated users yazabilir
    match /books/{bookId} {
      allow read: if true;
      allow create: if true; // Kayıt olmuş herkes kitap ekleyebilir
      allow update, delete: if true; // Öğretmenler silebilir (app logic ile kontrol)
    }

    // Comments collection
    match /comments/{commentId} {
      allow read: if true;
      allow create: if true; // Herkes yorum yazabilir
      allow delete: if true; // Öğretmenler silebilir (app logic ile kontrol)
    }

    // Trade Requests collection
    match /tradeRequests/{requestId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
      allow delete: if true;
    }

    // Reading Statuses collection
    match /readingStatuses/{statusId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if true;
    }
  }
}
```

**Not:** Bu kurallar development için açık. Production'da daha sıkı kurallar uygulayın.

## 6. Paketleri Yükleme

```bash
npm install
```

## 7. İlk Öğretmen Hesabı Oluşturma

Firebase Console > Firestore Database > Data sekmesine gidin ve `users` collection'ına manuel olarak bir öğretmen ekleyin:

1. "Start collection" tıklayın
2. Collection ID: `users`
3. Document ID: Otomatik veya manuel (örn: `teacher1`)
4. Fields ekleyin:
   - `name` (string): Öğretmen Adı
   - `username` (string): Kullanıcı adı
   - `password` (string): SHA256 hash edilmiş şifre
   - `role` (string): `teacher`
   - `createdAt` (timestamp): Şu anki zaman

Şifreyi hash etmek için browser console'da:

```javascript
// Şifrenizi hash edin (örn: "admin123")
// Bu kod browser console'da çalıştırılmalı
import CryptoJS from "crypto-js";
CryptoJS.SHA256("admin123").toString();
```

## 8. Vercel Deployment

Vercel'e deploy ederken:

1. Vercel dashboard'a gidin
2. Project Settings > Environment Variables
3. Tüm `NEXT_PUBLIC_FIREBASE_*` değişkenlerini ekleyin
4. Deploy edin

## Önemli Notlar

- İlk çalıştırmada Firestore boş olacak
- Mock data migration yapılmadı, sıfırdan başlanacak
- Şifreler SHA256 ile hash'leniyor (client-side)
- Production'da daha güvenli authentication yöntemleri kullanılması önerilir
