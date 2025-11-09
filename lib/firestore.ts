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
import {
  Book,
  Comment,
  User,
  TradeRequest,
  ReadingStatus,
  Classroom,
} from "@/types";
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

// Classrooms
export async function createClassroom(
  grade: number,
  className: string,
  teacherId: string
): Promise<{ success: boolean; classroom?: Classroom; error?: string }> {
  try {
    // Check if classroom already exists for this teacher
    const classroomsQuery = query(
      collection(db, "classrooms"),
      where("grade", "==", grade),
      where("className", "==", className),
      where("teacherId", "==", teacherId)
    );
    const existingClassrooms = await getDocs(classroomsQuery);
    if (!existingClassrooms.empty) {
      return {
        success: false,
        error: `Bu sınıf (${grade}${className}) zaten mevcut`,
      };
    }

    // Create classroom
    const classroomData = {
      grade,
      className,
      teacherId,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "classrooms"), classroomData);
    const classroom = {
      id: docRef.id,
      ...classroomData,
      createdAt: timestampToDate(classroomData.createdAt),
    } as Classroom;

    // Update teacher's classroomIds array
    const teacherRef = doc(db, "users", teacherId);
    const teacherDoc = await getDoc(teacherRef);
    if (teacherDoc.exists()) {
      const teacherData = teacherDoc.data();
      const classroomIds = teacherData.classroomIds || [];
      if (!classroomIds.includes(docRef.id)) {
        await updateDoc(teacherRef, {
          classroomIds: [...classroomIds, docRef.id],
        });
      }
    }

    return { success: true, classroom };
  } catch (error: any) {
    return { success: false, error: error.message || "Sınıf oluşturulamadı" };
  }
}

export async function getClassrooms(teacherId?: string): Promise<Classroom[]> {
  let classroomsQuery;
  if (teacherId) {
    classroomsQuery = query(
      collection(db, "classrooms"),
      where("teacherId", "==", teacherId)
    );
  } else {
    classroomsQuery = collection(db, "classrooms");
  }

  const classroomsSnapshot = await getDocs(classroomsQuery);
  return classroomsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToDate(doc.data().createdAt),
  })) as Classroom[];
}

export async function getClassroomById(
  classroomId: string
): Promise<Classroom | null> {
  const classroomDoc = await getDoc(doc(db, "classrooms", classroomId));
  if (!classroomDoc.exists()) return null;
  const data = classroomDoc.data();
  return {
    id: classroomDoc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
  } as Classroom;
}

export async function getClassroomsByGrade(
  grade: number
): Promise<Classroom[]> {
  const classroomsQuery = query(
    collection(db, "classrooms"),
    where("grade", "==", grade)
  );
  const classroomsSnapshot = await getDocs(classroomsQuery);
  return classroomsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: timestampToDate(doc.data().createdAt),
  })) as Classroom[];
}

export async function deleteClassroom(classroomId: string): Promise<boolean> {
  try {
    // Remove classroom from teacher's classroomIds
    const classroomDoc = await getDoc(doc(db, "classrooms", classroomId));
    if (classroomDoc.exists()) {
      const classroomData = classroomDoc.data();
      const teacherRef = doc(db, "users", classroomData.teacherId);
      const teacherDoc = await getDoc(teacherRef);
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        const classroomIds = (teacherData.classroomIds || []).filter(
          (id: string) => id !== classroomId
        );
        await updateDoc(teacherRef, { classroomIds });
      }

      // Update students to remove classroomId
      const studentsQuery = query(
        collection(db, "users"),
        where("classroomId", "==", classroomId)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const updatePromises = studentsSnapshot.docs.map((studentDoc) =>
        updateDoc(studentDoc.ref, { classroomId: null })
      );
      await Promise.all(updatePromises);
    }

    // Delete classroom
    await deleteDoc(doc(db, "classrooms", classroomId));
    return true;
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return false;
  }
}

// Users
export async function getUsers(classroomIds?: string[]): Promise<User[]> {
  let usersQuery;
  if (classroomIds && classroomIds.length > 0) {
    // Get users from specific classrooms
    const constraints: QueryConstraint[] = [];
    // Firestore 'in' query supports up to 10 items
    if (classroomIds.length <= 10) {
      constraints.push(where("classroomId", "in", classroomIds));
    } else {
      // If more than 10, we need to split into multiple queries
      const queries = [];
      for (let i = 0; i < classroomIds.length; i += 10) {
        const batch = classroomIds.slice(i, i + 10);
        queries.push(
          getDocs(
            query(collection(db, "users"), where("classroomId", "in", batch))
          )
        );
      }
      const results = await Promise.all(queries);
      const users: User[] = [];
      results.forEach((snapshot) => {
        users.push(
          ...(snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            password: undefined,
            createdAt: timestampToDate(doc.data().createdAt),
          })) as User[])
        );
      });
      return users;
    }
    usersQuery = query(collection(db, "users"), ...constraints);
  } else {
    usersQuery = collection(db, "users");
  }

  const usersSnapshot = await getDocs(usersQuery);
  return usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    password: undefined, // Don't return password
    createdAt: timestampToDate(doc.data().createdAt),
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
    createdAt: timestampToDate(data.createdAt),
  } as User;
}

