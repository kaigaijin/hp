import Link from "next/link";
import type { Country } from "@/lib/countries";
import { ArrowRight, Users, MapPin } from "lucide-react";

export default function CountryCard({ country, placeCount = 0 }: { country: Country; placeCount?: number }) {
  return (
    <Link href={`/${country.code}`} prefetch={false} className="block h-full group">
      <article className="country-card bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 overflow-hidden h-full flex flex-col group-hover:border-warm-400 dark:group-hover:border-warm-600">
        {/* 国旗エリア（フルワイド） */}
        <div className="relative bg-gradient-to-br from-warm-50 to-sand-100 dark:from-stone-700 dark:to-stone-800 px-6 pt-7 pb-5 flex flex-col items-center">
          <span className="text-5xl mb-3">{country.flag}</span>
          <h3 className="heading-editorial text-xl font-bold text-stone-900 dark:text-stone-100">
            {country.name}
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{country.nameEn}</p>
        </div>

        {/* タグライン */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
          <p className="text-xs text-stone-500 dark:text-stone-400 italic text-center">
            {country.tagline}
          </p>
          <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
        </div>

        {/* トピック */}
        <div className="px-6 pt-2 pb-4 flex flex-wrap gap-2">
          {country.topics.map((topic) => (
            <span
              key={topic}
              className="text-xs text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-600 pb-0.5"
            >
              {topic}
            </span>
          ))}
        </div>

        {/* スポット件数 + 在住者数 */}
        <div className="px-6 pb-4 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{country.population}</span>
          </div>
          {placeCount > 0 && (
            <>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <div className="flex items-center gap-1">
                <MapPin size={11} />
                <span>{placeCount.toLocaleString()}件</span>
              </div>
            </>
          )}
        </div>

        {/* CTA — カード底部全幅 */}
        <div className="mt-auto border-t border-stone-100 dark:border-stone-700 px-6 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium text-warm-600 dark:text-warm-400">
            記事を読む
          </span>
          <ArrowRight
            size={14}
            className="text-warm-500 dark:text-warm-400 group-hover:translate-x-1 transition-transform"
          />
        </div>
      </article>
    </Link>
  );
}
