import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MatchBadge } from "@/components/experts/match-badge";
import { formatCurrency, getInitials, SPECIALIZATION_LABELS } from "@/lib/utils";
import type { ExpertProfile, User } from "@prisma/client";

export interface ExpertCardData extends ExpertProfile {
  user: Pick<User, "name" | "image" | "email">;
  matchScore?: number;
  matchReasons?: string[];
}

interface ExpertCardProps {
  expert: ExpertCardData;
  isPremium?: boolean;
  compact?: boolean;
}

export function ExpertCard({ expert, isPremium = false, compact = false }: ExpertCardProps) {
  const primarySpec = expert.specializations[0];

  return (
    <div className="bg-white rounded-2xl border border-sand-200 hover:border-teal-dark/30 hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Top: avatar + match badge */}
      <div className="relative p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <Avatar className="w-14 h-14 ring-2 ring-sand-200">
              <AvatarImage
                src={expert.profilePhotoUrl ?? expert.user.image ?? undefined}
                alt={expert.user.name ?? ""}
              />
              <AvatarFallback className="bg-forest-100 text-forest-500 text-lg font-bold">
                {getInitials(expert.user.name ?? "E")}
              </AvatarFallback>
            </Avatar>
            {expert.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-teal-dark border-2 border-white flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">✓</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-forest-500 text-sm leading-tight truncate">
                  {expert.user.name}
                </h3>
                {primarySpec && (
                  <p className="text-xs text-sand-500 mt-0.5">
                    {SPECIALIZATION_LABELS[primarySpec]}
                  </p>
                )}
              </div>
              {isPremium && expert.matchScore !== undefined && (
                <MatchBadge score={expert.matchScore} compact />
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-forest-500">
                {expert.rating.toFixed(1)}
              </span>
              <span className="text-xs text-sand-400">
                ({expert.totalReviews} ulasan)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Specialization tags */}
      {!compact && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {expert.specializations.slice(0, 3).map((spec) => (
            <Badge
              key={spec}
              variant="secondary"
              className="text-[10px] bg-sand-100 text-sand-700 border-sand-200 hover:bg-sand-200"
            >
              {SPECIALIZATION_LABELS[spec] ?? spec}
            </Badge>
          ))}
          {expert.specializations.length > 3 && (
            <Badge variant="secondary" className="text-[10px] bg-sand-100 text-sand-500">
              +{expert.specializations.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Info row */}
      <div className="px-4 pb-3 flex items-center gap-3 text-xs text-sand-500">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {expert.locationType === "ONLINE"
            ? "Online"
            : expert.locationType === "OFFLINE"
            ? expert.city ?? "Offline"
            : "Online & Offline"}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {expert.yearsExperience} thn pengalaman
        </div>
      </div>

      {/* Footer: price + CTA */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-sand-100 pt-3 mt-1">
        <div>
          <div className="text-xs text-sand-500">Mulai dari</div>
          <div className="text-sm font-bold text-forest-500">
            {formatCurrency(expert.hourlyRate)}
            <span className="text-xs font-normal text-sand-400">/sesi</span>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-forest-500 hover:bg-forest-600 text-white text-xs h-8 px-4 rounded-lg gap-1.5"
        >
          <Link href={`/cari-pakar/${expert.id}`}>
            <MessageCircle className="w-3.5 h-3.5" />
            Konsultasi
          </Link>
        </Button>
      </div>
    </div>
  );
}
