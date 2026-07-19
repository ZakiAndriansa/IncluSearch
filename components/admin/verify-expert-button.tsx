"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function VerifyExpertButton({
  expertId,
  isVerified,
}: {
  expertId: string;
  isVerified: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/experts/${expertId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !isVerified }),
      });
      if (!res.ok) throw new Error();
      toast({ title: isVerified ? "Verifikasi dicabut" : "Pakar diverifikasi" });
      router.refresh();
    } catch {
      toast({ title: "Gagal memperbarui", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1 border transition-colors disabled:opacity-50 ${
        isVerified
          ? "border-red-200 text-red-500 hover:bg-red-50"
          : "border-forest-300 text-forest-600 hover:bg-forest-50"
      }`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isVerified ? (
        <X className="w-3.5 h-3.5" />
      ) : (
        <Check className="w-3.5 h-3.5" />
      )}
      {isVerified ? "Cabut" : "Verifikasi"}
    </button>
  );
}
