// Firebase öğretmen hesabı oluşturma scripti
// Bu scripti çalıştırmak için: node scripts/seed-teacher.js

const CryptoJS = require("crypto-js");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyApAGzQSUeaJsNREhgiCI0ZI5J9vQ4x0g8",
  authDomain: "kutupapp.firebaseapp.com",
  projectId: "kutupapp",
  storageBucket: "kutupapp.firebasestorage.app",
  messagingSenderId: "645328695827",
  appId: "1:645328695827:web:dfa02004e488fdae3fc5e6",
  measurementId: "G-0FC967L5XR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTeacherAccount() {
  try {
    const username = "adminogretmen";
    const password = "okumakguzel123";
    const hashedPassword = CryptoJS.SHA256(password).toString();

    // Check if username already exists
    const usersQuery = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const existingUsers = await getDocs(usersQuery);

    if (!existingUsers.empty) {
      console.log("❌ Bu kullanıcı adı zaten mevcut!");
      process.exit(1);
    }

    // Create teacher user
    const teacherData = {
      name: "Admin Öğretmen",
      username: username,
      password: hashedPassword,
      role: "teacher",
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "users"), teacherData);
    console.log("✅ Öğretmen hesabı başarıyla oluşturuldu!");
    console.log("📋 Hesap Detayları:");
    console.log("   - Document ID:", docRef.id);
    console.log("   - Kullanıcı Adı:", username);
    console.log("   - Şifre:", password);
    console.log("   - Rol: teacher");
    console.log("\n🎉 Artık bu bilgilerle giriş yapabilirsiniz!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error.message);
    process.exit(1);
  }
}

createTeacherAccount();

