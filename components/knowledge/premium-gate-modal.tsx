"use client";

import { Crown, X, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PremiumGateModalProps {
  open: boolean;
  onClose: () => void;
  contentTitle?: string;
}

export function PremiumGateModal({ open, onClose, contentTitle }: PremiumGateModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sand-400 hover:text-sand-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 mx-auto mb-4">
          <Lock className="w-6 h-6 text-amber-500" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2 mb-6">
          <h3 className="font-serif font-bold text-lg text-forest-500">
            Konten Premium
          </h3>
          {contentTitle && (
            <p className="text-sm text-sand-500 font-medium line-clamp-2">
              "{contentTitle}"
            </p>
          )}
          <p className="text-sm text-sand-500">
            Konten ini hanya tersedia untuk pengguna Premium. Upgrade sekarang untuk akses penuh ke semua artikel, video, dan modul eksklusif.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            asChild
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2"
          >
            <Link href="/profil?tab=premium" onClick={onClose}>
              <Crown className="w-4 h-4" />
              Upgrade ke Premium
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-sand-500 hover:text-sand-700 text-sm"
          >
            Nanti saja
          </Button>
        </div>
      </div>
    </div>
  );
}
