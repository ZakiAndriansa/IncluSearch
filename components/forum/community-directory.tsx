"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  ExternalLink,
  Mail,
  Phone,
  Search,
  X,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { ABK_FOCUS_LABELS } from "@/lib/utils";
import type { Community, ABKFocusType, OrgType } from "@prisma/client";

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  FOUNDATION: "Yayasan",
  SCHOOL: "Sekolah",
  THERAPY_CENTER: "Pusat Terapi",
  SUPPORT_GROUP: "Kelompok Dukungan",
  GOVERNMENT: "Pemerintah",
  NGO: "LSM",
};

const ORG_TYPE_COLOR: Record<OrgType, string> = {
  FOUNDATION: "bg-forest-50 text-forest-500 border-forest-100",
  SCHOOL: "bg-teal-dark/5 text-teal-dark border-teal-dark/20",
  THERAPY_CENTER: "bg-olive-50 text-olive-600 border-olive-100",
  SUPPORT_GROUP: "bg-teal-light/10 text-teal-light border-teal-light/30",
  GOVERNMENT: "bg-sand-100 text-sand-700 border-sand-200",
  NGO: "bg-amber-50 text-amber-600 border-amber-100",
};

interface CommunityDirectoryProps {
  communities: Community[];
  total: number;
  page: number;
  perPage: number;
  provinces: string[];
  searchParams: Record<string, string | undefined>;
}

export function CommunityDirectory({
  communities,
  total,
  page,
  perPage,
  provinces,
  searchParams,
}: CommunityDirectoryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / perPage);

  function update(key: string, value: string | undefined) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
    );
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => router.push(`/forum?${params.toString()}`));
  }

  const hasFilters =
    searchParams.province || searchParams.type || searchParams.focus || searchParams.q;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            update("q", q || undefined);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
            <Input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Cari nama komunitas..."
              className="pl-9 h-10 border-sand-300 text-sm focus:border-forest-500"
            />
          </div>
          <Button type="submit" className="h-10 bg-forest-500 text-white">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-3">
          <Select
            value={searchParams.province ?? "all"}
            onValueChange={(v) => update("province", v)}
          >
            <SelectTrigger className="h-9 w-44 border-sand-300 text-sm">
              <SelectValue placeholder="Provinsi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Provinsi</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.type ?? "all"}
            onValueChange={(v) => update("type", v)}
          >
            <SelectTrigger className="h-9 w-44 border-sand-300 text-sm">
              <SelectValue placeholder="Tipe Organisasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {Object.entries(ORG_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.focus ?? "all"}
            onValueChange={(v) => update("focus", v)}
          >
            <SelectTrigger className="h-9 w-44 border-sand-300 text-sm">
              <SelectValue placeholder="Fokus ABK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Fokus</SelectItem>
              {Object.entries(ABK_FOCUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startTransition(() => router.push("/forum"))}
              className="h-9 text-sand-500 hover:text-forest-500 text-sm"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Community cards */}
      {communities.length === 0 ? (
        <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">🏘️</div>
          <h3 className="font-semibold text-forest-500 mb-2">
            Tidak ada komunitas ditemukan
          </h3>
          <p className="text-sand-500 text-sm">Coba ubah filter pencarian Anda.</p>
        </div>
      ) : (
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${
            isPending ? "opacity-60" : ""
          }`}
          aria-busy={isPending}
        >
          {communities.map((community) => (
            <div
              key={community.id}
              className="bg-white rounded-2xl border border-sand-200 hover:border-teal-dark/30 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {community.logoUrl ? (
                      <Image
                        src={community.logoUrl}
                        alt={community.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-sand-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-forest-500 text-sm leading-tight truncate">
                        {community.name}
                      </h3>
                      {community.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-dark flex-shrink-0" />
                      )}
                    </div>
                    <Badge
                      className={`mt-1 text-[10px] border ${ORG_TYPE_COLOR[community.orgType]}`}
                    >
                      {ORG_TYPE_LABELS[community.orgType]}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-sand-600 line-clamp-2 mb-3 leading-relaxed">
                  {community.description}
                </p>

                {/* Focus areas */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {community.focusAreas.slice(0, 3).map((focus) => (
                    <Badge
                      key={focus}
                      variant="secondary"
                      className="text-[10px] bg-sand-100 text-sand-600 border-sand-200"
                    >
                      {ABK_FOCUS_LABELS[focus] ?? focus}
                    </Badge>
                  ))}
                  {community.focusAreas.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-sand-100 text-sand-400"
                    >
                      +{community.focusAreas.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-sand-400 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {community.province}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {community.memberCount.toLocaleString("id-ID")} anggota
                  </span>
                </div>

                {/* Contact links */}
                <div className="flex items-center gap-2 pt-3 border-t border-sand-100">
                  {community.contactEmail && (
                    <a
                      href={`mailto:${community.contactEmail}`}
                      className="flex items-center gap-1 text-xs text-teal-dark hover:text-teal-dark/80 transition-colors tap-target"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                  {community.contactPhone && (
                    <a
                      href={`tel:${community.contactPhone}`}
                      className="flex items-center gap-1 text-xs text-teal-dark hover:text-teal-dark/80 transition-colors tap-target"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Telepon
                    </a>
                  )}
                  {community.website && (
                    <a
                      href={community.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-dark hover:text-teal-dark/80 transition-colors ml-auto tap-target"
                    >
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(page - 1));
              router.push(`/forum?${params.toString()}`);
            }}
            className="border-sand-300"
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-sand-500 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(page + 1));
              router.push(`/forum?${params.toString()}`);
            }}
            className="border-sand-300"
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  );
}
