import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Server-friendly pagination (link-based). `query` holds any extra search
// params to preserve across pages.
export function Pagination({
  basePath,
  page,
  totalPages,
  query = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams({ ...query, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  const btn =
    "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-sand-200 text-sand-600 hover:bg-sand-100";
  const disabled = "opacity-40 pointer-events-none";

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      {page <= 1 ? (
        <span className={`${btn} ${disabled}`}><ChevronLeft className="w-4 h-4" /></span>
      ) : (
        <Link href={href(page - 1)} className={btn} aria-label="Sebelumnya">
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
      <span className="text-sm text-sand-500">
        Halaman {page} / {totalPages}
      </span>
      {page >= totalPages ? (
        <span className={`${btn} ${disabled}`}><ChevronRight className="w-4 h-4" /></span>
      ) : (
        <Link href={href(page + 1)} className={btn} aria-label="Berikutnya">
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
