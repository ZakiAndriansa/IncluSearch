"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      toast({
        title: "Login gagal",
        description: "Email atau kata sandi salah. Silakan coba lagi.",
        variant: "destructive",
      });
      return;
    }

    router.push("/beranda");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/beranda" });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-serif font-bold text-forest-500">
          Selamat datang kembali
        </h1>
        <p className="text-sand-600 text-sm">
          Masuk untuk melanjutkan perjalanan bersama kami
        </p>
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full h-11 border-sand-400 hover:bg-sand-100 tap-target"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Masuk dengan Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-sand-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-sand-50 px-2 text-sand-500">atau</span>
        </div>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="h-11 border-sand-400 focus:border-forest-500 focus:ring-forest-500"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-forest-500 font-medium">
              Kata Sandi
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-teal-dark hover:text-olive-500 transition-colors"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="h-11 pr-10 border-sand-400 focus:border-forest-500 focus:ring-forest-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 hover:text-forest-500 transition-colors tap-target"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-forest-500 hover:bg-forest-600 text-white font-medium tap-target"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-sand-600">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="text-forest-500 font-semibold hover:text-olive-500 transition-colors"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
