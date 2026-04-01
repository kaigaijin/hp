"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
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
      {displayed.map((spot) => (
        <Link
          key={spot.slug}
          href={`/${countryCode}/spot/${categorySlug}/${spot.slug}`}
          className="group block"
        >
          <article className={`bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 ${catTheme.hoverBorder} hover:shadow-md transition-all`}>
            <div className="p-4 sm:p-5">
              {/* 上段: 店名 + エリア */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h2 className={`text-base font-bold text-stone-800 dark:text-stone-100 truncate ${catTheme.accentHover} transition-colors`}>
                    {spot.name_ja ?? spot.name}
                  </h2>
                  {spot.name_ja && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {spot.name}
                    </p>
                  )}
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded">
                  <MapPin size={10} />
                  {spot.area}
                </span>
              </div>

              {/* 説明文 */}
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3 line-clamp-2">
                {spot.description}
              </p>

              {/* 下段: タグ + 連絡先 */}
              <div className="flex items-center justify-between gap-4">
                {/* タグ */}
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

                {/* ステータス + 連絡先 */}
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
      ))}
    </div>
  );
}
