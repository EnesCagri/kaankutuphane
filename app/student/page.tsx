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
} from "@/lib/firestore";
import { getUser, isAuthenticated, isStudent } from "@/lib/auth";
import { Book, TradeRequest } from "@/types";
import { Check, X, BookOpen, BookMarked, MessageSquare } from "lucide-react";

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

        // Get user's books
        const books = booksData.filter((b) => b.addedBy === user.id);
        setMyBooks(books);

        // Get read books - books that user has marked as read
        // These should remain in the list even after trade (bookId-based)
        const readBookIds = readingStatusesData
          .filter((r) => r.userId === user.id)
          .map((r) => r.bookId);
        // Get all books that user has read, regardless of current owner
        const readBooks = booksData.filter((b) => readBookIds.includes(b.id));
        setReadBooks(readBooks);

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

  if (!user) return null;

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {user.name} - Profilim
        </h1>
      </div>

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
