// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Environment variables kullanılıyorsa onları kullan, yoksa fallback değerleri kullan
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyApAGzQSUeaJsNREhgiCI0ZI5J9vQ4x0g8",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kutupapp.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kutupapp",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "kutupapp.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "645328695827",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:645328695827:web:dfa02004e488fdae3fc5e6",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0FC967L5XR",
};

// Initialize Firebase (avoid multiple initializations)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics only on client side
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export default app;
