"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getUser, clearUser, isTeacher, isStudent } from "@/lib/auth";
import { Book, User as UserIcon, LogOut, PlusCircle } from "lucide-react";
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
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Book className="h-6 w-6 text-[#2ecc71]" />
          <span className="text-xl font-bold text-[#2ecc71]">
            Kütüphane Takas
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isStudent() && (
            <>
              <Link href="/add-book">
                <Button
                  variant="outline"
                  className="gap-2 border-[#2ecc71] text-[#2ecc71] hover:bg-[#2ecc71] hover:text-white"
                >
                  <PlusCircle className="h-4 w-4" />
                  Kitap Ekle
                </Button>
              </Link>
              <Link href="/student">
                <Button
                  variant="ghost"
                  className="gap-2 text-[#3498db] hover:bg-[#3498db]/10"
                >
                  <UserIcon className="h-4 w-4" />
                  Profilim
                </Button>
              </Link>
            </>
          )}

          {isTeacher() && (
            <Link href="/teacher">
              <Button
                variant="ghost"
                className="gap-2 text-[#3498db] hover:bg-[#3498db]/10"
              >
                Öğretmen Paneli
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
