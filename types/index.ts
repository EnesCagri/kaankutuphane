export interface Classroom {
  id: string;
  grade: number; // 5, 6, or 7
  className: string; // "A", "B", "C", "D" for grades 5-6; "A", "B", "C" for grade 7
  teacherId: string; // Reference to teacher user
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Only in mock data, never stored in localStorage
  role: "student" | "teacher"; // teacher = admin rolü
  avatarUrl?: string; // Profil fotoğrafı URL'i (base64 veya URL)
  classroomId?: string; // For students - references classroom.id
  classroomIds?: string[]; // For teachers - array of classroom.id references
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  addedBy: string; // user id - kitabı ilk ekleyen kişi (sahibi)
  genre?: string; // kitap türü (roman, masal, bilim kurgu, vb.)
  createdAt: Date;
}

export interface Comment {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface TradeRequest {
  id: string;
  bookId: string;
  requestedBookId: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

export interface ReadingStatus {
  bookId: string;
  userId: string;
  readAt: Date;
}
