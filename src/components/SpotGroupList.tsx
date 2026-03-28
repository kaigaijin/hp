"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SPOTS_PER_PAGE = 20;

type SpotItem = {
  slug: string;
  name: string;
  name_ja?: string;
  area: string;
  description: string;
  tags: string[];
  phone?: string | null;
  website?: string | null;
  status?: string;
  categorySlug: string;
  categoryName: string;
};

type SubCategory = {
  slug: string;
  name: string;
  count: number;
};

type SpotGroupTheme = {
  filterActive: string;
  hoverBorder: string;
  numberText: string;
  accentHover: string;
  badgeBg: string;
  badgeText: string;
};

type SpotGroupListProps = {
  spots: SpotItem[];
  subCategories: SubCategory[];
  countryCode: string;
  theme?: SpotGroupTheme;
};

export default function SpotGroupList(props: SpotGroupListProps) {
  return (
    <Suspense fallback={null}>
      <SpotGroupListInner {...props} />
    </Suspense>
  );
}

function SpotGroupListInner({
  spots,
  subCategories,
  countryCode,
  theme,
}: SpotGroupListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialFilter = searchParams.get("filter") || null;

  const [activeFilter, setActiveFilter] = useState<string | null>(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const updateURL = useCallback((page: number, filter: string | null) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (filter) params.set("filter", filter);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const filtered = activeFilter
    ? spots.filter((s) => s.categorySlug === activeFilter)
    : spots;

  const totalPages = Math.ceil(filtered.length / SPOTS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const start = (safeCurrentPage - 1) * SPOTS_PER_PAGE;
  const paginated = filtered.slice(start, start + SPOTS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    updateURL(page, activeFilter);
    document.getElementById("spot-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFilterChange = (slug: string | null) => {
    setActiveFilter(slug);
    setCurrentPage(1);
    updateURL(1, slug);
  };

  return (
    <>
      {/* 中分類フィルター */}
      {subCategories.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 border-t border-stone-100 dark:border-stone-700">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-hide">
            <button
              onClick={() => handleFilterChange(null)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === null
                  ? (theme?.filterActive ?? "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30")
                  : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600"
              }`}
            >
              すべて（{spots.length}）
            </button>
            {subCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  handleFilterChange(activeFilter === cat.slug ? null : cat.slug)
                }
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  activeFilter === cat.slug
                    ? (theme?.filterActive ?? "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30")
                    : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600"
                }`}
              >
                {cat.name}（{cat.count}）
              </button>
            ))}
          </div>
        </div>
      )}

      {/* スポット一覧 */}
      <div id="spot-list" className="max-w-6xl mx-auto px-4 py-6">
        {/* 件数表示 */}
        {filtered.length > SPOTS_PER_PAGE && (
          <p className="text-xs text-stone-400 mb-3">
            {filtered.length}件中 {start + 1}–{Math.min(start + SPOTS_PER_PAGE, filtered.length)}件を表示
          </p>
        )}

        {paginated.length > 0 ? (
          <div className="space-y-3">
            {paginated.map((spot) => (
              <Link
                key={`${spot.categorySlug}-${spot.slug}`}
                href={`/${countryCode}/spot/${spot.categorySlug}/${spot.slug}`}
                className="group block"
              >
                <article className={`bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 ${theme?.hoverBorder ?? "hover:border-ocean-400 dark:hover:border-ocean-500"} hover:shadow-md transition-all`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h2 className={`text-base font-bold text-stone-800 dark:text-stone-100 truncate ${theme?.accentHover ?? "group-hover:text-ocean-700 dark:group-hover:text-ocean-400"} transition-colors`}>
                          {spot.name_ja ?? spot.name}
                        </h2>
                        {spot.name_ja && (
                          <p className="text-xs text-stone-400 mt-0.5">
                            {spot.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* 中分類ラベル（フィルター未選択時のみ表示） */}
                        {!activeFilter && (
                          <span className={`text-xs ${theme?.badgeText ?? "text-ocean-600 dark:text-ocean-400"} ${theme?.badgeBg ?? "bg-ocean-50 dark:bg-ocean-900/30"} px-2 py-0.5 rounded`}>
                            {spot.categoryName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded">
                          <MapPin size={10} />
                          {spot.area}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3 line-clamp-2">
                      {spot.description}
                    </p>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {spot.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {spot.status === "reported_closed" && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-red-500">
                            <AlertTriangle size={10} />
                            閉店の可能性
                          </span>
                        )}
                        {(!spot.status || spot.status === "unverified") && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-amber-500">
                            <Info size={10} />
                            未確認
                          </span>
                        )}
                        {spot.status === "verified" && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle2 size={10} />
                            確認済み
                          </span>
                        )}
                        {spot.phone && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-stone-400">
                            <Phone size={10} />
                            {spot.phone}
                          </span>
                        )}
                        {spot.website && (
                          <span className={`flex items-center gap-1 text-xs ${theme?.badgeText ?? "text-ocean-500"}`}>
                            <Globe size={10} />
                            Web
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-stone-400 text-sm">
            該当するスポットがありません
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-8" aria-label="ページネーション">
            <button
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === safeCurrentPage
                      ? "bg-ocean-600 text-white"
                      : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
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
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="次のページ"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
