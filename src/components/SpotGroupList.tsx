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
  Camera,
  Search,
  X,
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
  images?: string[];
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
  const [searchQuery, setSearchQuery] = useState("");

  const updateURL = useCallback((page: number, filter: string | null) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (filter) params.set("filter", filter);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const categoryFiltered = activeFilter
    ? spots.filter((s) => s.categorySlug === activeFilter)
    : spots;

  const filtered = searchQuery.trim()
    ? (() => {
        const q = searchQuery.trim().toLowerCase();
        return categoryFiltered.filter((s) =>
          (s.name_ja?.toLowerCase().includes(q)) ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      })()
    : categoryFiltered;

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

      {/* 検索バー */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              updateURL(1, activeFilter);
            }}
            placeholder="店名・エリア・キーワードで検索"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-ocean-500 placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
                updateURL(1, activeFilter);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* スポット一覧 */}
      <div id="spot-list" className="max-w-6xl mx-auto px-4 py-6">
        {/* 件数表示 */}
        {(filtered.length > SPOTS_PER_PAGE || searchQuery.trim()) && (
          <p className="text-xs text-stone-400 mb-3">
            {searchQuery.trim() && `「${searchQuery.trim()}」の検索結果: `}
            {filtered.length}件{filtered.length > SPOTS_PER_PAGE && `中 ${start + 1}–${Math.min(start + SPOTS_PER_PAGE, filtered.length)}件を表示`}
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
                <article className={`bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 ${theme?.hoverBorder ?? "hover:border-ocean-400 dark:hover:border-ocean-500"} hover:shadow-md transition-all overflow-hidden`}>
                  {/* 画像ギャラリー: 左1大 + 右2小の横並び */}
                  <div className="flex gap-0.5 h-28 sm:h-36 bg-stone-100 dark:bg-stone-700/50 rounded-t-xl overflow-hidden">
                    {/* メイン画像（左・大） */}
                    <div className="relative w-1/2">
                      {spot.images && spot.images[0] ? (
                        <img src={spot.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-750 dark:to-stone-800 flex flex-col items-center justify-center gap-1">
                          <Camera size={18} className="text-stone-300 dark:text-stone-500" />
                          <span className="text-[10px] text-stone-300 dark:text-stone-500">写真募集中</span>
                        </div>
                      )}
                    </div>
                    {/* サブ画像（右・2枚縦積み） */}
                    <div className="w-1/2 flex flex-col gap-0.5">
                      <div className="relative flex-1">
                        {spot.images && spot.images[1] ? (
                          <img src={spot.images[1]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-750 flex items-center justify-center">
                            <Camera size={14} className="text-stone-300 dark:text-stone-500" />
                          </div>
                        )}
                      </div>
                      <div className="relative flex-1">
                        {spot.images && spot.images[2] ? (
                          <>
                            <img src={spot.images[2]} alt="" className="w-full h-full object-cover" />
                            {spot.images.length > 3 && (
                              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-medium">
                                +{spot.images.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-750 dark:to-stone-800 flex items-center justify-center">
                            <Camera size={14} className="text-stone-300 dark:text-stone-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* テキストコンテンツ */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <h2 className={`text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100 truncate ${theme?.accentHover ?? "group-hover:text-ocean-700 dark:group-hover:text-ocean-400"} transition-colors`}>
                          {spot.name_ja ?? spot.name}
                        </h2>
                        {spot.name_ja && (
                          <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                            {spot.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!activeFilter && (
                          <span className={`text-[11px] ${theme?.badgeText ?? "text-ocean-600 dark:text-ocean-400"} ${theme?.badgeBg ?? "bg-ocean-50 dark:bg-ocean-900/30"} px-1.5 py-0.5 rounded`}>
                            {spot.categoryName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-stone-400 bg-stone-50 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                          <MapPin size={9} />
                          {spot.area}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-2 line-clamp-2">
                      {spot.description}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {spot.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {spot.status === "reported_closed" && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-red-500">
                            <AlertTriangle size={10} />
                            閉店の可能性
                          </span>
                        )}
                        {(!spot.status || spot.status === "unverified") && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-amber-500">
                            <Info size={10} />
                            未確認
                          </span>
                        )}
                        {spot.status === "verified" && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-green-500">
                            <CheckCircle2 size={10} />
                            確認済み
                          </span>
                        )}
                        {spot.phone && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-stone-400">
                            <Phone size={10} />
                            {spot.phone}
                          </span>
                        )}
                        {spot.website && (
                          <span className={`flex items-center gap-1 text-[11px] ${theme?.badgeText ?? "text-ocean-500"}`}>
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
