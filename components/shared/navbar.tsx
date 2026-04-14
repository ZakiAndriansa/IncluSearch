"use client";

import Link from "next/link";
import Image from "next/image";
import { Crown, User, ClipboardList, ShieldCheck, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";

import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface NavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
    isPremium: boolean;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand-200/80 bg-white/95 backdrop-blur-lg h-14 flex">
      <div className="flex items-center justify-between w-full px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="IncluSearch"
            width={140}
            height={48}
            className="h-8 md:h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Premium badge */}
          {user.isPremium && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">Premium</span>
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 hover:bg-sand-100 transition-colors tap-target">
                <Avatar className={`w-8 h-8 ${user.isPremium ? "ring-2 ring-amber-300 ring-offset-1" : "ring-1 ring-sand-200"}`}>
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                  <AvatarFallback className="bg-forest-50 text-forest-500 text-xs font-semibold">
                    {getInitials(user.name ?? user.email ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-forest-600 hidden lg:block max-w-[120px] truncate">
                  {user.name ?? "Pengguna"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-sand-200/80">
              <DropdownMenuLabel className="font-normal px-3 py-2">
                <div className="font-semibold text-forest-600 text-sm">{user.name}</div>
                <div className="text-xs text-sand-500 mt-0.5">{user.email}</div>
                {user.isPremium && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] text-amber-600 font-medium">Member Premium</span>
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg mx-1">
                <Link href="/profil" className="flex items-center gap-2.5 px-2">
                  <User className="w-4 h-4 text-sand-500" />
                  <span>Profil Saya</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg mx-1">
                <Link href="/profil?tab=asesmen" className="flex items-center gap-2.5 px-2">
                  <ClipboardList className="w-4 h-4 text-sand-500" />
                  <span>Asesmen</span>
                </Link>
              </DropdownMenuItem>
              {!user.isPremium && (
                <DropdownMenuItem asChild className="rounded-lg mx-1">
                  <Link href="/profil?tab=premium" className="flex items-center gap-2.5 px-2 text-amber-600">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">Upgrade Premium</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {user.role === "ADMIN" && (
                <DropdownMenuItem asChild className="rounded-lg mx-1">
                  <Link href="/admin" className="flex items-center gap-2.5 px-2">
                    <ShieldCheck className="w-4 h-4 text-sand-500" />
                    <span>Panel Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 px-2 text-red-500 focus:text-red-500 rounded-lg mx-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
