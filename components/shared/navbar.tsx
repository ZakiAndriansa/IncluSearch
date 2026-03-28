"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Crown, Menu } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 bg-white/90 backdrop-blur-md h-16 hidden lg:flex">
      <div className="flex items-center justify-between w-full px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center">
            <span className="text-white font-bold font-serif text-lg">O</span>
          </div>
          <span className="font-semibold text-forest-500 text-lg hidden xl:block">
            IncluSearch
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Premium badge */}
          {user.isPremium && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">
                Premium
              </span>
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative tap-target">
            <Bell className="w-5 h-5 text-sand-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-olive-500" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-sand-100 transition-colors tap-target">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                  <AvatarFallback className="bg-forest-100 text-forest-500 text-sm font-semibold">
                    {getInitials(user.name ?? user.email ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden xl:block">
                  <div className="text-sm font-medium text-forest-500 leading-none">
                    {user.name ?? "Pengguna"}
                  </div>
                  <div className="text-xs text-sand-500 mt-0.5 leading-none">
                    {user.role === "PARENT"
                      ? "Orang Tua / Guru"
                      : user.role === "EXPERT"
                      ? "Pakar"
                      : "Admin"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="font-semibold text-forest-500">
                  {user.name}
                </div>
                <div className="text-xs text-sand-500 mt-0.5">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profil">Profil Saya</Link>
              </DropdownMenuItem>
              {!user.isPremium && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/profil?tab=premium"
                    className="text-amber-600 font-medium"
                  >
                    <Crown className="w-4 h-4 mr-2 text-amber-500" />
                    Upgrade Premium
                  </Link>
                </DropdownMenuItem>
              )}
              {user.role === "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Panel Admin</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-red-500 focus:text-red-500"
              >
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
