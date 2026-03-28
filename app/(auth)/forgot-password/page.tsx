"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Simulate delay — actual email reset requires SMTP setup
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-forest-500" />
        </div>
        <h2 className="font-serif font-bold text-xl text-forest-500">Cek Email Anda</h2>
        <p className="text-sand-500 text-sm">
          Jika akun dengan email <strong>{email}</strong> terdaftar, kami akan mengirimkan
          instruksi untuk mereset kata sandi.
        </p>
        <Button asChild className="w-full bg-forest-500 hover:bg-forest-600 text-white">
          <Link href="/login">Kembali ke Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Login
        </Link>
        <h1 className="font-serif font-bold text-2xl text-forest-500">Lupa Kata Sandi?</h1>
        <p className="text-sand-500 text-sm">
          Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset kata sandi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-forest-500 font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              className="pl-10 border-sand-300 focus:border-forest-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-forest-500 hover:bg-forest-600 text-white"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Kirim Instruksi Reset
        </Button>
      </form>
    </div>
  );
}
