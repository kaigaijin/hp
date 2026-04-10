"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Globe,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

const placeS_PER_PAGE = 20;

type placeItem = {
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

type placeGroupTheme = {
  filterActive: string;
  hoverBorder: string;
  numberText: string;
  accentHover: string;
  badgeBg: string;
  badgeText: string;
  accentBar?: string;
};

type placeGroupListProps = {
  places: placeItem[];
  subCategories: SubCategory[];
  countryCode: string;
  theme?: placeGroupTheme;
};

export default function placeGroupList(props: placeGroupListProps) {
  return (
    <Suspense fallback={null}>
      <placeGroupListInner {...props} />
    </Suspense>
  );
}

function placeGroupListInner({
  places,
  subCategories,
  countryCode,
  theme,
}: placeGroupListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialFilter = searchParams.get("filter") || null;

  const [activeFilter, setActiveFilter] = useState<string | null>(initialFilter);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [shuffledplaces, setShuffledplaces] = useState(places);

  useEffect(() => {
    setShuffledplaces([...places].sort(() => Math.random() - 0.5));
  }, [places]);

  const updateURL = useCallback((page: number, filter: string | null) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (filter) params.set("filter", filter);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const categoryFiltered = activeFilter
    ? shuffledplaces.filter((s) => s.categorySlug === activeFilter)
    : shuffledplaces;

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

  const totalPages = Math.ceil(filtered.length / placeS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const start = (safeCurrentPage - 1) * placeS_PER_PAGE;
  const paginated = filtered.slice(start, start + placeS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    updateURL(page, activeFilter);
    document.getElementById("place-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFilterChange = (slug: string | null) => {
    setActiveFilter(slug);
    setCurrentPage(1);
    updateURL(1, slug);
  };

  const accentBarClass = theme?.accentBar ?? "bg-warm-400";

  return (
    <>
      {/* 中分類フィルター */}
      {subCategories.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-hide">
            <button
              onClick={() => handleFilterChange(null)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === null
                  ? (theme?.filterActive ?? "text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30")
                  : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700"
              }`}
            >
              すべて（{places.length}）
            </button>
            {subCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  handleFilterChange(activeFilter === cat.slug ? null : cat.slug)
                }
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  activeFilter === cat.slug
                    ? (theme?.filterActive ?? "text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30")
                    : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700"
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
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
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
      <div id="place-list" className="max-w-6xl mx-auto px-4 py-6">
        {/* 件数表示 */}
        {(filtered.length > placeS_PER_PAGE || searchQuery.trim()) && (
          <p className="text-xs text-stone-400 mb-3">
            {searchQuery.trim() && `「${searchQuery.trim()}」の検索結果: `}
            {filtered.length}件{filtered.length > placeS_PER_PAGE && `中 ${start + 1}–${Math.min(start + placeS_PER_PAGE, filtered.length)}件を表示`}
          </p>
        )}

        {paginated.length > 0 ? (
          <div className="space-y-3">
            {paginated.map((place) => {
              const isClosed = place.status === "reported_closed";
              return (
                <Link
                  key={`${place.categorySlug}-${place.slug}`}
                  href={`/${countryCode}/place/${place.categorySlug}/${place.slug}`}
                  className="group block"
                >
                  <article className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 ${theme?.hoverBorder ?? "hover:border-warm-400 dark:hover:border-warm-500"} hover:shadow-md transition-all overflow-hidden flex ${isClosed ? "opacity-60 pointer-events-none" : ""}`}>
                    {/* カラーアクセントバー */}
                    <div className={`w-1.5 shrink-0 ${isClosed ? "bg-red-400" : accentBarClass}`} />
                    {/* 本体 */}
                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                      {/* 上段: スポット名 + バッジ */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h2 className={`text-base font-bold text-stone-800 dark:text-stone-100 truncate ${theme?.accentHover ?? "group-hover:text-warm-700 dark:group-hover:text-warm-400"} transition-colors`}>
                            {place.name_ja ?? place.name}
                          </h2>
                          {place.name_ja && (
                            <p className="text-xs text-stone-400 truncate mt-0.5">{place.name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {!activeFilter && (
                            <span className={`text-xs ${theme?.badgeText ?? "text-warm-600 dark:text-warm-400"} ${theme?.badgeBg ?? "bg-warm-50 dark:bg-warm-900/30"} px-2 py-0.5 rounded-full`}>
                              {place.categoryName}
                            </span>
                          )}
                          <span className="text-xs text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MapPin size={9} />
                            {place.area}
                          </span>
                        </div>
                      </div>

                      {/* 説明文 */}
                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 mb-3">
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
                            <span className="text-xs text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              確認済み
                            </span>
                          )}
                          {place.status === "reported_closed" && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              閉店の可能性
                            </span>
                          )}
                          {place.website && (
                            <span className={`flex items-center gap-1 text-xs ${theme?.badgeText ?? "text-warm-500"}`}>
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
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
