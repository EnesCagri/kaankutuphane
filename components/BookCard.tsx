"use client";

import Link from "next/link";
import Image from "next/image";
import { Book } from "@/types";

interface BookCardProps {
  book: Book;
  isRead?: boolean;
}

export function BookCard({ book, isRead = false }: BookCardProps) {
  const borderColor = isRead
    ? "border-[#2ecc71] border-4" // Yeşil çerçeve - okunmuş
    : "border-[#3498db] border-4"; // Mavi çerçeve - okunmamış

  return (
    <div className="flex flex-col items-center w-full">
      <Link href={`/book/${book.id}`} className="w-full">
        <div
          className={`group relative aspect-[2/3] w-full overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl ${borderColor}`}
        >
          {/* Book Image */}
          <div className="absolute inset-0">
            <Image
              src={book.imageUrl}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Book Info - Only visible on hover */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <h3 className="text-white font-bold text-lg sm:text-xl mb-2 drop-shadow-lg">
              {book.title}
            </h3>
            <p className="text-white/90 text-sm font-medium mb-1 drop-shadow-md">
              {book.author}
            </p>
            <p className="text-white/80 text-xs line-clamp-2 drop-shadow-md">
              {book.description}
            </p>
          </div>

          {/* Shine Effect - Sweep animation on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden rounded-xl">
            <div
              className="shine-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{
                width: "200%",
                height: "100%",
                transform: "translateX(-100%) skewX(-20deg)",
              }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
