"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

type Pickupplace = {
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
  places: Pickupplace[],
  countryCode: string,
): Pickupplace | undefined {
  if (places.length === 0) return undefined;
  if (countryCode === "sg") {
    const enplaces = places.filter((s) =>
      s.tags?.some((t) => t === "ENグループ"),
    );
    if (enplaces.length > 0 && Math.random() < 0.5) {
      return enplaces[Math.floor(Math.random() * enplaces.length)];
    }
  }
  return places[Math.floor(Math.random() * places.length)];
}

type PickupGroupTheme = {
  badgeBg: string;
  badgeText: string;
  hoverBorder: string;
  accentHover: string;
};

export default function placePickup({
  places,
  countryCode,
  groups,
  groupThemes,
}: {
  places: Pickupplace[];
  countryCode: string;
  groups: string[];
  groupThemes?: Record<string, PickupGroupTheme>;
}) {
  const [picked, setPicked] = useState<Pickupplace[]>([]);

  useEffect(() => {
    const result: Pickupplace[] = [];
    const used = new Set<string>();

    for (const groupSlug of groups) {
      const candidates = places.filter(
        (s) => s.group === groupSlug && !used.has(s.slug),
      );
      const p = pickFromGroup(candidates, countryCode);
      if (p) {
        result.push(p);
        used.add(p.slug);
      }
    }

    const remaining = places.filter((s) => !used.has(s.slug));
    while (result.length < 7 && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      result.push(remaining.splice(idx, 1)[0]);
    }

    setPicked(result);
  }, [places, countryCode, groups]);

  if (picked.length === 0) return null;

  return (
    <section className="mt-12">
      <p className="section-label mb-5">— PICKUP</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {picked.map((place) => {
          const t = groupThemes?.[place.group];
          return (
            <Link
              key={`${place.category}-${place.slug}`}
              href={`/${countryCode}/place/${place.category}/${place.slug}`}
            >
              <article className={`group bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 ${t?.hoverBorder ?? "hover:border-warm-400 dark:hover:border-warm-500"} hover:shadow-md transition-all p-4 flex flex-col h-full`}>
                {/* カテゴリバッジ + エリア */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`${t?.badgeBg ?? "bg-warm-50 dark:bg-warm-900/30"} ${t?.badgeText ?? "text-warm-600 dark:text-warm-400"} text-xs px-2.5 py-1 rounded-full font-medium`}>
                    {place.categoryName}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {place.area}
                  </span>
                </div>
                {/* スポット名 */}
                <h3 className={`text-base font-bold text-stone-800 dark:text-stone-100 ${t?.accentHover ?? "group-hover:text-warm-700 dark:group-hover:text-warm-400"} transition-colors mb-1 flex-1`}>
                  {place.name_ja ?? place.name}
                </h3>
                {place.name_ja && (
                  <p className="text-xs text-stone-400 truncate">{place.name}</p>
                )}
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
