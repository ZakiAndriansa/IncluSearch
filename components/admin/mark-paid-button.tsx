"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function MarkPaidButton({
  expertId,
  outstanding,
}: {
  expertId: string;
  outstanding: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (outstanding <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-forest-500 font-medium">
        <Check className="w-3.5 h-3.5" /> Lunas
      </span>
    );
  }

  async function pay() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: "Pembayaran dicatat" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal mencatat pembayaran",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={pay}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1 border border-forest-300 text-forest-600 hover:bg-forest-50 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      Tandai Dibayar
    </button>
  );
}
