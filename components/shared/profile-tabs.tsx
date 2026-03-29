"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  User,
  ClipboardList,
  Crown,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  getInitials,
  formatDate,
  formatCurrency,
  CHALLENGE_TYPE_LABELS,
} from "@/lib/utils";
import { AssessmentForm } from "@/components/assessment/assessment-form";
import type { Assessment, ConsultationQuota, UserRole } from "@prisma/client";

const TABS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "asesmen", label: "Asesmen", icon: ClipboardList },
  { id: "premium", label: "Premium", icon: Crown },
];

const PREMIUM_PLANS = [
  {
    id: "monthly",
    name: "Bulanan",
    price: 99000,
    duration: "1 bulan",
    features: [
      "Konsultasi tanpa batas",
      "Hingga 3 asesmen aktif",
      "Akses semua video premium",
      "Skor kecocokan pakar",
      "Prioritas respons pakar",
    ],
  },
  {
    id: "quarterly",
    name: "3 Bulan",
    price: 249000,
    duration: "3 bulan",
    badge: "Hemat 16%",
    features: [
      "Semua fitur bulanan",
      "Hemat Rp 48.000",
      "Akses laporan progress anak",
    ],
  },
];

interface ProfileTabsProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
    bio: string | null;
    role: UserRole;
    isPremium: boolean;
    premiumExpiresAt: Date | null;
    createdAt: Date;
  };
  assessments: Assessment[];
  quota: ConsultationQuota | null;
  activeTab: string;
  paymentStatus?: string;
}

