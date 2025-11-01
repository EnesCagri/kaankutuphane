"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUsers, getReadingStatuses } from "@/lib/firestore";
import { getUser, isAuthenticated } from "@/lib/auth";
import { User, ReadingStatus } from "@/types";
import { Trophy, Medal, Award, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LeaderboardUser {
  user: User;
  readCount: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      try {
        const user = getUser();
        setCurrentUser(user);

        const [usersData, readingStatusesData] = await Promise.all([
          getUsers(),
          getReadingStatuses(),
        ]);

        // Kullanıcı başına okunan kitap sayısını hesapla
        const userReadCounts = new Map<string, number>();
        readingStatusesData.forEach((status) => {
          const count = userReadCounts.get(status.userId) || 0;
          userReadCounts.set(status.userId, count + 1);
        });

        // Leaderboard oluştur
        const leaderboardData: LeaderboardUser[] = usersData
          .map((user) => ({
            user,
            readCount: userReadCounts.get(user.id) || 0,
          }))
          .filter((item) => item.readCount > 0) // En az 1 kitap okuyanları göster
          .sort((a, b) => b.readCount - a.readCount); // En çok okuyandan en aza sırala

        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const getRankIcon = (index: number) => {
    if (index === 0) {
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    } else if (index === 1) {
      return <Medal className="h-6 w-6 text-gray-400" />;
    } else if (index === 2) {
      return <Award className="h-6 w-6 text-amber-600" />;
    }
    return (
      <span className="text-lg font-bold text-gray-500 w-6 text-center">
        {index + 1}
      </span>
    );
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) {
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    } else if (index === 1) {
      return "bg-gray-100 text-gray-700 border-gray-300";
    } else if (index === 2) {
      return "bg-amber-100 text-amber-700 border-amber-300";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  if (loading) {
    return (
      <div className="container mx-auto min-h-screen px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-gray-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

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

      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="h-10 w-10 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-800">Liderlik Tablosu</h1>
          <Trophy className="h-10 w-10 text-yellow-500" />
        </div>
        <p className="text-gray-600 text-lg">
          En çok kitap okuyanları keşfedin
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-500">Henüz kimse kitap okumamış</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>En Çok Kitap Okuyanlar</CardTitle>
            <CardDescription>
              Toplam {leaderboard.length} kullanıcı kitap okumuş
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((item, index) => {
                const isCurrentUser = currentUser?.id === item.user.id;
                return (
                  <div
                    key={item.user.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      isCurrentUser
                        ? "bg-[#2ecc71]/10 border-[#2ecc71] shadow-md"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 shrink-0">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      {item.user.avatarUrl ? (
                        <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                      ) : null}
                      <AvatarFallback
                        className={`text-white font-semibold ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-500"
                            : index === 2
                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : "bg-gradient-to-br from-[#2ecc71] to-[#27ae60]"
                        }`}
                      >
                        {item.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-bold text-lg ${
                            isCurrentUser ? "text-[#2ecc71]" : "text-gray-800"
                          }`}
                        >
                          {item.user.name}
                        </h3>
                        {isCurrentUser && (
                          <Badge
                            variant="outline"
                            className="bg-[#2ecc71] text-white border-[#2ecc71]"
                          >
                            Siz
                          </Badge>
                        )}
                        {item.user.role === "teacher" && (
                          <Badge
                            variant="secondary"
                            className="bg-[#2ecc71] text-white border-[#2ecc71]"
                          >
                            Öğretmen
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        @{item.user.username}
                      </p>
                    </div>

                    {/* Read Count */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`px-4 py-2 rounded-lg border ${getRankBadgeColor(
                          index
                        )}`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          <span className="font-bold text-xl">
                            {item.readCount}
                          </span>
                          <span className="text-sm">kitap</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="max-w-4xl mx-auto mt-6 bg-blue-50 border-blue-200">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-blue-600 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Nasıl Liderlik Tablosunda Yer Alırsınız?
              </h3>
              <p className="text-blue-700 text-sm">
                Kitap detay sayfalarında "Bu Kitabı Okudum" butonuna tıklayarak
                kitapları okuduğunuz olarak işaretleyin. Her okuduğunuz kitap
                liderlik tablosundaki sıranızı yükseltir!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
