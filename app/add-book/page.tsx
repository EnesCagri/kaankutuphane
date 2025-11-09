"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { addBook } from "@/lib/firestore";
import { getUser, isAuthenticated, isStudent } from "@/lib/auth";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const BOOK_GENRES = [
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

export default function AddBookPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isStudent()) {
      router.push("/login");
    }
  }, [router]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir görsel dosyası seçin");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Görsel boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setImageBase64(base64);
      setPreviewUrl(base64);
    } catch (error) {
      alert("Görsel yüklenirken bir hata oluştu");
      console.error(error);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64("");
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser();

    if (!user || !title.trim() || !author.trim()) {
      alert("Lütfen zorunlu alanları doldurun");
      return;
    }

    try {
      const result = await addBook({
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        genre: genre || undefined,
        imageUrl:
          imageBase64 ||
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
        addedBy: user.id, // İlk ekleyen kişi kitabın sahibi olur
      });

      if (result.success && result.book) {
        alert("Kitap başarıyla eklendi!");
        router.push("/");
      } else {
        alert(result.error || "Kitap eklenirken bir hata oluştu");
      }
    } catch (error: any) {
      console.error("Error adding book:", error);
      alert(error.message || "Kitap eklenirken bir hata oluştu");
    }
  };

  return (
    <div className="container mx-auto min-h-screen px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri
      </Button>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-[#2ecc71]">
            Yeni Kitap Ekle
          </CardTitle>
          <CardDescription>
            Kitaplarınızı paylaşın, diğer öğrencilerle takas yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Kitap Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Örn: Simyacı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">
                Yazar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="author"
                type="text"
                placeholder="Örn: Paulo Coelho"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <textarea
                id="description"
                placeholder="Kitap hakkında kısa bir açıklama..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-[#2ecc71] focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Kitap Türü</Label>
              <Select value={genre || undefined} onValueChange={setGenre}>
                <SelectTrigger className="h-12 bg-white border-gray-300">
                  <SelectValue placeholder="Kitap türünü seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Kitabın türünü belirleyerek filtreleme yapılabilir
              </p>
            </div>

            <div className="space-y-2">
              <Label>Kitap Görseli</Label>
              {previewUrl ? (
                <div className="w-full">
                  <div
                    className="relative aspect-[2/3] w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-gray-300 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image
                      src={previewUrl}
                      alt="Kitap görseli önizleme"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Görseli Değiştir
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Görseli değiştirmek için üzerine tıklayın
                  </p>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-[#2ecc71] bg-[#2ecc71]/5 scale-[1.02]"
                      : "border-gray-300 hover:border-[#2ecc71] hover:bg-gray-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-[#2ecc71]/10">
                      <Upload className="h-8 w-8 text-[#2ecc71]" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-gray-700 mb-1">
                        Görseli sürükleyip bırakın veya tıklayarak seçin
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF (Maks. 5MB)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 border-[#2ecc71] text-[#2ecc71] hover:bg-[#2ecc71] hover:text-white"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Dosya Seç
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {previewUrl
                  ? "Görsel başarıyla yüklendi"
                  : "Boş bırakılırsa varsayılan görsel kullanılacak"}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60] h-12"
              >
                Kitabı Ekle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
