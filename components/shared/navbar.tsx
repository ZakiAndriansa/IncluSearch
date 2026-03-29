"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Crown, User, ClipboardList, ShieldCheck, LogOut } from "lucide-react";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-white/90 backdrop-blur-md h-14 flex">
      <div className="flex items-center justify-between w-full px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="IncluSearch"
            width={140}
            height={48}
            className="h-8 md:h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Premium badge — hidden on small mobile */}
          {user.isPremium && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 border border-amber-300 shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-900" />
              <span className="text-xs font-medium text-amber-900">Premium</span>
            </div>
          )}

          {/* Notifications — hidden on mobile */}
          <Button variant="ghost" size="icon" className="relative tap-target hidden sm:inline-flex">
            <Bell className="w-5 h-5 text-sand-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-olive-500" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-sand-100 transition-colors tap-target">
                <div className="relative">
                  <Avatar className={`w-8 h-8 ${user.isPremium ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}>
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                    <AvatarFallback className="bg-forest-100 text-forest-500 text-sm font-semibold">
                      {getInitials(user.name ?? user.email ?? "U")}
                    </AvatarFallback>
                  </Avatar>
                  {user.isPremium && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center sm:hidden">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-sm font-medium text-forest-500">
                      {user.name ?? "Pengguna"}
                    </span>
                    {user.isPremium && (
                      <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs mt-0.5 leading-none">
                    {user.isPremium ? (
                      <span className="text-amber-600 font-medium">Member Premium</span>
                    ) : (
                      <span className="text-sand-500">
                        {user.role === "PARENT"
                          ? "Orang Tua / Guru"
                          : user.role === "EXPERT"
                          ? "Pakar"
                          : "Admin"}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-forest-500">{user.name}</span>
                  {user.isPremium && (
                    <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-sand-500 mt-0.5">{user.email}</div>
                {user.isPremium && (
                  <div className="text-xs text-amber-600 font-medium mt-1">Member Premium</div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profil" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-sand-400" />
                  Profil Saya
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profil?tab=asesmen" className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-sand-400" />
                  Asesmen
                </Link>
              </DropdownMenuItem>
              {!user.isPremium && (
                <DropdownMenuItem asChild>
                  <Link href="/profil?tab=premium" className="flex items-center gap-2 text-amber-600 font-medium">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Upgrade Premium
                  </Link>
                </DropdownMenuItem>
              )}
              {user.role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sand-400" />
                    Panel Admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 text-red-500 focus:text-red-500"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