export async function registerUser(
  name: string,
  username: string,
  password: string,
  role: "student" | "teacher" = "student",
  classroomId?: string,
  classroomIds?: string[]
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
    const userData: any = {
      name: name.trim(),
      username: username.trim(),
      password: hashedPassword,
      role,
      createdAt: Timestamp.now(),
    };

    // Add classroom assignments
    if (role === "student" && classroomId) {
      userData.classroomId = classroomId;
    } else if (role === "teacher" && classroomIds) {
      userData.classroomIds = classroomIds;
    }

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

export async function getStudentsByClassroom(
  classroomId: string
): Promise<User[]> {
  const studentsQuery = query(
    collection(db, "users"),
    where("classroomId", "==", classroomId),
    where("role", "==", "student")
  );
  const studentsSnapshot = await getDocs(studentsQuery);
  return studentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    password: undefined,
    createdAt: timestampToDate(doc.data().createdAt),
  })) as User[];
}

export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, "id" | "password">>
): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
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
): Promise<{ success: boolean; book?: Book; error?: string }> {
  try {
    // Get the user who is adding the book
    const user = await getUserById(book.addedBy);
    if (!user || user.role !== "student") {
      return {
        success: false,
        error: "Sadece öğrenciler kitap ekleyebilir",
      };
    }

    // Check if user has a classroom
    if (!user.classroomId) {
      return {
        success: false,
        error: "Sınıf bilginiz bulunamadı. Lütfen tekrar giriş yapın.",
      };
    }

    // Check if a student from the same classroom already added the same book
    // (same title and author)
    const booksQuery = query(
      collection(db, "books"),
      where("title", "==", book.title.trim()),
      where("author", "==", book.author.trim())
    );
    const existingBooksSnapshot = await getDocs(booksQuery);

    if (!existingBooksSnapshot.empty) {
      // Check if any of these books were added by students from the same classroom
      const existingBooks = existingBooksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Book[];

      // Get all users who added these books
      const addedByUserIds = [...new Set(existingBooks.map((b) => b.addedBy))];

      // Check users in batches (Firestore 'in' query limit is 10)
      for (let i = 0; i < addedByUserIds.length; i += 10) {
        const batch = addedByUserIds.slice(i, i + 10);

        // Get users by their IDs
        const userPromises = batch.map((userId) => getUserById(userId));
        const batchUsers = (await Promise.all(userPromises)).filter(
          (u) => u !== null
        ) as User[];

        // Check if any user is from the same classroom
        const sameClassroomUser = batchUsers.find(
          (u) => u.classroomId === user.classroomId
        );

        if (sameClassroomUser) {
          return {
            success: false,
            error: `Bu kitap (${book.title} - ${book.author}) sınıfınızda zaten eklenmiş. Aynı sınıfta aynı kitaptan sadece bir tane olabilir.`,
          };
        }
      }
    }

    // Create the book
    const bookData = {
      ...book,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "books"), bookData);
    return {
      success: true,
      book: {
        id: docRef.id,
        ...book,
        createdAt: new Date(),
      } as Book,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Kitap eklenirken bir hata oluştu",
    };
  }
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
): Promise<{
  success: boolean;
  readingStatus?: ReadingStatus;
  error?: string;
}> {
  try {
    // Check if this user already marked this book as read
    const existingQuery = query(
      collection(db, "readingStatuses"),
      where("userId", "==", status.userId),
      where("bookId", "==", status.bookId)
    );
    const existingDocs = await getDocs(existingQuery);

    // If already exists, return existing status instead of creating duplicate
    if (!existingDocs.empty) {
      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data();
      return {
        success: true,
        readingStatus: {
          ...status,
          readAt: timestampToDate(existingData.readAt),
        } as ReadingStatus,
      };
    }

    // Check daily limit: user can only mark one book as read per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userReadingStatuses = await getReadingStatuses(
      undefined,
      status.userId
    );
    const todayReadings = userReadingStatuses.filter((s) => {
      const readDate = new Date(s.readAt);
      readDate.setHours(0, 0, 0, 0);
      return readDate.getTime() === today.getTime();
    });

    if (todayReadings.length > 0) {
      return {
        success: false,
        error:
          "Bugün zaten bir kitap okudunuz. Günde sadece bir kitap okuma hakkınız var.",
      };
    }

    // Create new reading status
    const statusData = {
      ...status,
      readAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "readingStatuses"), statusData);
    return {
      success: true,
      readingStatus: {
        ...status,
        readAt: new Date(),
      } as ReadingStatus,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Okuma durumu eklenirken bir hata oluştu",
    };
  }
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
