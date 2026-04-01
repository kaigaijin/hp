"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, X } from "lucide-react";

type SearchableSpot = {
  slug: string;
  name: string;
  name_ja?: string;
  area: string;
  category: string;
  categoryName: string;
  description: string;
  tags: string[];
};

export default function SpotSearch({
  spots,
  countryCode,
}: {
  spots: SearchableSpot[];
  countryCode: string;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return spots
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_ja && s.name_ja.includes(q)) ||
          s.description.includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q))
      )
      .slice(0, 10);
  }, [query, spots]);

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・エリア・キーワードで検索"
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 placeholder:text-stone-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 検索結果 */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((spot) => (
            <Link
              key={`${spot.category}-${spot.slug}`}
              href={`/${countryCode}/spot/${spot.category}/${spot.slug}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors border-b border-stone-100 dark:border-stone-700 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
                  {spot.name_ja ?? spot.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                    <MapPin size={10} />
                    {spot.area}
                  </span>
                  <span className="text-xs text-warm-600 dark:text-warm-400">
                    {spot.categoryName}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-lg z-50 px-4 py-6 text-center">
          <p className="text-sm text-stone-500">
            「{query}」に一致する結果が見つかりませんでした
          </p>
        </div>
      )}
    </div>
  );
}
