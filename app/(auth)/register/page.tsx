"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// `id` is a unique UI key so only one option highlights at a time.
// `role` is the persisted UserRole enum — the schema has no TEACHER role yet,
// so both self-identifications map to PARENT. Add a `profession` field (or a
// TEACHER enum value) if the parent/teacher distinction ever needs storing.
//
// NOTE: pendaftaran publik hanya untuk orang tua / guru. Akun PAKAR tidak bisa
// dibuat lewat sign-up — pakar hanya ditambahkan oleh admin (mereka tetap bisa
// login seperti biasa). Server juga memaksa role = PARENT (lihat API register).
const USER_ROLES = [
  { id: "parent", role: "PARENT", label: "Orang Tua / Wali", desc: "Saya orang tua / wali anak ABK" },
  { id: "teacher", role: "PARENT", label: "Guru / Pendidik", desc: "Saya pendidik yang mendampingi ABK" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleKey: "parent", // which option is selected in the UI
    role: "PARENT", // the persisted UserRole enum
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setIsLoading(true);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Pendaftaran gagal");
      }

      // Auto-login after register
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/beranda");
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Pendaftaran gagal",
        description: err instanceof Error ? err.message : "Coba lagi nanti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strength = passwordStrength(form.password);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-bold text-forest-500">
          Buat akun baru
        </h1>
        <p className="text-sand-600 text-sm">
          Bergabung dan mulai perjalanan mendukung anak Anda
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                s < step
                  ? "bg-olive-500 text-white"
                  : s === step
                  ? "bg-forest-500 text-white"
                  : "bg-sand-200 text-sand-500"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs ${s === step ? "text-forest-500 font-medium" : "text-sand-500"}`}>
              {s === 1 ? "Data Diri" : "Peran Anda"}
            </span>
            {s < 2 && <div className="w-8 h-px bg-sand-300 mx-1" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-forest-500 font-medium">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-11 border-sand-400 focus:border-forest-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-forest-500 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-11 border-sand-400 focus:border-forest-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-forest-500 font-medium">
                Kata Sandi
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="h-11 pr-10 border-sand-400 focus:border-forest-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-forest-500 transition-colors tap-target"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= strength
                          ? strength <= 1
                            ? "bg-red-400"
                            : strength <= 2
                            ? "bg-amber-400"
                            : strength <= 3
                            ? "bg-olive-400"
                            : "bg-forest-500"
                          : "bg-sand-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-forest-500 font-medium">
              Anda adalah...
            </Label>
            {USER_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, roleKey: role.id, role: role.role }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  form.roleKey === role.id
                    ? "border-forest-500 bg-forest-50"
                    : "border-sand-300 hover:border-sand-400"
                }`}
              >
                <div className="font-medium text-forest-500">{role.label}</div>
                <div className="text-sm text-sand-600 mt-0.5">{role.desc}</div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step === 2 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 border-sand-400"
              onClick={() => setStep(1)}
            >
              Kembali
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 h-11 bg-forest-500 hover:bg-forest-600 text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : step === 1 ? (
              "Lanjutkan"
            ) : (
              "Buat Akun"
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-sand-600">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="text-forest-500 font-semibold hover:text-olive-500 transition-colors"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
