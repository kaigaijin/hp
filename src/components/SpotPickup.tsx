"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

type PickupSpot = {
  slug: string;
  name: string;
  name_ja: string | null | undefined;
  area: string;
  category: string;
  categoryName: string;
  tags?: string[];
  group: string; // categoryGroupのslug
};

// SGではENグループのスポットを50%の確率でグルメ枠に選出
function pickFromGroup(
  spots: PickupSpot[],
  countryCode: string,
): PickupSpot | undefined {
  if (spots.length === 0) return undefined;
  if (countryCode === "sg") {
    const enSpots = spots.filter((s) =>
      s.tags?.some((t) => t === "ENグループ"),
    );
    if (enSpots.length > 0 && Math.random() < 0.5) {
      return enSpots[Math.floor(Math.random() * enSpots.length)];
    }
  }
  return spots[Math.floor(Math.random() * spots.length)];
}

type PickupGroupTheme = {
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
  accentHover: string;
};

export default function SpotPickup({
  spots,
  countryCode,
  groups,
  groupThemes,
}: {
  spots: PickupSpot[];
  countryCode: string;
  groups: string[];
  groupThemes?: Record<string, PickupGroupTheme>;
}) {
  const [picked, setPicked] = useState<PickupSpot[]>([]);

  useEffect(() => {
    const result: PickupSpot[] = [];
    const used = new Set<string>();

    for (const groupSlug of groups) {
      const candidates = spots.filter(
        (s) => s.group === groupSlug && !used.has(s.slug),
      );
      const p = pickFromGroup(candidates, countryCode);
      if (p) {
        result.push(p);
        used.add(p.slug);
      }
    }

    const remaining = spots.filter((s) => !used.has(s.slug));
    while (result.length < 7 && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      result.push(remaining.splice(idx, 1)[0]);
    }

    setPicked(result);
  }, [spots, countryCode, groups]);

  if (picked.length === 0) return null;

  return (
    <section className="mt-12">
      <p className="section-label mb-5">— PICKUP</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {picked.map((spot) => {
          const t = groupThemes?.[spot.group];
          return (
            <Link
              key={`${spot.category}-${spot.slug}`}
              href={`/${countryCode}/place/${spot.category}/${spot.slug}`}
            >
              <article className={`group bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 ${t?.hoverBorder ?? "hover:border-warm-400 dark:hover:border-warm-500"} hover:shadow-md transition-all p-4 flex flex-col h-full`}>
                {/* カテゴリバッジ + エリア */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`${t?.badgeBg ?? "bg-warm-50 dark:bg-warm-900/30"} ${t?.badgeText ?? "text-warm-600 dark:text-warm-400"} text-xs px-2.5 py-1 rounded-full font-medium`}>
                    {spot.categoryName}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {spot.area}
                  </span>
                </div>
                {/* スポット名 */}
                <h3 className={`text-base font-bold text-stone-800 dark:text-stone-100 ${t?.accentHover ?? "group-hover:text-warm-700 dark:group-hover:text-warm-400"} transition-colors mb-1 flex-1`}>
                  {spot.name_ja ?? spot.name}
                </h3>
                {spot.name_ja && (
                  <p className="text-xs text-stone-400 truncate">{spot.name}</p>
                )}
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
