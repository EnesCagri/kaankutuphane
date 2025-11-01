"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { Book, Comment, User, TradeRequest, ReadingStatus } from "@/types";
import CryptoJS from "crypto-js";

// Password hash helper
const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// Convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

// Users
export async function getUsers(): Promise<User[]> {
  const usersSnapshot = await getDocs(collection(db, "users"));
  return usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    password: undefined, // Don't return password
  })) as User[];
}

export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) return null;
  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    password: undefined,
  } as User;
}

export async function registerUser(
  name: string,
  username: string,
  password: string,
  role: "student" | "teacher" = "student"
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if username exists
    const usersQuery = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const existingUsers = await getDocs(usersQuery);
    if (!existingUsers.empty) {
      return { success: false, error: "Bu kullanıcı adı zaten kullanılıyor" };
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const userData = {
      name: name.trim(),
      username: username.trim(),
      password: hashedPassword,
      role,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "users"), userData);
    const user = {
      id: docRef.id,
      ...userData,
      password: undefined,
      createdAt: timestampToDate(userData.createdAt),
    } as User;

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "Kayıt başarısız" };
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "users", userId));
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const hashedPassword = hashPassword(password);
    const usersQuery = query(
      collection(db, "users"),
      where("username", "==", username),
      where("password", "==", hashedPassword)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return { success: false, error: "Kullanıcı adı veya şifre hatalı" };
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const user: User = {
      id: userDoc.id,
      name: userData.name,
      username: userData.username,
      role: userData.role,
    };

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "Giriş başarısız" };
  }
}

// Books
export async function getBooks(): Promise<Book[]> {
  const booksSnapshot = await getDocs(collection(db, "books"));
  return booksSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToDate(doc.data().createdAt),
  })) as Book[];
}

export async function getBookById(bookId: string): Promise<Book | null> {
  const bookDoc = await getDoc(doc(db, "books", bookId));
  if (!bookDoc.exists()) return null;
  const data = bookDoc.data();
  return {
    id: bookDoc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
  } as Book;
}

export async function addBook(
  book: Omit<Book, "id" | "createdAt">
): Promise<Book> {
  const bookData = {
    ...book,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "books"), bookData);
  return {
    id: docRef.id,
    ...book,
    createdAt: new Date(),
  } as Book;
}

export async function deleteBook(bookId: string): Promise<boolean> {
  try {
    // Delete book
    await deleteDoc(doc(db, "books", bookId));

    // Delete related comments
    const commentsQuery = query(
      collection(db, "comments"),
      where("bookId", "==", bookId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const deleteCommentPromises = commentsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deleteCommentPromises);

    // Delete related trade requests
    const tradeRequestsQuery = query(
      collection(db, "tradeRequests"),
      where("bookId", "==", bookId)
    );
    const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
    const tradeRequestsToDelete = tradeRequestsSnapshot.docs;

    const requestedBooksQuery = query(
      collection(db, "tradeRequests"),
      where("requestedBookId", "==", bookId)
    );
    const requestedBooksSnapshot = await getDocs(requestedBooksQuery);
    const requestedBooksToDelete = requestedBooksSnapshot.docs;

    const allTradeRequests = [
      ...tradeRequestsToDelete,
      ...requestedBooksToDelete,
    ];
    const deleteTradeRequestPromises = allTradeRequests.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deleteTradeRequestPromises);

    // Delete related reading statuses
    const readingStatusesQuery = query(
      collection(db, "readingStatuses"),
      where("bookId", "==", bookId)
    );
    const readingStatusesSnapshot = await getDocs(readingStatusesQuery);
    const deleteReadingStatusPromises = readingStatusesSnapshot.docs.map(
      (doc) => deleteDoc(doc.ref)
    );
    await Promise.all(deleteReadingStatusPromises);

    return true;
  } catch (error) {
    console.error("Error deleting book:", error);
    return false;
  }
}

// Comments
export async function getComments(bookId?: string): Promise<Comment[]> {
  let commentsQuery;
  if (bookId) {
    commentsQuery = query(
      collection(db, "comments"),
      where("bookId", "==", bookId)
    );
  } else {
    commentsQuery = collection(db, "comments");
  }

  const commentsSnapshot = await getDocs(commentsQuery);
  return commentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToDate(doc.data().createdAt),
  })) as Comment[];
}

