import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50">
      <div className="text-center space-y-4">
        <div className="text-6xl font-serif font-bold text-forest-500">404</div>
        <h1 className="text-xl font-semibold text-forest-500">
          Halaman tidak ditemukan
        </h1>
        <p className="text-sand-500 text-sm max-w-xs mx-auto">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
