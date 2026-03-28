"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/utils";

const CATEGORIES = Object.entries(CATEGORY_LABELS);

interface ContentFiltersProps {
  searchParams: Record<string, string | undefined>;
}

export function ContentFilters({ searchParams }: ContentFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    startTransition(() => {
      router.push(`/knowledge-hub?${params.toString()}`);
    });
  }

  const hasFilters = searchParams.category || searchParams.type || searchParams.q;

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4">
      <div className="flex flex-wrap gap-3">
        {/* Category */}
        <Select
          value={searchParams.category ?? "all"}
          onValueChange={(v) => update("category", v)}
        >
          <SelectTrigger className="h-9 w-44 border-sand-300 text-sm">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {CATEGORIES.map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select
          value={searchParams.type ?? "all"}
          onValueChange={(v) => update("type", v)}
        >
          <SelectTrigger className="h-9 w-36 border-sand-300 text-sm">
            <SelectValue placeholder="Tipe Konten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="ARTICLE">Artikel</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="MODULE">Modul</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); update("q", (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value || undefined); }}
          className="flex gap-2 flex-1 min-w-[200px]"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sand-400" />
            <Input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Cari konten..."
              className="pl-8 h-9 border-sand-300 text-sm focus:border-forest-500"
            />
          </div>
          <Button type="submit" size="sm" className="h-9 bg-forest-500 text-white">
            Cari
          </Button>
        </form>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => router.push("/knowledge-hub"))}
            className="h-9 text-sand-500 hover:text-forest-500 text-sm"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
