// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApAGzQSUeaJsNREhgiCI0ZI5J9vQ4x0g8",
  authDomain: "kutupapp.firebaseapp.com",
  projectId: "kutupapp",
  storageBucket: "kutupapp.firebasestorage.app",
  messagingSenderId: "645328695827",
  appId: "1:645328695827:web:dfa02004e488fdae3fc5e6",
  measurementId: "G-0FC967L5XR",
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
