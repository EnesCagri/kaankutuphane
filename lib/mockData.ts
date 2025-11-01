import { Book, Comment, TradeRequest, ReadingStatus, User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    username: "ahmet",
    password: "123456",
    role: "student",
  },
  {
    id: "2",
    name: "Ayşe Demir",
    username: "ayse",
    password: "123456",
    role: "student",
  },
  {
    id: "3",
    name: "Mehmet Kaya",
    username: "mehmet",
    password: "123456",
    role: "student",
  },
  {
    id: "4",
    name: "Zeynep Öztürk",
    username: "zeynep",
    password: "123456",
    role: "student",
  },
  {
    id: "teacher1",
    name: "Öğretmen Ayşe",
    username: "ogretmen",
    password: "admin123",
    role: "teacher",
  },
];

// Mock Books
export let mockBooks: Book[] = [
  {
    id: "1",
    title: "Minik Panda'nın Maceraları",
    author: "Elif Yavuz",
    description:
      "Minik bir pandanın ormanda yeni arkadaşlar edinmesini anlatan sıcak bir hikaye.",
    imageUrl:
      "https://images.unsplash.com/photo-1549646820-20e3a9c7b9c9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "1",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Cesur Civciv Cici",
    author: "Canan Aksoy",
    description:
      "Çiftlikteki en küçük civciv Cici'nin büyük hayallerinin peşinden gitmesini konu alır.",
    imageUrl:
      "https://images.unsplash.com/photo-1596499313460-a226b5394017?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "2",
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "3",
    title: "Uyuyan Dev",
    author: "Ahmet Erdem",
    description:
      "Bir köyü koruyan nazik devin efsanesini anlatan masalsı bir kitap.",
    imageUrl:
      "https://images.unsplash.com/photo-1548170129-23f03b578c77?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "3",
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "4",
    title: "Renkleri Keşfeden Çocuk",
    author: "Deniz Yıldız",
    description:
      "Minik Ege'nin etrafındaki dünyadaki renkleri nasıl fark ettiğini ve onlarla oynadığını anlatır.",
    imageUrl:
      "https://images.unsplash.com/photo-1574676550739-9d903936695b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "4",
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "5",
    title: "Uzayda Bir Gün",
    author: "Ayşe Kaya",
    description:
      "Can ve arkadaşının roketle uzaya yaptığı heyecan verici yolculuk.",
    imageUrl:
      "https://images.unsplash.com/photo-1517430800346-ad591871a257?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "1",
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "6",
    title: "Orman Orkestrası",
    author: "Murat Bilgin",
    description:
      "Ormandaki hayvanların bir araya gelip nasıl harika bir müzik yaptığını gösterir.",
    imageUrl:
      "https://images.unsplash.com/photo-1627953258836-3982ed321e25?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "2",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "7",
    title: "Deniz Altı Macerası",
    author: "Zeynep Can",
    description:
      "Minik bir balığın okyanusun derinliklerindeki gizemleri keşfetmesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1507840742-9904ee227bf7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "3",
    createdAt: new Date("2024-02-25"),
  },
  {
    id: "8",
    title: "Gizemli Şato",
    author: "Emre Akın",
    description:
      "Üç arkadaşın eski bir şatoda karşılaştığı esrarengiz olayları çözmesi.",
    imageUrl:
      "https://images.unsplash.com/photo-1546410530-589578278297?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzh8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "4",
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "9",
    title: "Uçan Balonun Sırrı",
    author: "Pelin Öztürk",
    description:
      "Hayalleri olan bir çocuğun uçan balonuyla yaptığı fantastik yolculuk.",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "1",
    createdAt: new Date("2024-03-05"),
  },
  {
    id: "10",
    title: "Küçük Aşçı Mert",
    author: "Selin Yılmaz",
    description:
      "Yemek yapmayı seven küçük Mert'in annesine yaptığı sürprizler.",
    imageUrl:
      "https://images.unsplash.com/photo-1582239460012-1f48039396f4?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGNoaWxkcmVuJTIwYm9va3xlbnwwfHwwfHx8MA%3D%3D",
    addedBy: "2",
    createdAt: new Date("2024-03-10"),
  },
];

