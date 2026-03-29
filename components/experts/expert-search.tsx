"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpertCard, type ExpertCardData } from "@/components/experts/expert-card";
import { ExpertCardSkeleton } from "@/components/experts/expert-card-skeleton";
import { matchExperts } from "@/lib/matching-algorithm";
import { SPECIALIZATION_LABELS } from "@/lib/utils";
import type { Assessment } from "@prisma/client";

const SPEC_OPTIONS = Object.entries(SPECIALIZATION_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}));

interface ExpertSearchProps {
  initialExperts: ExpertCardData[];
  total: number;
  page: number;
  perPage: number;
  assessment: Assessment | null;
  searchParams: Record<string, string | undefined>;
}

export function ExpertSearch({
  initialExperts,
  total,
  page,
  perPage,
  assessment,
  searchParams,
}: ExpertSearchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.q ?? "");

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
    );
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`/cari-pakar?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", query || undefined);
  }

  function clearFilters() {
    setQuery("");
    startTransition(() => {
      router.push("/cari-pakar");
    });
  }

  const hasFilters = searchParams.q || searchParams.spec || searchParams.location || searchParams.sortBy;

  // Compute match scores client-side if assessment exists
  const experts: ExpertCardData[] = assessment
    ? (() => {
        const matches = matchExperts(assessment, initialExperts as any, initialExperts.length);
        return matches.map((m) => ({
          ...(m.expert as unknown as ExpertCardData),
          matchScore: m.score,
          matchReasons: m.reasons,
        }));
      })()
    : initialExperts;

  const above50 = experts.filter((e) => (e.matchScore ?? 101) >= 50);
  const below50 = experts.filter((e) => (e.matchScore ?? 101) < 50);

  return (
    <div className="space-y-5">
      {/* Search + filters bar */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4 space-y-4">
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama pakar..."
              className="pl-9 h-10 border-sand-300 focus:border-forest-500"
            />
          </div>
          <Button
            type="submit"
            className="bg-forest-500 hover:bg-forest-600 text-white h-10 px-5"
          >
            Cari
          </Button>
        </form>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-sand-500">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter:</span>
          </div>

          <Select
            value={searchParams.spec ?? "all"}
            onValueChange={(v) => updateFilter("spec", v)}
          >
            <SelectTrigger className="h-9 w-44 border-sand-300 text-sm">
              <SelectValue placeholder="Spesialisasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Spesialisasi</SelectItem>
              {SPEC_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.location ?? "all"}
            onValueChange={(v) => updateFilter("location", v)}
          >
            <SelectTrigger className="h-9 w-40 border-sand-300 text-sm">
              <SelectValue placeholder="Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="OFFLINE">Tatap Muka</SelectItem>
              <SelectItem value="BOTH">Online & Tatap Muka</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.sortBy ?? "rating"}
            onValueChange={(v) => updateFilter("sortBy", v)}
          >
            <SelectTrigger className="h-9 w-36 border-sand-300 text-sm">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating Tertinggi</SelectItem>
              <SelectItem value="price-asc">Harga Terendah</SelectItem>
              <SelectItem value="price-desc">Harga Tertinggi</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-sand-500 hover:text-forest-500 text-sm"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Hapus filter
            </Button>
          )}
        </div>
      </div>

      {/* Matching info */}
      {assessment && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-olive-50 border border-olive-100 text-sm text-olive-600">
          <span className="text-lg">✨</span>
          <span>
            Diurutkan berdasarkan kecocokan dengan asesmen{" "}
            <strong>{(assessment as any).childName}</strong>
          </span>
        </div>
      )}

      {/* Results */}
      {isPending ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExpertCardSkeleton key={i} />
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-forest-500 mb-2">
            Tidak ada pakar ditemukan
          </h3>
          <p className="text-sand-500 text-sm">
            Coba ubah filter atau kata kunci pencarian Anda.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 border-sand-300">
            Hapus semua filter
          </Button>
        </div>
      ) : assessment ? (
        /* ── Split view: above 50% / below 50% ── */
        <div className="space-y-8">
          {/* Section: ≥50% */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-forest-500">
                Sangat Cocok
              </h3>
              <div className="flex-1 h-px bg-forest-100" />
              <span className="text-xs text-sand-400">{above50.length} pakar</span>
            </div>
            {above50.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sand-300 bg-white p-6 text-center text-sand-400 text-sm">
                Tidak ada pakar dengan kecocokan di atas 50% untuk filter ini.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {above50.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>
            )}
          </div>

          {/* Section: <50% */}
          {below50.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-sand-500">
                  Kurang Cocok
                </h3>
                <div className="flex-1 h-px bg-sand-200" />
                <span className="text-xs text-sand-400">{below50.length} pakar</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {below50.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {total > perPage && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1))} className="border-sand-300">
                Sebelumnya
              </Button>
              <span className="text-sm text-sand-500">
                Halaman {page} dari {Math.ceil(total / perPage)}
              </span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / perPage)} onClick={() => updateFilter("page", String(page + 1))} className="border-sand-300">
                Berikutnya
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ── Normal view: no assessment ── */
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>

          {total > perPage && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1))} className="border-sand-300">
                Sebelumnya
              </Button>
              <span className="text-sm text-sand-500">
                Halaman {page} dari {Math.ceil(total / perPage)}
              </span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / perPage)} onClick={() => updateFilter("page", String(page + 1))} className="border-sand-300">
                Berikutnya
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
