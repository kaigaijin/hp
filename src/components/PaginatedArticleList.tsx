"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Tag,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ARTICLES_PER_PAGE = 10;

type Article = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
};

type GroupCount = {
  slug: string;
  name: string;
  count: number;
};

type Props = {
  articles: Article[];
  countryCode: string;
  articleCategoryMap: Record<string, string[]>;
  groupCounts: GroupCount[];
  countryName: string;
};

export default function PaginatedArticleList(props: Props) {
  return (
    <Suspense fallback={null}>
      <PaginatedArticleListInner {...props} />
    </Suspense>
  );
}

function PaginatedArticleListInner({
  articles,
  countryCode,
  articleCategoryMap,
  groupCounts,
  countryName,
}: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
  const start = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = articles.slice(start, start + ARTICLES_PER_PAGE);

  const updateURL = useCallback((page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [pathname, router]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    updateURL(page);
    document.getElementById("article-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <h2 id="article-list" className="heading-editorial text-xl font-bold mb-6">
        {countryName}の記事
        {articles.length > ARTICLES_PER_PAGE && (
          <span className="text-sm font-normal text-stone-400 ml-2">
            {articles.length}件中 {start + 1}–{Math.min(start + ARTICLES_PER_PAGE, articles.length)}件
          </span>
        )}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {paginatedArticles.map((article) => {
          const relatedGroups = articleCategoryMap[article.category] ?? [];
          const relatedGroup = relatedGroups[0]
            ? groupCounts.find((g) => g.slug === relatedGroups[0] && g.count > 0)
            : null;

          return (
            <article
              key={article.slug}
              className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col country-card hover:border-warm-400 dark:hover:border-warm-500 transition-colors"
            >
              <Link
                href={`/${countryCode}/column/${article.slug}`}
                className="flex flex-col flex-1 p-5"
              >
                <div className="flex items-center gap-2 text-xs text-warm-600 dark:text-warm-400 font-medium mb-2">
                  <Tag size={12} />
                  {article.category}
                </div>

                <h3 className="heading-editorial text-base font-bold mb-2 leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-3 flex-1 line-clamp-2">
                  {article.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-stone-400">
                    <Calendar size={12} />
                    {article.date}
                  </div>
                  <div className="flex items-center gap-3">
                    {relatedGroup && (
                      <span
                        onClick={(e) => { e.preventDefault(); window.location.href = `/${countryCode}/place/${relatedGroup.slug}`; }}
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-warm-600 dark:hover:text-warm-400 transition-colors cursor-pointer"
                        title={`${relatedGroup.name}のKAIプレイス`}
                      >
                        <MapPin size={11} />
                        {relatedGroup.name}
                        {relatedGroup.count}件
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-warm-600 dark:text-warm-400 font-medium">
                      読む
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1 mt-8" aria-label="ページネーション">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="前のページ"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // 表示するページ番号を絞る（最初・最後・現在ページ周辺）
            const show =
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1;
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
                  page === currentPage
                    ? "bg-warm-600 text-white"
                    : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                }`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="次のページ"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </>
  );
}