// Mock Comments
export let mockComments: Comment[] = [
  {
    id: "1",
    bookId: "1",
    userId: "2",
    userName: "Ayşe Demir",
    text: "Harika bir kitap, herkese tavsiye ederim!",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "2",
    bookId: "1",
    userId: "3",
    userName: "Mehmet Kaya",
    text: "Çok etkileyici bir hikaye.",
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "3",
    bookId: "5",
    userId: "4",
    userName: "Zeynep Öztürk",
    text: "Uzayı çok merak edenler için harika bir başlangıç kitabı!",
    createdAt: new Date("2024-02-16"),
  },
  {
    id: "4",
    bookId: "7",
    userId: "1",
    userName: "Ahmet Yılmaz",
    text: "Deniz altı canlılarını öğrenmek çok eğlenceliydi.",
    createdAt: new Date("2024-02-26"),
  },
];

// Mock Reading Statuses
export let mockReadingStatuses: ReadingStatus[] = [
  { bookId: "1", userId: "2", readAt: new Date("2024-01-16") },
  { bookId: "1", userId: "3", readAt: new Date("2024-01-17") },
  { bookId: "2", userId: "1", readAt: new Date("2024-01-21") },
  { bookId: "5", userId: "4", readAt: new Date("2024-02-16") },
  { bookId: "7", userId: "1", readAt: new Date("2024-02-26") },
  { bookId: "10", userId: "3", readAt: new Date("2024-03-11") },
];

// Mock Trade Requests
export let mockTradeRequests: TradeRequest[] = [
  {
    id: "1",
    bookId: "1",
    requestedBookId: "2",
    fromUserId: "3",
    toUserId: "1",
    status: "pending",
    createdAt: new Date("2024-02-05"),
  },
  {
    id: "2",
    bookId: "6",
    requestedBookId: "9",
    fromUserId: "4",
    toUserId: "2",
    status: "accepted",
    createdAt: new Date("2024-03-02"),
  },
];

// Helper functions to add data
export function addBook(book: Omit<Book, "id" | "createdAt">): Book {
  const newBook: Book = {
    ...book,
    id: Date.now().toString(),
    createdAt: new Date(),
  };
  mockBooks.push(newBook);
  return newBook;
}

export function addComment(
  comment: Omit<Comment, "id" | "createdAt">
): Comment {
  const newComment: Comment = {
    ...comment,
    id: Date.now().toString(),
    createdAt: new Date(),
  };
  mockComments.push(newComment);
  return newComment;
}

export function addReadingStatus(
  status: Omit<ReadingStatus, "readAt">
): ReadingStatus {
  const newStatus: ReadingStatus = {
    ...status,
    readAt: new Date(),
  };
  mockReadingStatuses.push(newStatus);
  return newStatus;
}

export function addTradeRequest(
  request: Omit<TradeRequest, "id" | "createdAt" | "status">
): TradeRequest {
  const newRequest: TradeRequest = {
    ...request,
    id: Date.now().toString(),
    status: "pending",
    createdAt: new Date(),
  };
  mockTradeRequests.push(newRequest);
  return newRequest;
}

export function updateTradeRequest(
  id: string,
  status: "accepted" | "rejected",
  selectedBookId?: string
): void {
  const request = mockTradeRequests.find((r) => r.id === id);
  if (request) {
    request.status = status;

    // If accepted, swap book owners
    // Use selectedBookId if provided, otherwise use the original requestedBookId
    if (status === "accepted") {
      const book1 = mockBooks.find((b) => b.id === request.bookId);
      const selectedBook = selectedBookId
        ? mockBooks.find((b) => b.id === selectedBookId)
        : mockBooks.find((b) => b.id === request.requestedBookId);

      if (book1 && selectedBook) {
        // Update the requestedBookId if a different book was selected
        if (selectedBookId && selectedBookId !== request.requestedBookId) {
          request.requestedBookId = selectedBookId;
        }
        const tempOwner = book1.addedBy;
        book1.addedBy = selectedBook.addedBy;
        selectedBook.addedBy = tempOwner;
      }
    }
  }
}

export function deleteBook(id: string): void {
  mockBooks = mockBooks.filter((b) => b.id !== id);
  mockComments = mockComments.filter((c) => c.bookId !== id);
  mockTradeRequests = mockTradeRequests.filter(
    (r) => r.bookId === id || r.requestedBookId === id
  );
  mockReadingStatuses = mockReadingStatuses.filter((r) => r.bookId !== id);
}

export function deleteComment(id: string): void {
  mockComments = mockComments.filter((c) => c.id !== id);
}
