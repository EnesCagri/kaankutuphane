// Script to clear all users from Firestore
// Run with: node scripts/clear-users.js
// WARNING: This will delete ALL users from Firestore!

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
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

async function clearAllUsers() {
  try {
    console.log("⚠️  WARNING: This will delete ALL users from Firestore!");
    console.log("Fetching all users...");

    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs;

    if (users.length === 0) {
      console.log("✅ No users found. Nothing to delete.");
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s). Deleting...`);

    const deletePromises = users.map(async (userDoc) => {
      await deleteDoc(doc(db, "users", userDoc.id));
      console.log(`  ✓ Deleted user: ${userDoc.data().username || userDoc.id}`);
    });

    await Promise.all(deletePromises);

    console.log(`\n✅ Successfully deleted ${users.length} user(s)!`);
    console.log("You can now start fresh with the new multi-classroom system.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

clearAllUsers();
