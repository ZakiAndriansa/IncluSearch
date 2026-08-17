"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#video", label: "Video" },
  { href: "#untuk-siapa", label: "Untuk Siapa" },
];

export function LandingNav({ loggedIn = false }: { loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const { scrollYProgress } = useScroll();

  // Scroll-spy: highlight the link whose section sits in the middle band.
  useEffect(() => {
    const ids = LINKS.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sand-200 bg-white/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="IncluSearch"
            width={140}
            height={48}
            className="h-8 sm:h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                className={cn(
                  "relative text-sm font-medium transition-colors",
                  isActive ? "text-olive-500" : "text-forest-600 hover:text-olive-500"
                )}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-olive-500"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {loggedIn ? (
            <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
              <Link href="/beranda">Buka Beranda</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-forest-500 hover:bg-sand-100 hover:text-forest-600"
              >
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
                <Link href="/register">Daftar Gratis</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="md:hidden -mr-1 p-2 rounded-lg text-forest-600 hover:bg-sand-100 tap-target"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Reading-progress bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-forest-500 via-olive-500 to-teal-dark"
      />

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-sand-200 bg-white transition-[max-height] duration-300",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="px-4 py-4 space-y-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active === l.href.slice(1)
                  ? "bg-olive-50 text-olive-600"
                  : "text-forest-600 hover:bg-sand-100"
              )}
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-sand-100 mt-2">
            {loggedIn ? (
              <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
                <Link href="/beranda">Buka Beranda</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="border-sand-300 text-forest-500">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
                  <Link href="/register">Daftar Gratis</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
