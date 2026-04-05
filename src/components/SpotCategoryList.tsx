"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Globe,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { GroupTheme } from "@/lib/group-theme";

type Spot = {
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
  spots: Spot[];
  countryCode: string;
  categorySlug: string;
  catTheme: GroupTheme;
};

export default function SpotCategoryList({ spots, countryCode, categorySlug, catTheme }: Props) {
  const [displayed, setDisplayed] = useState<Spot[]>([]);

  useEffect(() => {
    const shuffled = [...spots].sort(() => Math.random() - 0.5);
    setDisplayed(shuffled);
  }, [spots]);

  if (displayed.length === 0) return null;

  return (
    <div className="space-y-3">
      {displayed.map((spot) => {
        const isClosed = spot.status === "reported_closed";
        return (
          <Link
            key={spot.slug}
            href={`/${countryCode}/spot/${categorySlug}/${spot.slug}`}
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
                      {spot.name_ja ?? spot.name}
                    </h2>
                    {spot.name_ja && (
                      <p className="text-xs text-stone-400 mt-0.5 truncate">
                        {spot.name}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    <MapPin size={9} />
                    {spot.area}
                  </span>
                </div>

                {/* 説明文 */}
                <p className={`text-sm leading-relaxed mb-3 line-clamp-2 ${isClosed ? "text-stone-400 dark:text-stone-500" : "text-stone-500 dark:text-stone-400"}`}>
                  {spot.description}
                </p>

                {/* 下段: タグ + ステータス */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {spot.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {spot.status === "verified" && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 size={10} />
                        確認済み
                      </span>
                    )}
                    {spot.status === "reported_closed" && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle size={10} />
                        閉店の可能性
                      </span>
                    )}
                    {spot.website && (
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
    </div>
  );
}
