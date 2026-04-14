"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Globe,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { GroupTheme } from "@/lib/group-theme";

const PLACES_PER_PAGE = 20;

type place = {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string;
  description?: string;
  tags: string[];
  status?: string;
  phone?: string | null;
  website?: string | null;
};

type Props = {
  places: place[];
  countryCode: string;
  categorySlug: string;
  catTheme: GroupTheme;
};

export default function placeCategoryList(props: Props) {
  if (props.places.length === 0) return null;

  return (
    <Suspense fallback={null}>
      <PlaceCategoryListInner {...props} />
    </Suspense>
  );
}

function PlaceCategoryListInner({ places, countryCode, categorySlug, catTheme }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const updateURL = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const totalPages = Math.ceil(places.length / PLACES_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const start = (safeCurrentPage - 1) * PLACES_PER_PAGE;
  const paginated = places.slice(start, start + PLACES_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    updateURL(page);
    document.getElementById("place-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="place-list" className="space-y-3">
      {/* 件数表示 */}
      {totalPages > 1 && (
        <p className="text-xs text-stone-400 mb-3">
          {places.length}件中 {start + 1}–{Math.min(start + PLACES_PER_PAGE, places.length)}件を表示
        </p>
      )}

      {paginated.map((place) => {
        const isClosed = place.status === "reported_closed";
        return (
          <Link
            key={place.slug}
            href={`/${countryCode}/place/${categorySlug}/${place.slug}`}
            className={`group block ${isClosed ? "opacity-60 pointer-events-none" : ""}`}
          >
            <article className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 ${isClosed ? "" : catTheme.hoverBorder} hover:shadow-md transition-all overflow-hidden flex`}>
              {/* カラーアクセントバー */}
              <div className={`w-1.5 shrink-0 ${isClosed ? "bg-red-400" : catTheme.accentBar}`} />

              {/* 本体 */}
              <div className="flex-1 p-4 sm:p-5 min-w-0">
                {/* 上段: 店名 + エリア */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h2 className={`text-base font-bold truncate transition-colors ${isClosed ? "text-stone-400 dark:text-stone-500" : `text-stone-800 dark:text-stone-100 ${catTheme.accentHover}`}`}>
                      {place.name_ja ?? place.name}
                    </h2>
                    {place.name_ja && (
                      <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {place.name}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    <MapPin size={9} />
                    {place.area}
                  </span>
                </div>

                {/* 説明文 */}
                <p className={`text-sm leading-relaxed mb-3 line-clamp-2 ${isClosed ? "text-stone-400 dark:text-stone-500" : "text-stone-500 dark:text-stone-400"}`}>
                  {place.description}
                </p>

                {/* 下段: タグ + ステータス */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {place.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {place.status === "verified" && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 size={10} />
                        確認済み
                      </span>
                    )}
                    {place.status === "reported_closed" && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle size={10} />
                        閉店の可能性
                      </span>
                    )}
                    {place.website && (
                      <span className={`flex items-center gap-1 text-xs ${catTheme.accent}`}>
                        <Globe size={10} />
                        Web
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        );
      })}

      {/* ページネーション */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1 mt-8" aria-label="ページネーション">
          <button
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="前のページ"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const show =
              page === 1 ||
              page === totalPages ||
              Math.abs(page - safeCurrentPage) <= 1;
            const showEllipsis =
              !show &&
              (page === 2 || page === totalPages - 1);

            if (showEllipsis) {
              return (
                <span key={page} className="px-1 text-stone-400">
                  ...
                </span>
              );
            }
            if (!show) return null;

            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  page === safeCurrentPage
                    ? "bg-warm-600 text-white"
                    : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
                aria-current={page === safeCurrentPage ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="次のページ"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </div>
  );
}
