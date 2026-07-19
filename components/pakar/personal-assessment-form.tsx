"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PA_SECTIONS, PA_QUESTIONS, PA_FIELD_NAMES, paFieldName } from "@/lib/personal-assessment";

type Fields = Record<string, string>;

interface PersonalAssessmentFormProps {
  consultationId: string;
  childName?: string | null;
  initial: Partial<Record<string, string | null>>;
  initialStatus: "DRAFT" | "SUBMITTED";
}

export function PersonalAssessmentForm({
  consultationId,
  childName,
  initial,
  initialStatus,
}: PersonalAssessmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [fields, setFields] = useState<Fields>(() => {
    const f: Fields = {};
    for (const name of PA_FIELD_NAMES) f[name] = initial[name] ?? "";
    return f;
  });
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  function set(name: string, value: string) {
    setFields((f) => ({ ...f, [name]: value }));
  }

  async function save(submit: boolean) {
    if (submit) {
      const empty = PA_FIELD_NAMES.some((n) => !fields[n]?.trim());
      if (empty) {
        toast({ title: "Lengkapi semua 9 pertanyaan sebelum mengirim", variant: "destructive" });
        return;
      }
    }
    setSaving(submit ? "submit" : "draft");
    try {
      const res = await fetch(`/api/consultations/${consultationId}/personal-assessment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, submit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      setStatus(data.personalAssessment.status);
      toast({ title: submit ? "Asesmen terkirim ke orang tua" : "Draf tersimpan" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-serif font-bold text-lg text-forest-500">
            Asesmen Pribadi{childName ? ` — ${childName}` : ""}
          </h2>
          <p className="text-sand-500 text-sm">
            Isi penilaian Anda pada 3 aspek berikut. Draf tersimpan sementara;
            kirim jika sudah final.
          </p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full border ${
            status === "SUBMITTED"
              ? "bg-forest-50 text-forest-600 border-forest-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {status === "SUBMITTED" ? "Terkirim" : "Draf"}
        </span>
      </div>

      {PA_SECTIONS.map((section) => (
        <section key={section.key} className="bg-white rounded-2xl border border-sand-200 p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-forest-500">{section.label}</h3>
            <p className="text-xs text-sand-500 mt-0.5">{section.desc}</p>
          </div>
          {PA_QUESTIONS.map((q) => {
            const name = paFieldName(section.key, q.key);
            return (
              <div key={name} className="space-y-1.5">
                <label className="text-sm font-medium text-forest-500">{q.label}</label>
                <Textarea
                  value={fields[name]}
                  onChange={(e) => set(name, e.target.value)}
                  placeholder="Tuliskan penjelasan Anda…"
                  className="min-h-[80px] border-sand-300"
                />
              </div>
            );
          })}
        </section>
      ))}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="border-sand-300"
          onClick={() => save(false)}
          disabled={saving !== null}
        >
          {saving === "draft" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Draf
        </Button>
        <Button
          className="bg-forest-500 hover:bg-forest-600 text-white"
          onClick={() => save(true)}
          disabled={saving !== null}
        >
          {saving === "submit" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Kirim ke Orang Tua
        </Button>
      </div>
    </div>
  );
}
