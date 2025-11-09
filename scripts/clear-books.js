// Script to clear all books from Firestore
// Run with: node scripts/clear-books.js
// WARNING: This will delete ALL books from Firestore!

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

async function clearAllBooks() {
  try {
    console.log("⚠️  WARNING: This will delete ALL books from Firestore!");
    console.log("Fetching all books...");

    const booksSnapshot = await getDocs(collection(db, "books"));
    const books = booksSnapshot.docs;

    if (books.length === 0) {
      console.log("✅ No books found. Nothing to delete.");
      process.exit(0);
    }

    console.log(`Found ${books.length} book(s). Deleting...`);

    const deletePromises = books.map(async (bookDoc) => {
      const bookData = bookDoc.data();
      await deleteDoc(doc(db, "books", bookDoc.id));
      console.log(`  ✓ Deleted book: ${bookData.title || bookDoc.id}`);
    });

    await Promise.all(deletePromises);

    // Also delete related comments
    console.log("\nDeleting related comments...");
    const commentsSnapshot = await getDocs(collection(db, "comments"));
    const comments = commentsSnapshot.docs;
    if (comments.length > 0) {
      const deleteCommentPromises = comments.map((commentDoc) =>
        deleteDoc(doc(db, "comments", commentDoc.id))
      );
      await Promise.all(deleteCommentPromises);
      console.log(`  ✓ Deleted ${comments.length} comment(s)`);
    }

    // Also delete related trade requests
    console.log("Deleting related trade requests...");
    const tradeRequestsSnapshot = await getDocs(
      collection(db, "tradeRequests")
    );
    const tradeRequests = tradeRequestsSnapshot.docs;
    if (tradeRequests.length > 0) {
      const deleteTradeRequestPromises = tradeRequests.map((requestDoc) =>
        deleteDoc(doc(db, "tradeRequests", requestDoc.id))
      );
      await Promise.all(deleteTradeRequestPromises);
      console.log(`  ✓ Deleted ${tradeRequests.length} trade request(s)`);
    }

    // Also delete related reading statuses
    console.log("Deleting related reading statuses...");
    const readingStatusesSnapshot = await getDocs(
      collection(db, "readingStatuses")
    );
    const readingStatuses = readingStatusesSnapshot.docs;
    if (readingStatuses.length > 0) {
      const deleteReadingStatusPromises = readingStatuses.map((statusDoc) =>
        deleteDoc(doc(db, "readingStatuses", statusDoc.id))
      );
      await Promise.all(deleteReadingStatusPromises);
      console.log(`  ✓ Deleted ${readingStatuses.length} reading status(es)`);
    }

    console.log(
      `\n✅ Successfully deleted ${books.length} book(s) and all related data!`
    );
    console.log("You can now start fresh with the new multi-classroom system.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

clearAllBooks();
