"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

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

export default function SpotGroupList({
  spots,
  subCategories,
  countryCode,
}: {
  spots: SpotItem[];
  subCategories: SubCategory[];
  countryCode: string;
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = activeFilter
    ? spots.filter((s) => s.categorySlug === activeFilter)
    : spots;

  return (
    <>
      {/* 中分類フィルター */}
      {subCategories.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 border-t border-stone-100 dark:border-stone-700">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-hide">
            <button
              onClick={() => setActiveFilter(null)}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeFilter === null
                  ? "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30"
                  : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600"
              }`}
            >
              すべて（{spots.length}）
            </button>
            {subCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  setActiveFilter(activeFilter === cat.slug ? null : cat.slug)
                }
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  activeFilter === cat.slug
                    ? "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30"
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((spot, i) => (
              <Link
                key={`${spot.categorySlug}-${spot.slug}`}
                href={`/${countryCode}/spot/${spot.categorySlug}/${spot.slug}`}
                className="group block"
              >
                <article className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-md transition-all">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ocean-600 dark:text-ocean-400">
                            {i + 1}
                          </span>
                          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 truncate group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                            {spot.name_ja ?? spot.name}
                          </h2>
                        </div>
                        {spot.name_ja && (
                          <p className="text-xs text-stone-400 mt-0.5 ml-5">
                            {spot.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* 中分類ラベル（フィルター未選択時のみ表示） */}
                        {!activeFilter && (
                          <span className="text-xs text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 px-2 py-0.5 rounded">
                            {spot.categoryName}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded">
                          <MapPin size={10} />
                          {spot.area}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3 ml-5 line-clamp-2">
                      {spot.description}
                    </p>

                    <div className="flex items-center justify-between gap-4 ml-5">
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
                          <span className="flex items-center gap-1 text-xs text-ocean-500">
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
      </div>
    </>
  );
}
