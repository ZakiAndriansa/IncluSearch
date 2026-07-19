"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function DeleteParentButton({ parentId, name }: { parentId: string; name: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function del() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/parents/${parentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: "Akun dihapus" });
      setConfirming(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 border border-red-200 text-red-500 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" /> Hapus
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-sand-500 hidden sm:inline">Hapus {name}?</span>
      <button
        onClick={del}
        disabled={loading}
        className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ya"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="text-xs rounded-lg px-2.5 py-1 border border-sand-300 text-sand-600 hover:bg-sand-50"
      >
        Batal
      </button>
    </div>
  );
}
