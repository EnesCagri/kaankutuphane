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
  getClassrooms,
  getClassroomById,
  getTradeRequests,
  getUserById,
} from "@/lib/firestore";
import {
  getUser,
  isAuthenticated,
  isTeacher,
  deleteRegisteredUser,
} from "@/lib/auth";
import { Book, Comment, User, Classroom } from "@/types";
import {
  Trash2,
  Shield,
  Users,
  BookOpen,
  MessageSquare,
  Plus,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";

export default function TeacherPanelPage() {
  const router = useRouter();
  const [user, setUser] = useState(getUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [readingStatuses, setReadingStatuses] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    if (!isAuthenticated() || !isTeacher()) {
      router.push("/login");
      return;
    }

    if (!user) return;

    setIsRefreshing(true);
    try {
      // Get updated user data from Firestore to ensure classroomIds is current
      const updatedUser = await getUserById(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("kutupweb_user", JSON.stringify(updatedUser));
        }
      }

      // Get teacher's classrooms
      const teacherClassrooms = await getClassrooms(user.id);
      setClassrooms(teacherClassrooms);

      // Get classroom IDs for filtering (use updated user data)
      const currentUser = updatedUser || user;
      const classroomIds = currentUser.classroomIds || [];

      // Load all data
      const [
        booksData,
        commentsData,
        usersData,
        readingStatusesData,
        tradeRequestsData,
      ] = await Promise.all([
        getBooks(),
        getComments(),
        classroomIds.length > 0 ? getUsers(classroomIds) : getUsers(),
        getReadingStatuses(),
        getTradeRequests(),
      ]);

      setBooks(booksData);
      setComments(commentsData);
      setAllUsers(usersData);

      // Filter students by teacher's classrooms
      const teacherStudents = usersData.filter(
        (u) =>
          u.role === "student" &&
          u.classroomId &&
          classroomIds.includes(u.classroomId)
      );
      setStudents(teacherStudents);
      setReadingStatuses(readingStatusesData);

      // Filter trade requests by students in teacher's classrooms
      const studentIds = teacherStudents.map((s) => s.id);
      const filteredTradeRequests = tradeRequestsData.filter(
        (tr) =>
          studentIds.includes(tr.fromUserId) || studentIds.includes(tr.toUserId)
      );
      setTradeRequests(filteredTradeRequests);
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router, user?.id]);

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

  // Filter data by selected classroom
  const filteredStudents = selectedClassroomId
    ? students.filter((s) => s.classroomId === selectedClassroomId)
    : students;

  // Filter books by students in teacher's classrooms
  const studentIds = filteredStudents.map((s) => s.id);
  const filteredBooks = books.filter((b) => studentIds.includes(b.addedBy));

  // Filter comments by students in teacher's classrooms
  const filteredComments = comments.filter((c) =>
    studentIds.includes(c.userId)
  );

  // Filter trade requests by students in teacher's classrooms
  const filteredTradeRequests = tradeRequests.filter(
    (tr) =>
      studentIds.includes(tr.fromUserId) || studentIds.includes(tr.toUserId)
  );

  // Get classroom name for a student
  const getClassroomName = async (classroomId?: string): Promise<string> => {
    if (!classroomId) return "-";
    const classroom = await getClassroomById(classroomId);
    return classroom ? `${classroom.grade}${classroom.className}` : "-";
  };

  if (!user) return null;

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#2ecc71]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Öğretmen Paneli
            </h1>
            <p className="text-gray-600">
              Sınıflarınızdaki öğrencileri, kitapları ve yorumları yönetin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Yenile
          </Button>
          <Link
            href="/teacher/create-classroom"
            className="flex items-center gap-2 px-4 py-2 bg-[#2ecc71] text-white rounded-lg hover:bg-[#27ae60] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Sınıf Oluştur
          </Link>
        </div>
      </div>

      {classrooms.length > 0 && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Sınıf Filtresi:
          </label>
          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ecc71]"
          >
            <option value="">Tüm Sınıflar</option>
            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.grade}
                {classroom.className}
              </option>
            ))}
          </select>
        </div>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Öğrenciler ({filteredStudents.length})
          </TabsTrigger>
          <TabsTrigger value="books">
            <BookOpen className="h-4 w-4 mr-2" />
            Kitaplar ({filteredBooks.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Yorumlar ({filteredComments.length})
          </TabsTrigger>
          <TabsTrigger value="trades">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Takaslar ({filteredTradeRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Öğrencilerim</CardTitle>
              <CardDescription>
                Toplam {filteredStudents.length} öğrenci
                {selectedClassroomId
                  ? ` (${
                      classrooms.find((c) => c.id === selectedClassroomId)
                        ?.grade
                    }${
                      classrooms.find((c) => c.id === selectedClassroomId)
                        ?.className
                    } sınıfı)`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {classrooms.length === 0
                    ? "Henüz sınıf oluşturmadınız. Önce bir sınıf oluşturun."
                    : "Bu sınıfta henüz öğrenci yok"}
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
                        <th className="text-center p-3 font-semibold">Sınıf</th>
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
                      {filteredStudents.map((userItem) => {
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
                              {userItem.classroomId ? (
                                (() => {
                                  const classroom = classrooms.find(
                                    (c) => c.id === userItem.classroomId
                                  );
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="bg-[#3498db]/10 text-[#3498db] border-[#3498db]"
                                    >
                                      {classroom
                                        ? `${classroom.grade}${classroom.className}`
                                        : "-"}
                                    </Badge>
                                  );
                                })()
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
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
                Toplam {filteredBooks.length} kitap mevcut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBooks.length === 0 ? (
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
                      {filteredBooks.map((book) => {
                        const addedBy =
                          filteredStudents.find((u) => u.id === book.addedBy) ||
                          allUsers.find((u) => u.id === book.addedBy);
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
                Toplam {filteredComments.length} yorum mevcut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredComments.length === 0 ? (
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
                      {filteredComments.map((comment) => {
                        const book = filteredBooks.find(
                          (b) => b.id === comment.bookId
                        );
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

        {/* Trade Requests Tab */}
        <TabsContent value="trades" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Takas İstekleri</CardTitle>
              <CardDescription>
                Toplam {filteredTradeRequests.length} takas isteği mevcut
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTradeRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Henüz takas isteği yok
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">İsteyen</th>
                        <th className="text-left p-3 font-semibold">
                          İstenen Kitap
                        </th>
                        <th className="text-left p-3 font-semibold">
                          Karşılık Kitap
                        </th>
                        <th className="text-center p-3 font-semibold">Durum</th>
                        <th className="text-left p-3 font-semibold">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTradeRequests.map((request) => {
                        const fromUser = allUsers.find(
                          (u) => u.id === request.fromUserId
                        );
                        const toUser = allUsers.find(
                          (u) => u.id === request.toUserId
                        );
                        const requestedBook = books.find(
                          (b) => b.id === request.requestedBookId
                        );
                        const offeredBook = books.find(
                          (b) => b.id === request.bookId
                        );
                        return (
                          <tr
                            key={request.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              {fromUser?.name || "Bilinmeyen"}
                            </td>
                            <td className="p-3">
                              {requestedBook ? (
                                <Badge variant="outline">
                                  {requestedBook.title}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">
                                  Silinmiş kitap
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {offeredBook ? (
                                <Badge variant="outline">
                                  {offeredBook.title}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">
                                  Silinmiş kitap
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant={
                                  request.status === "accepted"
                                    ? "default"
                                    : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className={
                                  request.status === "accepted"
                                    ? "bg-[#2ecc71] text-white"
                                    : request.status === "rejected"
                                    ? "bg-red-500 text-white"
                                    : "bg-yellow-500 text-white"
                                }
                              >
                                {request.status === "accepted"
                                  ? "Kabul Edildi"
                                  : request.status === "rejected"
                                  ? "Reddedildi"
                                  : "Beklemede"}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-500 text-sm">
                              {new Date(request.createdAt).toLocaleDateString(
                                "tr-TR"
                              )}
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