export async function addComment(
  comment: Omit<Comment, "id" | "createdAt">
): Promise<Comment> {
  const commentData = {
    ...comment,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "comments"), commentData);
  return {
    id: docRef.id,
    ...comment,
    createdAt: new Date(),
  } as Comment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "comments", commentId));
    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}

// Trade Requests
export async function getTradeRequests(
  userId?: string,
  status?: "pending" | "accepted" | "rejected"
): Promise<TradeRequest[]> {
  const constraints: QueryConstraint[] = [];

  if (userId) {
    constraints.push(where("toUserId", "==", userId));
  }

  if (status) {
    constraints.push(where("status", "==", status));
  }

  const tradeRequestsQuery =
    constraints.length > 0
      ? query(collection(db, "tradeRequests"), ...constraints)
      : collection(db, "tradeRequests");

  const tradeRequestsSnapshot = await getDocs(tradeRequestsQuery);
  return tradeRequestsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToDate(doc.data().createdAt),
  })) as TradeRequest[];
}

export async function addTradeRequest(
  request: Omit<TradeRequest, "id" | "createdAt" | "status">
): Promise<TradeRequest> {
  const requestData = {
    ...request,
    status: "pending",
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "tradeRequests"), requestData);
  return {
    id: docRef.id,
    ...request,
    status: "pending",
    createdAt: new Date(),
  } as TradeRequest;
}

export async function updateTradeRequest(
  requestId: string,
  status: "accepted" | "rejected",
  selectedBookId?: string
): Promise<boolean> {
  try {
    const requestRef = doc(db, "tradeRequests", requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) return false;

    const requestData = requestDoc.data() as TradeRequest;

    // Update status
    await updateDoc(requestRef, {
      status,
      ...(selectedBookId && selectedBookId !== requestData.requestedBookId
        ? { requestedBookId: selectedBookId }
        : {}),
    });

    // If accepted, swap book owners (değiş tokuş)
    if (status === "accepted") {
      const finalRequestedBookId =
        selectedBookId || requestData.requestedBookId;

      const book1Ref = doc(db, "books", requestData.bookId);
      const book2Ref = doc(db, "books", finalRequestedBookId);

      const [book1Doc, book2Doc] = await Promise.all([
        getDoc(book1Ref),
        getDoc(book2Ref),
      ]);

      if (!book1Doc.exists() || !book2Doc.exists()) {
        console.error("One or both books not found for trade");
        return false;
      }

      const book1Data = book1Doc.data();
      const book2Data = book2Doc.data();

      // Swap owners (kitap sahiplerini değiştir)
      // Book1's owner becomes Book2's owner and vice versa
      await Promise.all([
        updateDoc(book1Ref, { addedBy: book2Data.addedBy }),
        updateDoc(book2Ref, { addedBy: book1Data.addedBy }),
      ]);
    }

    return true;
  } catch (error) {
    console.error("Error updating trade request:", error);
    return false;
  }
}

// Reading Statuses
export async function getReadingStatuses(
  bookId?: string,
  userId?: string
): Promise<ReadingStatus[]> {
  const constraints: QueryConstraint[] = [];

  if (bookId) {
    constraints.push(where("bookId", "==", bookId));
  }

  if (userId) {
    constraints.push(where("userId", "==", userId));
  }

  const readingStatusesQuery =
    constraints.length > 0
      ? query(collection(db, "readingStatuses"), ...constraints)
      : collection(db, "readingStatuses");

  const readingStatusesSnapshot = await getDocs(readingStatusesQuery);
  return readingStatusesSnapshot.docs.map((doc) => ({
    ...doc.data(),
    readAt: timestampToDate(doc.data().readAt),
  })) as ReadingStatus[];
}

export async function addReadingStatus(
  status: Omit<ReadingStatus, "readAt">
): Promise<ReadingStatus> {
  const statusData = {
    ...status,
    readAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "readingStatuses"), statusData);
  return {
    ...status,
    readAt: new Date(),
  } as ReadingStatus;
}

export async function deleteReadingStatusesByUserId(
  userId: string
): Promise<boolean> {
  try {
    const readingStatusesQuery = query(
      collection(db, "readingStatuses"),
      where("userId", "==", userId)
    );
    const readingStatusesSnapshot = await getDocs(readingStatusesQuery);
    const deletePromises = readingStatusesSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error deleting reading statuses:", error);
    return false;
  }
}
