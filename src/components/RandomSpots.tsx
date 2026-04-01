"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Spot = {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string;
};

type Props = {
  spots: Spot[];
  countryCode: string;
  categorySlug: string;
  accentClass: string;
  hoverBorderClass: string;
  categoryName: string;
  count?: number;
};

export default function RandomSpots({
  spots,
  countryCode,
  categorySlug,
  accentClass,
  hoverBorderClass,
  categoryName,
  count = 5,
}: Props) {
  const [displayed, setDisplayed] = useState<Spot[]>([]);

  useEffect(() => {
    const shuffled = [...spots].sort(() => Math.random() - 0.5);
    setDisplayed(shuffled.slice(0, count));
  }, [spots, count]);

  if (displayed.length === 0) return null;

  return (
    <div className="mt-4 pt-6 border-t border-stone-300 dark:border-stone-600">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          {categoryName}の他の場所
        </h2>
        <Link
          href={`/${countryCode}/spot/${categorySlug}`}
          className={`text-xs ${accentClass} hover:underline`}
        >
          すべて見る
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayed.map((s) => (
          <Link
            key={s.slug}
            href={`/${countryCode}/spot/${categorySlug}/${s.slug}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-600 text-sm text-stone-600 dark:text-stone-400 ${hoverBorderClass} transition-colors`}
          >
            {s.name_ja ?? s.name}
            {s.area && <span className="text-xs text-stone-400">· {s.area}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
