"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ReviewFormProps {
  expertId: string;
  initialRating?: number;
  initialComment?: string | null;
}

export function ReviewForm({ expertId, initialRating, initialComment }: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (rating < 1) {
      toast({ title: "Beri rating bintang dulu", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/experts/${expertId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: "Ulasan tersimpan. Terima kasih!" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menyimpan ulasan",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-5 space-y-3">
      <h3 className="font-semibold text-forest-500">
        {initialRating ? "Perbarui Ulasan Anda" : "Beri Ulasan"}
      </h3>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          const active = (hover || rating) >= value;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              aria-label={`${value} bintang`}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  active ? "text-amber-400 fill-amber-400" : "text-sand-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ceritakan pengalaman konsultasi Anda (opsional)"
        className="min-h-[80px] border-sand-300"
      />
      <Button
        onClick={submit}
        disabled={saving}
        className="bg-forest-500 hover:bg-forest-600 text-white"
      >
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {initialRating ? "Perbarui Ulasan" : "Kirim Ulasan"}
      </Button>
    </div>
  );
}
