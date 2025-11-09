"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookCard } from "@/components/BookCard";
import {
  getBooks,
  getTradeRequests,
  getReadingStatuses,
  updateTradeRequest,
  getUsers,
  updateUser,
  getUserById,
  getClassroomById,
} from "@/lib/firestore";
import { getUser, isAuthenticated, isStudent } from "@/lib/auth";
import { Book, TradeRequest } from "@/types";
import {
  Check,
  X,
  BookOpen,
  BookMarked,
  MessageSquare,
  Camera,
  Trophy,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRef } from "react";

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(getUser());
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [readBooks, setReadBooks] = useState<Book[]>([]);
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Record<string, string>>(
    {}
  );
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [allReadingStatuses, setAllReadingStatuses] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [readCount, setReadCount] = useState(0);
  const [classroomName, setClassroomName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated() || !isStudent()) {
        router.push("/login");
        return;
      }

      if (!user) return;

      try {
        const [booksData, readingStatusesData, usersData] = await Promise.all([
          getBooks(),
          getReadingStatuses(),
          getUsers(),
        ]);

        setAllBooks(booksData);
        setAllReadingStatuses(readingStatusesData);
        setAllUsers(usersData);

        // Get updated user data with avatar
        const updatedUser = await getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          // Update localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("kutupweb_user", JSON.stringify(updatedUser));
          }

          // Get classroom name
          if (updatedUser.classroomId) {
            const classroom = await getClassroomById(updatedUser.classroomId);
            if (classroom) {
              setClassroomName(`${classroom.grade}${classroom.className}`);
            }
          }
        }

        // Get user's books
        const books = booksData.filter((b) => b.addedBy === user.id);
        setMyBooks(books);

        // Get read books - books that user has marked as read
        // These should remain in the list even after trade (bookId-based)
        const userReadBookIds = readingStatusesData
          .filter((r) => r.userId === user.id)
          .map((r) => r.bookId);

        // Calculate read count
        const count = userReadBookIds.length;
        setReadCount(count);

        // Get all books that user has read, regardless of current owner
        const readBooks = booksData.filter((b) =>
          userReadBookIds.includes(b.id)
        );
        setReadBooks(readBooks);

        // Calculate leaderboard rank
        const userReadCounts = new Map<string, number>();
        readingStatusesData.forEach((status) => {
          const currentCount = userReadCounts.get(status.userId) || 0;
          userReadCounts.set(status.userId, currentCount + 1);
        });

        const leaderboardData = usersData
          .map((u) => ({
            user: u,
            readCount: userReadCounts.get(u.id) || 0,
          }))
          .filter((item) => item.readCount > 0)
          .sort((a, b) => b.readCount - a.readCount);

        const rankIndex = leaderboardData.findIndex(
          (item) => item.user.id === user.id
        );
        setLeaderboardRank(rankIndex >= 0 ? rankIndex + 1 : null);

        // Get trade requests for this user
        const requests = await getTradeRequests(user.id, "pending");
        setTradeRequests(requests);

        // Initialize selected books with requested books
        const initialSelectedBooks: Record<string, string> = {};
        requests.forEach((request) => {
          if (request.requestedBookId) {
            initialSelectedBooks[request.id] = request.requestedBookId;
          }
        });
        setSelectedBooks(initialSelectedBooks);
      } catch (error) {
        console.error("Error loading student data:", error);
      }
    };

    loadData();
  }, [router, user]);

  const handleTradeRequest = async (
    requestId: string,
    status: "accepted" | "rejected",
    selectedBookId?: string
  ) => {
    try {
      const success = await updateTradeRequest(
        requestId,
        status,
        selectedBookId
      );
      if (!success) {
        alert("Takas işlemi sırasında bir hata oluştu");
        return;
      }

      setTradeRequests((prev) => prev.filter((r) => r.id !== requestId));
      // Remove from selectedBooks state
      setSelectedBooks((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });

      // Refresh all data after trade
      if (user) {
        const [booksData, readingStatusesData] = await Promise.all([
          getBooks(),
          getReadingStatuses(),
        ]);

        setAllBooks(booksData);
        setAllReadingStatuses(readingStatusesData);

        // Update my books (books owned by user)
        const books = booksData.filter((b) => b.addedBy === user.id);
        setMyBooks(books);

        // Update read books (books user has marked as read, regardless of current owner)
        // Reading statuses persist even after trade - these are bookId-based, not owner-based
        const readBookIds = readingStatusesData
          .filter((r) => r.userId === user.id)
          .map((r) => r.bookId);
        const readBooks = booksData.filter((b) => readBookIds.includes(b.id));
        setReadBooks(readBooks);

        if (status === "accepted") {
          alert("Takas başarıyla tamamlandı! Kitaplar değiş tokuş edildi.");
        }
      }
    } catch (error) {
      console.error("Error updating trade request:", error);
      alert("İşlem sırasında bir hata oluştu");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir görsel dosyası seçin");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Görsel boyutu 2MB'dan küçük olmalıdır");
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      const success = await updateUser(user!.id, { avatarUrl: base64 });

      if (success) {
        // Update local user state
        const updatedUser = { ...user!, avatarUrl: base64 };
        setUser(updatedUser);

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("kutupweb_user", JSON.stringify(updatedUser));
        }

        alert("Profil fotoğrafı güncellendi!");
      } else {
        alert("Profil fotoğrafı güncellenirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Görsel yüklenirken bir hata oluştu");
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8 bg-gradient-to-br from-[#2ecc71]/10 to-[#3498db]/10 border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#2ecc71] text-white rounded-full p-2 shadow-lg hover:bg-[#27ae60] transition-all opacity-0 group-hover:opacity-100"
                title="Fotoğraf değiştir"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {user.name}
              </h1>
              <p className="text-gray-600 mb-2">@{user.username}</p>
              {classroomName && (
                <p className="text-sm text-gray-500 mb-4">
                  Sınıf: <span className="font-semibold">{classroomName}</span>
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <BookOpen className="h-5 w-5 text-[#3498db]" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {readCount}
                    </div>
                    <div className="text-xs text-gray-600">Okunan Kitap</div>
                  </div>
                </div>

                {leaderboardRank !== null && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold text-gray-800">
                        #{leaderboardRank}
                      </div>
                      <div className="text-xs text-gray-600">
                        Liderlik Sırası
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <BookMarked className="h-5 w-5 text-[#2ecc71]" />
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {myBooks.length}
                    </div>
                    <div className="text-xs text-gray-600">Eklenen Kitap</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my-books" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="my-books">Kitaplarım</TabsTrigger>
          <TabsTrigger value="read-books">Okuduklarım</TabsTrigger>
          <TabsTrigger value="trade-requests">Takas İstekleri</TabsTrigger>
        </TabsList>

        <TabsContent value="my-books" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-[#2ecc71]" />
            <h2 className="text-xl font-semibold">
              Eklediğim Kitaplar ({myBooks.length})
            </h2>
          </div>
          {myBooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Henüz kitap eklemediniz
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {myBooks.map((book) => {
                const isRead = allReadingStatuses.some(
                  (status) =>
                    status.bookId === book.id && status.userId === user.id
                );
                return <BookCard key={book.id} book={book} isRead={isRead} />;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="read-books" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#3498db]" />
            <h2 className="text-xl font-semibold">
              Okuduğum Kitaplar ({readBooks.length})
            </h2>
          </div>
          {readBooks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Henüz hiçbir kitap okumadınız
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {readBooks.map((book) => (
                <BookCard key={book.id} book={book} isRead={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trade-requests" className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#3498db]" />
            <h2 className="text-xl font-semibold">
              Takas İstekleri ({tradeRequests.length})
            </h2>
          </div>
          {tradeRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Bekleyen takas isteği yok
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tradeRequests.map((request) => {
                const requestedBook = allBooks.find(
                  (b) => b.id === request.requestedBookId
                );
                const myBook = myBooks.find((b) => b.id === request.bookId);
                const fromUser = allUsers.find(
                  (u) => u.id === request.fromUserId
                );

                // Get all books from the requester (fromUserId)
                const requesterBooks = allBooks.filter(
                  (b) => b.addedBy === request.fromUserId
                );

                if (!requestedBook || !myBook || !fromUser) return null;

                // Get default selected book (prefer stored, then requested, then first available)
                const defaultSelectedBookId =
                  selectedBooks[request.id] ||
                  request.requestedBookId ||
                  requesterBooks[0]?.id ||
                  "";

                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle>Takas İsteği</CardTitle>
                      <CardDescription>
                        {new Date(request.createdAt).toLocaleDateString(
                          "tr-TR"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-4">
                          <strong>İsteyen:</strong> {fromUser.name}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              Sizin Kitabınız:
                            </Label>
                            <Badge
                              variant="outline"
                              className="w-full justify-start p-2 h-auto text-sm"
                            >
                              {myBook.title}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              Karşılık Olarak Seçeceğiniz Kitap:
                            </Label>
                            {requesterBooks.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">
                                {fromUser.name}'ın kitapları bulunamadı
                              </p>
                            ) : (
                              <Select
                                value={
                                  selectedBooks[request.id] ||
                                  defaultSelectedBookId
                                }
                                onValueChange={(value) => {
                                  setSelectedBooks((prev) => ({
                                    ...prev,
                                    [request.id]: value,
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-full h-auto min-h-[40px]">
                                  <SelectValue placeholder="Kitap seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                  {requesterBooks.map((book) => (
                                    <SelectItem key={book.id} value={book.id}>
                                      {book.title} - {book.author}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                        {request.requestedBookId !==
                          selectedBooks[request.id] &&
                          selectedBooks[request.id] && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              * İstek eden kişi "{requestedBook.title}" kitabını
                              önermişti, ancak siz başka bir kitap
                              seçebilirsiniz.
                            </p>
                          )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const bookToAccept =
                              selectedBooks[request.id] ||
                              request.requestedBookId;
                            if (!bookToAccept && requesterBooks.length > 0) {
                              alert(
                                "Lütfen karşılık olarak almak istediğiniz kitabı seçin"
                              );
                              return;
                            }
                            handleTradeRequest(
                              request.id,
                              "accepted",
                              bookToAccept
                            );
                          }}
                          className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60]"
                          disabled={requesterBooks.length === 0}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Kabul Et
                        </Button>
                        <Button
                          onClick={() =>
                            handleTradeRequest(request.id, "rejected")
                          }
                          variant="destructive"
                          className="flex-1"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reddet
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
