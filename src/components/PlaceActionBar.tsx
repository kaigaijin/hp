"use client";

import { useEffect } from "react";
import { ExternalLink, Phone } from "lucide-react";
import { trackPlaceView, trackPlaceExternalClick } from "@/lib/analytics";
import PlaceFavoriteButton from "@/components/PlaceFavoriteButton";

type Props = {
  country: string;
  category: string;
  slug: string;
  website?: string | null;
  phone?: string | null;
  tags: string[];
  ctaBg: string;
  ctaHover: string;
  badgeText: string;
  badgeBg: string;
};

export default function PlaceActionBar({
  country,
  category,
  slug,
  website,
  phone,
  tags,
  ctaBg,
  ctaHover,
  badgeText,
  badgeBg,
}: Props) {
  // ページビュー計測（マウント時に1回）
  useEffect(() => {
    trackPlaceView({ country, category, place_slug: slug });
  }, [country, category, slug]);

  return (
    <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 sticky top-16 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 ${ctaBg} ${ctaHover} text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors`}
            onClick={() =>
              trackPlaceExternalClick({
                country,
                category,
                place_slug: slug,
                link_type: "website",
              })
            }
          >
            <ExternalLink size={14} />
            公式サイト
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-full px-5 py-2 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            onClick={() =>
              trackPlaceExternalClick({
                country,
                category,
                place_slug: slug,
                link_type: "phone",
              })
            }
          >
            <Phone size={14} />
            電話する
          </a>
        )}
        {/* タグ（ボタンの直後・左寄り） */}
        {tags.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={`text-xs font-medium ${badgeText} ${badgeBg} px-2.5 py-1 rounded-full`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1" />
        <PlaceFavoriteButton country={country} category={category} slug={slug} />
      </div>
    </div>
  );
}
