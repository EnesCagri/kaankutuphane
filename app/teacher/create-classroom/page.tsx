"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClassroom, getClassrooms } from "@/lib/firestore";
import { getUser, isAuthenticated, isTeacher } from "@/lib/auth";
import { Classroom } from "@/types";
import { Book, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function CreateClassroomPage() {
  const router = useRouter();
  const [user, setUser] = useState(getUser());
  const [grade, setGrade] = useState<number | "">("");
  const [className, setClassName] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingClassrooms, setExistingClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    if (!isAuthenticated() || !isTeacher()) {
      router.push("/login");
      return;
    }

    const loadClassrooms = async () => {
      if (user?.id) {
        const classrooms = await getClassrooms(user.id);
        setExistingClassrooms(classrooms);
      }
    };
    loadClassrooms();
  }, [router, user]);

  // Get available class names based on grade
  const getAvailableClassNames = (): string[] => {
    if (grade === 5 || grade === 6) {
      return ["A", "B", "C", "D"];
    } else if (grade === 7) {
      return ["A", "B", "C"];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!grade) {
      setError("Lütfen bir sınıf seviyesi seçin");
      setIsLoading(false);
      return;
    }

    if (!className) {
      setError("Lütfen bir sınıf adı seçin");
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      setError("Kullanıcı bilgisi bulunamadı");
      setIsLoading(false);
      return;
    }

    // Check if classroom already exists
    const existing = existingClassrooms.find(
      (c) => c.grade === grade && c.className === className
    );
    if (existing) {
      setError(`Bu sınıf (${grade}${className}) zaten mevcut`);
      setIsLoading(false);
      return;
    }

    const result = await createClassroom(grade, className, user.id);

    if (result.success && result.classroom) {
      setSuccess(`${grade}${className} sınıfı başarıyla oluşturuldu!`);
      setGrade("");
      setClassName("");
      // Reload classrooms
      const classrooms = await getClassrooms(user.id);
      setExistingClassrooms(classrooms);
      setIsLoading(false);
    } else {
      setError(result.error || "Sınıf oluşturulamadı");
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Öğretmen paneline dön
        </Link>
        <div className="flex items-center gap-3">
          <Plus className="h-8 w-8 text-[#2ecc71]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Yeni Sınıf Oluştur
            </h1>
            <p className="text-gray-600">
              Öğrencilerinizin katılabileceği bir sınıf oluşturun
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Sınıf Bilgileri</CardTitle>
            <CardDescription>
              Oluşturmak istediğiniz sınıfın bilgilerini girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="grade">Sınıf Seviyesi</Label>
                <Select
                  value={grade ? grade.toString() : ""}
                  onValueChange={(value) => {
                    setGrade(parseInt(value));
                    setClassName(""); // Reset className when grade changes
                  }}
                >
                  <SelectTrigger className="h-12 rounded-lg border-gray-300">
                    <SelectValue placeholder="Sınıf seviyesi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5. Sınıf</SelectItem>
                    <SelectItem value="6">6. Sınıf</SelectItem>
                    <SelectItem value="7">7. Sınıf</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {grade && (
                <div className="space-y-2">
                  <Label htmlFor="className">Sınıf Adı</Label>
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger className="h-12 rounded-lg border-gray-300">
                      <SelectValue placeholder="Sınıf adı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableClassNames().map((name) => {
                        const existing = existingClassrooms.find(
                          (c) => c.grade === grade && c.className === name
                        );
                        return (
                          <SelectItem key={name} value={name}>
                            {name}
                            {existing && " (Mevcut)"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !grade || !className}
                className="w-full h-12 rounded-lg bg-[#2ecc71] text-white hover:bg-[#27ae60] text-base font-semibold disabled:opacity-50"
              >
                {isLoading ? "Oluşturuluyor..." : "Sınıf Oluştur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {existingClassrooms.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Mevcut Sınıflarım</CardTitle>
              <CardDescription>Oluşturduğunuz tüm sınıflar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {existingClassrooms.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="font-semibold text-lg">
                      {classroom.grade}
                      {classroom.className}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(classroom.createdAt).toLocaleDateString(
                        "tr-TR"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
