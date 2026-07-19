import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

// Self-service password reset is not wired up yet (no email/SMTP provider).
// Rather than fake a "reset email sent" screen, this page is honest about the
// current state and points users to support. Replace with a real token-based
// flow once an email provider is configured.
export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Login
      </Link>

      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mx-auto">
          <KeyRound className="w-7 h-7 text-forest-500" />
        </div>
        <h1 className="font-serif font-bold text-2xl text-forest-500">
          Reset Kata Sandi
        </h1>
        <p className="text-sand-500 text-sm">
          Reset kata sandi mandiri lewat email belum tersedia. Untuk sementara,
          silakan hubungi tim dukungan agar kami membantu memulihkan akses akun
          Anda.
        </p>
        <Button
          asChild
          className="w-full bg-forest-500 hover:bg-forest-600 text-white"
        >
          <a href="mailto:support@inclusearch.id?subject=Reset%20Kata%20Sandi">
            Hubungi Dukungan
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full border-sand-300">
          <Link href="/login">Kembali ke Login</Link>
        </Button>
      </div>
    </div>
  );
}
