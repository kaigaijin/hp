"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";

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

export default function SpotPickup({
  spots,
  countryCode,
  groups,
}: {
  spots: PickupSpot[];
  countryCode: string;
  groups: string[]; // グループslugの配列（表示順）
}) {
  const [picked, setPicked] = useState<PickupSpot[]>([]);

  useEffect(() => {
    const result: PickupSpot[] = [];
    const used = new Set<string>();

    // 各グループからランダム1件
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

    // 7件未満なら残りからランダム補充
    const remaining = spots.filter((s) => !used.has(s.slug));
    while (result.length < 7 && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      result.push(remaining.splice(idx, 1)[0]);
    }

    setPicked(result);
  }, [spots, countryCode, groups]);

  if (picked.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
        ピックアップ
      </h2>
      <div className="space-y-2">
        {picked.map((spot) => (
          <Link
            key={`${spot.category}-${spot.slug}`}
            href={`/${countryCode}/spot/${spot.category}/${spot.slug}`}
            className="group flex items-center gap-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-3 hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-sm transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                  {spot.name_ja ?? spot.name}
                </p>
                {spot.name_ja && (
                  <span className="text-xs text-stone-400 hidden sm:inline truncate">
                    {spot.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                  <MapPin size={10} />
                  {spot.area}
                </span>
                <span className="text-xs text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 px-1.5 py-0.5 rounded">
                  {spot.categoryName}
                </span>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-stone-300 dark:text-stone-600 group-hover:text-ocean-500 transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
