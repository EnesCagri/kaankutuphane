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
  getBooks,
  getComments,
  getReadingStatuses,
  deleteBook,
  deleteComment,
  getUsers,
  deleteUser,
  deleteReadingStatusesByUserId,
} from "@/lib/firestore";
import {
  getUser,
  isAuthenticated,
  isTeacher,
  deleteRegisteredUser,
} from "@/lib/auth";
import { Book, Comment, User } from "@/types";
import { Trash2, Shield, Users, BookOpen, MessageSquare } from "lucide-react";

export default function TeacherPanelPage() {
  const router = useRouter();
  const [user, setUser] = useState(getUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [readingStatuses, setReadingStatuses] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated() || !isTeacher()) {
        router.push("/login");
        return;
      }

      try {
        const [booksData, commentsData, usersData, readingStatusesData] =
          await Promise.all([
            getBooks(),
            getComments(),
            getUsers(),
            getReadingStatuses(),
          ]);

        setBooks(booksData);
        setComments(commentsData);
        setAllUsers(usersData);
        setReadingStatuses(readingStatusesData);
        setStudents(usersData.filter((u) => u.role === "student"));
      } catch (error) {
        console.error("Error loading teacher data:", error);
      }
    };

    loadData();
  }, [router]);

  const handleDeleteBook = async (bookId: string) => {
    if (confirm("Bu kitabı silmek istediğinize emin misiniz?")) {
      try {
        await deleteBook(bookId);
        const [booksData, commentsData] = await Promise.all([
          getBooks(),
          getComments(),
        ]);
        setBooks(booksData);
        setComments(commentsData);
      } catch (error) {
        console.error("Error deleting book:", error);
        alert("Kitap silinirken bir hata oluştu");
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Bu yorumu silmek istediğinize emin misiniz?")) {
      try {
        await deleteComment(commentId);
        const commentsData = await getComments();
        setComments(commentsData);
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Yorum silinirken bir hata oluştu");
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Prevent self-deletion
    if (user && userId === user.id) {
      alert("Kendi hesabınızı silemezsiniz!");
      return;
    }

    const userToDelete = allUsers.find((u) => u.id === userId);
    if (!userToDelete) return;

    const roleText = userToDelete.role === "teacher" ? "öğretmen" : "öğrenci";

    if (
      confirm(
        `Bu ${roleText}yi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm kitapları ve yorumları da silinecektir!`
      )
    ) {
      try {
        // Check if it's a mock user
        const isMockUser = ["1", "2", "3", "4", "teacher1"].includes(userId);
        if (isMockUser) {
          alert(
            "Mock kullanıcılar silinemez. Sadece kayıt olan kullanıcılar silinebilir."
          );
          return;
        }

        // Delete the user from Firestore
        const deleteSuccess = await deleteRegisteredUser(userId);
        if (!deleteSuccess) {
          alert("Kullanıcı silinirken bir hata oluştu");
          return;
        }

        // Delete books added by this user
        const allBooks = await getBooks();
        const booksToDelete = allBooks.filter((b) => b.addedBy === userId);
        await Promise.all(booksToDelete.map((book) => deleteBook(book.id)));

        // Delete comments by this user
        const allComments = await getComments();
        const commentsToDelete = allComments.filter((c) => c.userId === userId);
        await Promise.all(
          commentsToDelete.map((comment) => deleteComment(comment.id))
        );

        // Delete reading statuses by this user
        await deleteReadingStatusesByUserId(userId);

        // Refresh data
        const [booksData, commentsData, usersData, readingStatusesData] =
          await Promise.all([
            getBooks(),
            getComments(),
            getUsers(),
            getReadingStatuses(),
          ]);
        setAllUsers(usersData);
        setStudents(usersData.filter((u) => u.role === "student"));
        setBooks(booksData);
        setComments(commentsData);
        setReadingStatuses(readingStatusesData);
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Kullanıcı silinirken bir hata oluştu");
      }
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-[#2ecc71]" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Öğretmen Paneli</h1>
          <p className="text-gray-600">
            Tüm kullanıcıları, kitapları ve yorumları yönetin
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Tüm Kullanıcılar ({allUsers.length})
          </TabsTrigger>
          <TabsTrigger value="books">
            <BookOpen className="h-4 w-4 mr-2" />
            Kitaplar ({books.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Yorumlar ({comments.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Kullanıcılar</CardTitle>
              <CardDescription>
                Toplam {allUsers.length} kullanıcı kayıtlı ({students.length}{" "}
                öğrenci, {allUsers.length - students.length} öğretmen)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Henüz kullanıcı kayıtlı değil
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">
                          Ad Soyad
                        </th>
                        <th className="text-left p-3 font-semibold">
                          Kullanıcı Adı
                        </th>
                        <th className="text-center p-3 font-semibold">Rol</th>
                        <th className="text-center p-3 font-semibold">
                          Eklediği Kitap
                        </th>
                        <th className="text-center p-3 font-semibold">
                          Okuduğu Kitap
                        </th>
                        <th className="text-center p-3 font-semibold">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((userItem) => {
                        const addedBooks = books.filter(
                          (b) => b.addedBy === userItem.id
                        );
                        const userReadingStatuses = readingStatuses.filter(
                          (r) => r.userId === userItem.id
                        );
                        const readBookIds = userReadingStatuses.map(
                          (r) => r.bookId
                        );
                        const readBooks = books.filter((b) =>
                          readBookIds.includes(b.id)
                        );
                        const isCurrentUser = user && userItem.id === user.id;
                        // Mock users have simple IDs like "1", "2", "teacher1"
                        // Firebase users have longer, more complex IDs
                        const isMockUser = [
                          "1",
                          "2",
                          "3",
                          "4",
                          "teacher1",
                        ].includes(userItem.id);
                        const canDelete = !isMockUser && !isCurrentUser;
                        return (
                          <tr
                            key={userItem.id}
                            className={`border-b hover:bg-gray-50 ${
                              isCurrentUser ? "bg-green-50" : ""
                            }`}
                          >
                            <td className="p-3">
                              {userItem.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Siz)
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-gray-600">
                              {userItem.username}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={
                                  userItem.role === "teacher"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  userItem.role === "teacher"
                                    ? "bg-[#2ecc71] text-white"
                                    : "bg-[#3498db]/10 text-[#3498db]"
                                }
                              >
                                {userItem.role === "teacher"
                                  ? "Öğretmen"
                                  : "Öğrenci"}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant="secondary"
                                className="bg-[#2ecc71]/10 text-[#2ecc71]"
                              >
                                {addedBooks.length}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant="secondary"
                                className="bg-[#3498db]/10 text-[#3498db]"
                              >
                                {readBooks.length}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(userItem.id)}
                                disabled={!canDelete}
                                title={
                                  isCurrentUser
                                    ? "Kendi hesabınızı silemezsiniz"
                                    : isMockUser
                                    ? "Mock kullanıcılar silinemez"
                                    : "Kullanıcıyı sil"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Books Tab */}
        <TabsContent value="books" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Kitap Listesi</CardTitle>
              <CardDescription>
                Toplam {books.length} kitap mevcut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {books.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Henüz kitap eklenmemiş
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">
                          Kitap Adı
                        </th>
                        <th className="text-left p-3 font-semibold">Yazar</th>
                        <th className="text-left p-3 font-semibold">Ekleyen</th>
                        <th className="text-left p-3 font-semibold">Tarih</th>
                        <th className="text-center p-3 font-semibold">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => {
                        const addedBy = allUsers.find(
                          (u) => u.id === book.addedBy
                        );
                        return (
                          <tr
                            key={book.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3 font-medium">{book.title}</td>
                            <td className="p-3 text-gray-600">{book.author}</td>
                            <td className="p-3">
                              {addedBy?.name || "Bilinmeyen"}
                            </td>
                            <td className="p-3 text-gray-500 text-sm">
                              {new Date(book.createdAt).toLocaleDateString(
                                "tr-TR"
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteBook(book.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Yorum Listesi</CardTitle>
              <CardDescription>
                Toplam {comments.length} yorum mevcut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Henüz yorum yapılmamış
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Yorum</th>
                        <th className="text-left p-3 font-semibold">Kitap</th>
                        <th className="text-left p-3 font-semibold">Yazan</th>
                        <th className="text-left p-3 font-semibold">Tarih</th>
                        <th className="text-center p-3 font-semibold">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map((comment) => {
                        const book = books.find((b) => b.id === comment.bookId);
                        return (
                          <tr
                            key={comment.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3 max-w-md">{comment.text}</td>
                            <td className="p-3 text-gray-600">
                              {book ? (
                                <Badge variant="outline">{book.title}</Badge>
                              ) : (
                                <span className="text-gray-400">
                                  Silinmiş kitap
                                </span>
                              )}
                            </td>
                            <td className="p-3">{comment.userName}</td>
                            <td className="p-3 text-gray-500 text-sm">
                              {new Date(comment.createdAt).toLocaleDateString(
                                "tr-TR"
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
