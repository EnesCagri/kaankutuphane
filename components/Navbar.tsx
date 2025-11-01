"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser, clearUser, isTeacher, isStudent } from "@/lib/auth";
import {
  Book,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getUser();
    setUser(currentUser);

    // Redirect to login if not authenticated and not already on login or register page
    if (!currentUser && pathname !== "/login" && pathname !== "/register") {
      router.push("/login");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    clearUser();
    router.push("/login");
  };

  if (!mounted || pathname === "/login" || pathname === "/register") {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-all hover:scale-105"
        >
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#2ecc71] to-[#27ae60] shadow-lg group-hover:shadow-xl transition-shadow">
            <Book className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-[#2ecc71] to-[#27ae60] bg-clip-text text-transparent">
            Kütüphane Takas
          </span>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          {isStudent() && (
            <>
              <Link href="/add-book">
                <Button
                  variant="outline"
                  className="gap-2 border-[#2ecc71] text-[#2ecc71] hover:bg-[#2ecc71] hover:text-white hover:border-[#2ecc71] transition-all shadow-sm hover:shadow-md"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Kitap Ekle</span>
                </Button>
              </Link>
              <Link href="/student">
                <Button
                  variant="ghost"
                  className="gap-2 text-[#3498db] hover:bg-[#3498db]/10 hover:text-[#3498db] transition-all"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Profilim</span>
                </Button>
              </Link>
            </>
          )}

          {isTeacher() && (
            <Link href="/teacher">
              <Button
                variant="ghost"
                className="gap-2 text-[#3498db] hover:bg-[#3498db]/10 hover:text-[#3498db] transition-all"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Öğretmen Paneli</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#27ae60] flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-gray-700 bg-white hover:bg-red-600 hover:text-white border border-gray-200 hover:border-red-600 transition-all shadow-sm hover:shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
