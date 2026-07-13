"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";

export default function BayarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [paymentData, setPaymentData] = useState<{
    token: string;
    orderId: string;
    clientKey: string;
    expertName: string;
    amount: number;
    scheduledAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapOpened, setSnapOpened] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const snapCalledRef = useRef(false);

  useEffect(() => {
    fetch(`/api/consultations/${id}/payment`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPaymentData(data);
        }
      })
      .catch(() => setError("Gagal memuat data pembayaran"));
  }, [id]);

  // Load Snap script once we have the clientKey, then auto-open
  useEffect(() => {
    if (!paymentData?.token || !paymentData.clientKey) return;

    const isProduction = paymentData.clientKey.startsWith("Mid-client-") && !paymentData.clientKey.startsWith("SB-");
    const src = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    if ((window as any).snap) {
      openSnap(paymentData.token);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.setAttribute("data-client-key", paymentData.clientKey);
    script.onload = () => openSnap(paymentData.token);
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) document.body.removeChild(scriptRef.current);
    };
  }, [paymentData]);

  function openSnap(token: string) {
    if (snapCalledRef.current) return;
    const snap = (window as any).snap;
    if (!snap) return;
    snapCalledRef.current = true;
    setSnapOpened(true);
    snap.pay(token, {
      onSuccess: () => router.push(`/konsultasi/${id}?status=success&order_id=${paymentData?.orderId ?? ""}`),
      onPending: () => router.push(`/konsultasi/${id}?status=pending`),
      onError: () => {
        setError("Pembayaran gagal. Silakan coba lagi.");
        snapCalledRef.current = false;
        setSnapOpened(false);
      },
      onClose: () => { snapCalledRef.current = false; setSnapOpened(false); },
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <Link
        href="/konsultasi"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Konsultasi
      </Link>

      <div className="bg-white rounded-2xl border border-sand-200 p-6 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <CreditCard className="w-7 h-7 text-amber-500" />
        </div>

        <div>
          <h1 className="text-xl font-serif font-bold text-forest-500">
            Selesaikan Pembayaran
          </h1>
          <p className="text-sm text-sand-500 mt-1">
            Konsultasi Anda belum dikonfirmasi
          </p>
        </div>

        {!paymentData && !error && (
          <div className="flex items-center justify-center gap-2 text-sand-400 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Memuat data pembayaran...</span>
          </div>
        )}

        {paymentData && (
          <div className="bg-sand-50 rounded-xl border border-sand-200 p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-sand-500">Pakar</span>
              <span className="font-medium text-forest-500">{paymentData.expertName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sand-500">Jadwal</span>
              <span className="font-medium text-forest-500">{paymentData.scheduledAt}</span>
            </div>
            <div className="flex justify-between border-t border-sand-200 pt-2 mt-1">
              <span className="font-semibold text-forest-500">Total</span>
              <span className="font-bold text-forest-500">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(paymentData.amount)}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {paymentData && (
          <Button
            onClick={() => openSnap(paymentData.token)}
            disabled={snapOpened}
            className="w-full bg-forest-500 hover:bg-forest-600 text-white h-11 font-semibold"
          >
            {snapOpened ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Menunggu pembayaran...
              </>
            ) : (
              "Bayar Sekarang"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