export function ProfileTabs({
  user,
  assessments,
  quota,
  activeTab: initialTab,
  paymentStatus,
}: ProfileTabsProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { toast } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (paymentStatus === "success") {
      toast({
        title: "Pembayaran berhasil!",
        description: "Akun Anda telah diupgrade ke Premium. Selamat menikmati semua fitur.",
      });
      router.replace("/profil?tab=premium", { scroll: false });
      // Sync JWT token with DB so other components reflect the new premium status
      updateSession().then(() => router.refresh());
    } else if (paymentStatus === "error") {
      toast({
        title: "Pembayaran gagal",
        description: "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
        variant: "destructive",
      });
      router.replace("/profil?tab=premium", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchTab(id: string) {
    setTab(id);
    router.replace(`/profil?tab=${id}`, { scroll: false });
  }

  async function saveProfile() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Profil berhasil disimpan" });
      router.refresh();
    } catch {
      toast({ title: "Gagal menyimpan profil", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAssessment(id: string) {
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Asesmen dihapus" });
      router.refresh();
    } catch {
      toast({ title: "Gagal menghapus asesmen", variant: "destructive" });
    }
  }

  async function activateAssessment(id: string) {
    try {
      const res = await fetch(`/api/assessments/${id}/activate`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: "Asesmen diaktifkan" });
      router.refresh();
    } catch {
      toast({ title: "Gagal mengaktifkan asesmen", variant: "destructive" });
    }
  }

  async function upgradePremium(planId: string) {
    setIsUpgrading(planId);
    try {
      const res = await fetch("/api/payments/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Server error");
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("URL pembayaran tidak ditemukan");
      }
    } catch (err) {
      setIsUpgrading(null);
      toast({
        title: "Gagal memproses pembayaran",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  }

  const maxAssessments = 1;

  return (
    <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-sand-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-forest-500 text-forest-500"
                : "border-transparent text-sand-500 hover:text-forest-500"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ─── PROFILE TAB ─── */}
        {tab === "profil" && (
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="bg-forest-100 text-forest-500 text-xl font-bold">
                  {getInitials(user.name ?? user.email ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-forest-500">
                  {user.name ?? "Pengguna"}
                </div>
                <div className="text-sm text-sand-500">{user.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-[10px] bg-sand-100 text-sand-600 border-sand-200">
                    {user.role === "PARENT" ? "Orang Tua / Guru" : user.role}
                  </Badge>
                  {user.isPremium && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-600 border-amber-200">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-forest-500 font-medium">
                  Nama Lengkap
                </Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="border-sand-300 focus:border-forest-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-forest-500 font-medium">
                  Nomor Telepon
                </Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+62..."
                  className="border-sand-300 focus:border-forest-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-forest-500 font-medium">
                  Tentang Saya
                </Label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                  className="border-sand-300 focus:border-forest-500 resize-none"
                  rows={3}
                />
              </div>

              <Button
                onClick={saveProfile}
                disabled={isSaving}
                className="bg-forest-500 hover:bg-forest-600 text-white"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>

            <div className="pt-4 border-t border-sand-200 text-xs text-sand-400">
              Bergabung sejak {formatDate(user.createdAt)}
            </div>
          </div>
        )}

        {/* ─── ASSESSMENT TAB ─── */}
        {tab === "asesmen" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest-500">
                  Asesmen Kebutuhan Anak
                </h3>
                <p className="text-sm text-sand-500 mt-0.5">
                  {assessments.filter((a) => a.isActive).length} aktif · {assessments.length} total
                </p>
              </div>
              {!showAssessmentForm && (
                <Button
                  size="sm"
                  onClick={() => setShowAssessmentForm(true)}
                  className="bg-forest-500 hover:bg-forest-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Buat Asesmen
                </Button>
              )}
            </div>

            {showAssessmentForm && (
              <AssessmentForm
                onClose={() => {
                  setShowAssessmentForm(false);
                  router.refresh();
                }}
              />
            )}

            {assessments.length === 0 && !showAssessmentForm && (
              <div className="rounded-xl border border-dashed border-sand-300 p-8 text-center">
                <ClipboardList className="w-10 h-10 text-sand-300 mx-auto mb-3" />
                <h4 className="font-medium text-forest-500 mb-1">
                  Belum ada asesmen
                </h4>
                <p className="text-sm text-sand-500 mb-4">
                  Buat asesmen untuk mendapatkan rekomendasi pakar yang tepat.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowAssessmentForm(true)}
                  className="bg-forest-500 hover:bg-forest-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Buat Asesmen Pertama
                </Button>
              </div>
            )}

            {assessments.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border p-4 ${
                  a.isActive
                    ? "border-forest-100 bg-forest-50"
                    : "border-sand-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/profil/asesmen/${a.id}`} className="flex-1 min-w-0 group">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${a.isActive ? "text-forest-500" : "text-sand-300"}`}
                      />
                      <span className={`font-semibold text-sm group-hover:underline underline-offset-2 ${a.isActive ? "text-forest-500" : "text-sand-600"}`}>
                        {a.childName}
                      </span>
                      {a.isActive ? (
                        <Badge className="text-[10px] bg-forest-100 text-forest-500 border-forest-200">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-sand-100 text-sand-500 border-sand-200">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-sand-500">
                        Usia: {a.childAge} tahun ·{" "}
                        {CHALLENGE_TYPE_LABELS[a.challengeType] ?? a.challengeType}
                      </p>
                      {a.goals.length > 0 && (
                        <p className="text-xs text-sand-400">
                          Tujuan: {a.goals.slice(0, 2).join(", ")}
                          {a.goals.length > 2 && ` +${a.goals.length - 2}`}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!a.isActive && (
                      <button
                        onClick={() => activateAssessment(a.id)}
                        className="text-xs text-forest-500 hover:text-forest-600 font-medium border border-forest-200 hover:border-forest-400 rounded-lg px-2.5 py-1 transition-colors"
                      >
                        Aktifkan
                      </button>
                    )}
                    <button
                      onClick={() => deleteAssessment(a.id)}
                      className="text-sand-400 hover:text-red-500 transition-colors tap-target p-1"
                      title="Hapus asesmen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}

        {/* ─── PREMIUM TAB ─── */}
        {tab === "premium" && (
          <div className="space-y-6">
            {user.isPremium ? (
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-amber-700">
                      Anggota Premium Aktif
                    </div>
                    {user.premiumExpiresAt && (
                      <div className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Aktif hingga {formatDate(user.premiumExpiresAt)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    "Konsultasi tanpa batas",
                    "Hingga 3 asesmen aktif",
                    "Semua video premium",
                    "Skor kecocokan pakar",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-1.5 text-amber-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-serif font-semibold text-xl text-forest-500">
                    Pilih Paket Premium
                  </h3>
                  <p className="text-sand-500 text-sm mt-1">
                    Batalkan kapan saja. Tidak ada biaya tersembunyi.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {PREMIUM_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className="relative rounded-2xl border-2 border-sand-200 p-5 hover:border-amber-300 transition-colors"
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-amber-500 text-white border-transparent text-xs">
                            {plan.badge}
                          </Badge>
                        </div>
                      )}
                      <div className="mb-3">
                        <div className="font-semibold text-forest-500">
                          {plan.name}
                        </div>
                        <div className="mt-1">
                          <span className="text-2xl font-bold text-forest-500">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-sand-400 text-sm">
                            /{plan.duration}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 mb-4">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-1.5 text-xs text-sand-600"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-olive-500" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => upgradePremium(plan.id)}
                        disabled={isUpgrading !== null}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
                      >
                        {isUpgrading === plan.id ? "Memproses..." : `Pilih Paket ${plan.name}`}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
