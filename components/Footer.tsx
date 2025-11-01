export function Footer() {
  return (
    <footer className="w-full border-t bg-white shadow-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-600">
          <p className="text-center">
            © {new Date().getFullYear()} Kütüphane Takas Sistemi
          </p>
          <p className="text-center">
            Geliştirici:{" "}
            <span className="font-semibold text-[#2ecc71]">
              Kaan Menemencioğlu
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
