"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="font-semibold text-forest-500">Terjadi kesalahan</h2>
        <p className="text-sand-500 text-sm">
          Gagal memuat halaman ini. Silakan coba lagi.
        </p>
        <Button
          onClick={reset}
          className="bg-forest-500 hover:bg-forest-600 text-white"
        >
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
