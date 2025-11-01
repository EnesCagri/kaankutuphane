"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAuthenticated, getUser } from "@/lib/auth";
import { getBooks, getReadingStatuses } from "@/lib/firestore";
import { Book, ReadingStatus } from "@/types";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";

const BOOK_GENRES = [
  "Tümü",
  "Roman",
  "Masal",
  "Hikaye",
  "Bilim Kurgu",
  "Macera",
  "Fantastik",
  "Tarihi",
  "Eğitim",
  "Çocuk",
  "Diğer",
];

export default function HomePage() {
  const router = useRouter();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [readingStatuses, setReadingStatuses] = useState<ReadingStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("Tümü");
  const [readFilter, setReadFilter] = useState<string>("Tümü"); // Tümü, Okunanlar, Okunmayanlar
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const [booksData, statusesData] = await Promise.all([
          getBooks(),
          getReadingStatuses(),
        ]);
        setAllBooks(booksData);
        setReadingStatuses(statusesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Filter and sort books
  useEffect(() => {
    const user = getUser();
    let filtered = [...allBooks];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Genre filter
    if (selectedGenre !== "Tümü") {
      filtered = filtered.filter(
        (book) =>
          book.genre === selectedGenre ||
          (!book.genre && selectedGenre === "Diğer")
      );
    }

    // Read status filter
    if (readFilter !== "Tümü" && user) {
      const userReadBookIds = readingStatuses
        .filter((status) => status.userId === user.id)
        .map((status) => status.bookId);

      if (readFilter === "Okunanlar") {
        filtered = filtered.filter((book) => userReadBookIds.includes(book.id));
      } else if (readFilter === "Okunmayanlar") {
        filtered = filtered.filter(
          (book) => !userReadBookIds.includes(book.id)
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = a.createdAt.getTime();
      const dateB = b.createdAt.getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setBooks(filtered);
  }, [
    allBooks,
    searchQuery,
    selectedGenre,
    readFilter,
    sortOrder,
    readingStatuses,
  ]);

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      {/* Modern Header with Gradient */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-[#2ecc71]/10 via-[#3498db]/10 to-[#2ecc71]/10 rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h1 className="mb-2 text-4xl font-bold bg-gradient-to-r from-[#2ecc71] to-[#3498db] bg-clip-text text-transparent">
            Kütüphanemizdeki Kitaplar
          </h1>
          <p className="text-gray-600 mb-4">
            Kitapları keşfedin, okuyun ve takas yapın
          </p>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Kitap adı veya yazar ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-xl border-gray-300 pl-12 pr-4 text-base shadow-md focus:shadow-lg focus:border-[#2ecc71] focus:ring-2 focus:ring-[#2ecc71]/20 transition-all"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Filtrele:
                </span>
              </div>

              {/* Genre Filter */}
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[140px] h-10 bg-white border-gray-300">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Read Status Filter */}
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-white border-gray-300">
                  <SelectValue placeholder="Okuma Durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tümü">Tümü</SelectItem>
                  <SelectItem value="Okunanlar">Okunanlar</SelectItem>
                  <SelectItem value="Okunmayanlar">Okunmayanlar</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <div className="flex items-center gap-2">
                {sortOrder === "newest" ? (
                  <SortDesc className="h-5 w-5 text-gray-500" />
                ) : (
                  <SortAsc className="h-5 w-5 text-gray-500" />
                )}
                <Select
                  value={sortOrder}
                  onValueChange={(value) =>
                    setSortOrder(value as "newest" | "oldest")
                  }
                >
                  <SelectTrigger className="w-[140px] h-10 bg-white border-gray-300">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Yeniden Eskiye</SelectItem>
                    <SelectItem value="oldest">Eskiden Yeniye</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-gray-500">Yükleniyor...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-gray-500">
            {searchQuery
              ? "Aradığınız kriterlere uygun kitap bulunamadı"
              : "Henüz kitap eklenmemiş"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {books.map((book) => {
            const user = getUser();
            const isRead = user
              ? readingStatuses.some(
                  (status) =>
                    status.bookId === book.id && status.userId === user.id
                )
              : false;
            return <BookCard key={book.id} book={book} isRead={isRead} />;
          })}
        </div>
      )}
    </div>
  );
}
