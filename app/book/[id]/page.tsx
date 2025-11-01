"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getBookById,
  getComments,
  getReadingStatuses,
  getTradeRequests,
  addComment,
  addReadingStatus,
  addTradeRequest,
  getBooks,
  getUsers,
} from "@/lib/firestore";
import { getUser, isAuthenticated, isStudent } from "@/lib/auth";
import type { User } from "@/types";
import { Book, Comment, ReadingStatus, TradeRequest } from "@/types";
import {
  Check,
  MessageCircle,
  ArrowLeft,
  Users,
  Send,
  BookOpen,
  RefreshCw,
} from "lucide-react";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [readingStatuses, setReadingStatuses] = useState<ReadingStatus[]>([]);
  const [commentText, setCommentText] = useState("");
  const [hasRead, setHasRead] = useState(false);
  const [canRequestTrade, setCanRequestTrade] = useState(false);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [userBooks, setUserBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const [foundBook, commentsData, statusesData] = await Promise.all([
          getBookById(bookId),
          getComments(bookId),
          getReadingStatuses(bookId),
        ]);

        if (!foundBook) {
          router.push("/");
          return;
        }

        setBook(foundBook);
        setComments(commentsData);
        setReadingStatuses(statusesData);

        // Load all users
        const usersData = await getUsers();
        setAllUsers(usersData);

        const user = getUser();
        if (user) {
          const userHasRead = statusesData.some(
            (r) => r.bookId === bookId && r.userId === user.id
          );
          setHasRead(userHasRead);

          // Check if user can request trade (student, not own book, not already requested)
          if (isStudent() && foundBook.addedBy !== user.id) {
            const tradeRequestsData = await getTradeRequests(
              undefined,
              "pending"
            );
            const existingRequest = tradeRequestsData.find(
              (r) =>
                r.bookId === bookId &&
                r.fromUserId === user.id &&
                r.status === "pending"
            );
            setCanRequestTrade(!existingRequest);

            // Get user's books for trade dialog
            const allBooks = await getBooks();
            const myBooks = allBooks.filter((b) => b.addedBy === user.id);
            setUserBooks(myBooks);
            if (myBooks.length > 0) {
              setSelectedBookId(myBooks[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error loading book data:", error);
      }
    };

    loadData();
  }, [bookId, router]);

  const handleMarkAsRead = async () => {
    const user = getUser();
    if (!user || !book) return;

    if (!hasRead) {
      try {
        const newStatus = await addReadingStatus({
          bookId: book.id,
          userId: user.id,
        });
        setHasRead(true);
        setReadingStatuses([...readingStatuses, newStatus]);
      } catch (error) {
        console.error("Error adding reading status:", error);
      }
    }
  };

  const handleAddComment = async () => {
    const user = getUser();
    if (!user || !book || !commentText.trim()) return;

    try {
      const newComment = await addComment({
        bookId: book.id,
        userId: user.id,
        userName: user.name,
        text: commentText.trim(),
      });

      setComments([...comments, newComment]);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleRequestTrade = async () => {
    if (!selectedBookId) {
      alert("Lütfen takas etmek istediğiniz kitabı seçin");
      return;
    }

    const user = getUser();
    if (!user || !book || !isStudent()) return;

    try {
      await addTradeRequest({
        bookId: book.id,
        requestedBookId: selectedBookId,
        fromUserId: user.id,
        toUserId: book.addedBy,
      });

      setCanRequestTrade(false);
      setTradeDialogOpen(false);
      alert("Takas isteği gönderildi!");
    } catch (error) {
      console.error("Error requesting trade:", error);
      alert("Takas isteği gönderilirken bir hata oluştu");
    }
  };

  if (!book) {
    return null;
  }

  const readers = readingStatuses
    .map((status) => {
      const user = allUsers.find((u) => u.id === status.userId);
      return user;
    })
    .filter(Boolean);

  const currentUser = getUser();
  const isOwnBook = currentUser?.id === book.addedBy;

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 gap-2 hover:bg-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Book Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Book Card - Modern Design */}
          <Card className="overflow-hidden border-2 shadow-lg">
            <div className="relative bg-gradient-to-br from-[#2ecc71]/10 via-white to-[#3498db]/10 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative h-80 w-56 mx-auto md:mx-0 shrink-0 overflow-hidden rounded-2xl shadow-xl border-4 border-white">
                  <Image
                    src={book.imageUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <CardTitle className="mb-3 text-4xl font-bold text-gray-800">
                    {book.title}
                  </CardTitle>
                  <p className="mb-4 text-xl text-gray-600 font-medium">
                    {book.author}
                  </p>

                  {/* Genre Badge */}
                  {book.genre && (
                    <div className="mb-3">
                      <Badge
                        variant="secondary"
                        className="bg-[#3498db]/10 text-[#3498db] border border-[#3498db]/20 px-3 py-1 text-sm font-medium"
                      >
                        {book.genre}
                      </Badge>
                    </div>
                  )}

                  {/* Book Owner */}
                  {(() => {
                    const owner = allUsers.find((u) => u.id === book.addedBy);
                    return owner ? (
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm text-gray-600">Sahibi:</span>
                        <Badge
                          variant="outline"
                          className="bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/30 px-3 py-1 text-sm font-medium"
                        >
                          <Users className="h-3 w-3 mr-1 inline" />
                          {owner.name}
                        </Badge>
                      </div>
                    ) : null;
                  })()}

                  <p className="text-gray-700 leading-relaxed">
                    {book.description}
                  </p>

                  {/* Action Buttons - Integrated into card */}
                  {isStudent() && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {!hasRead && (
                        <Button
                          onClick={handleMarkAsRead}
                          className="bg-[#2ecc71] hover:bg-[#27ae60] text-white h-12 px-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          <Check className="mr-2 h-5 w-5" />
                          Bu Kitabı Okudum
                        </Button>
                      )}
                      {hasRead && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#2ecc71]/10 rounded-lg border border-[#2ecc71]">
                          <Check className="h-5 w-5 text-[#2ecc71]" />
                          <span className="text-[#2ecc71] font-semibold">
                            Okundu
                          </span>
                        </div>
                      )}

                      {canRequestTrade && (
                        <Dialog
                          open={tradeDialogOpen}
                          onOpenChange={setTradeDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-[#3498db] text-[#3498db] hover:bg-[#3498db] hover:text-white h-12 px-6 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              <RefreshCw className="mr-2 h-5 w-5" />
                              Takas Et
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">
                                Takas Yap
                              </DialogTitle>
                              <DialogDescription>
                                Takas yapmak istediğiniz kitabınızı seçin
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {userBooks.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                  Takas yapabilmek için en az bir kitap eklemiş
                                  olmalısınız
                                </p>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                    {userBooks.map((userBook) => (
                                      <div
                                        key={userBook.id}
                                        onClick={() =>
                                          setSelectedBookId(userBook.id)
                                        }
                                        className={`relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all border-4 ${
                                          selectedBookId === userBook.id
                                            ? "border-[#2ecc71] ring-4 ring-[#2ecc71]/20 scale-105"
                                            : "border-gray-200 hover:border-[#3498db]"
                                        }`}
                                      >
                                        <Image
                                          src={userBook.imageUrl}
                                          alt={userBook.title}
                                          fill
                                          className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                          <p className="text-white font-bold text-sm drop-shadow-lg">
                                            {userBook.title}
                                          </p>
                                        </div>
                                        {selectedBookId === userBook.id && (
                                          <div className="absolute top-2 right-2">
                                            <div className="bg-[#2ecc71] rounded-full p-1.5">
                                              <Check className="h-4 w-4 text-white" />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                      variant="outline"
                                      onClick={() => setTradeDialogOpen(false)}
                                      className="flex-1"
                                    >
                                      İptal
                                    </Button>
                                    <Button
                                      onClick={handleRequestTrade}
                                      className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60]"
                                    >
                                      Takas İsteği Gönder
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {!canRequestTrade && !isOwnBook && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                          <span className="text-sm text-gray-600">
                            {hasRead
                              ? "Bu kitabı okudunuz"
                              : "Takas isteği gönderildi"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Reading Status Section - Modern Design */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#3498db]/10 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-[#3498db]" />
                Bu Kitabı Okuyanlar ({readers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {readers.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz kimse okumamış</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {readers.map((reader) => (
                    <Badge
                      key={reader.id}
                      variant="secondary"
                      className="bg-[#3498db]/10 text-[#3498db] border border-[#3498db]/20 px-4 py-2 text-sm font-medium"
                    >
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarFallback className="text-xs bg-[#3498db] text-white">
                          {reader.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {reader.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section - Modern Design */}
          <Card className="shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#2ecc71]/10 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageCircle className="h-6 w-6 text-[#2ecc71]" />
                Yorumlar ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Henüz yorum yok</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-[#2ecc71] to-[#3498db] text-white font-semibold">
                        {comment.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "tr-TR"
                          )}
                        </span>
                      </div>
                      <div className="text-gray-700">{comment.text}</div>
                    </div>
                  </div>
                ))
              )}

              {isStudent() && (
                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Yorumunuzu yazın..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                    className="flex-1 h-12 rounded-lg border-gray-300 focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20"
                  />
                  <Button
                    onClick={handleAddComment}
                    className="bg-[#2ecc71] hover:bg-[#27ae60] h-12 px-6 shadow-md hover:shadow-lg transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
