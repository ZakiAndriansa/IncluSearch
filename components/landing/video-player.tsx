"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";

/**
 * Poster + play button that opens a modal on click (Esc / backdrop / close
 * button to dismiss). The real clip isn't ready yet, so the modal shows a
 * "segera hadir" placeholder — swap the placeholder block for a <video> /
 * <iframe> once the file exists.
 */
export function VideoPlayer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Poster / trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover="hover"
        aria-label="Putar video profil IncluSearch"
        className="relative block w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-lg"
      >
        <Image
          src="/landing/video-poster.jpg"
          alt="Video profil IncluSearch"
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-forest-900/40 flex flex-col items-center justify-center gap-4">
          <motion.span
            variants={{ hover: { scale: 1.12 } }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="relative w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
          >
            {/* pulse ring */}
            <span className="absolute inset-0 rounded-full bg-white/60 animate-ping" />
            <Play className="relative w-8 h-8 text-forest-500 fill-forest-500 ml-1" />
          </motion.span>
          <span className="text-white/90 text-sm font-medium">Klik untuk memutar</span>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-forest-900/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Video profil IncluSearch"
          >
            <motion.div
              className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Placeholder (ganti dengan <video controls src=...> saat video siap) ── */}
              <Image
                src="/landing/video-poster.jpg"
                alt=""
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-forest-500 fill-forest-500 ml-1" />
                </span>
                <p className="text-white font-serif text-xl">Video profil segera hadir</p>
                <p className="text-white/70 text-sm max-w-sm">
                  Nantikan cerita bagaimana IncluSearch mendampingi keluarga dan pakar
                  ortopedagogik.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup video"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
