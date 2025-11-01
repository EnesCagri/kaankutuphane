"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/auth";
import { Book, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!name.trim()) {
      setError("Lütfen adınızı ve soyadınızı girin");
      setIsLoading(false);
      return;
    }

    if (!username.trim()) {
      setError("Lütfen kullanıcı adı girin");
      setIsLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalıdır");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Lütfen şifre girin");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      setIsLoading(false);
      return;
    }

    const result = await register(
      name.trim(),
      username.trim(),
      password,
      "student"
    );

    if (result.success && result.user) {
      router.push("/");
    } else {
      setError(result.error || "Kayıt başarısız");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ecf0f1] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2ecc71]">
            <Book className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#2ecc71]">
            Hesap Oluştur
          </CardTitle>
          <CardDescription className="text-base">
            Yeni hesap oluşturun ve kitaplarla buluşun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                type="text"
                placeholder="Adınızı ve soyadınızı girin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-lg border-gray-300"
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="Kullanıcı adınızı girin (min. 3 karakter)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-lg border-gray-300"
                autoComplete="username"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin (min. 6 karakter)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-lg border-gray-300 pr-10"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Şifrenizi tekrar girin"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-lg border-gray-300 pr-10"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-[#2ecc71] text-white hover:bg-[#27ae60] text-base font-semibold disabled:opacity-50"
            >
              {isLoading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Zaten hesabınız var mı?{" "}
                <Link
                  href="/login"
                  className="text-[#2ecc71] font-semibold hover:underline"
                >
                  Giriş Yap
                </Link>
              </p>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Giriş sayfasına dön
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
