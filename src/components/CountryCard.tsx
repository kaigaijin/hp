import Link from "next/link";
import type { Country } from "@/lib/countries";
import { ArrowRight, Users, MapPin } from "lucide-react";

export default function CountryCard({ country, spotCount = 0 }: { country: Country; spotCount?: number }) {
  return (
    <Link href={`/${country.code}`}>
      <article className="country-card bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 h-full flex flex-col">
        {/* 国旗 + 名前 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-4xl">{country.flag}</span>
            <h3 className="heading-editorial text-lg font-bold mt-2">
              {country.name}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">{country.nameEn}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-400 bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-full">
            <Users size={12} />
            {country.population}
          </div>
        </div>

        {/* タグライン */}
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 italic">
          {country.tagline}
        </p>

        {/* トピック */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {country.topics.map((topic) => (
            <span
              key={topic}
              className="text-xs bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-300 px-2 py-0.5 rounded-full"
            >
              {topic}
            </span>
          ))}
        </div>

        {/* スポット件数 + CTA */}
        <div className="mt-auto flex items-center justify-between">
          {spotCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-stone-400">
              <MapPin size={12} />
              スポット {spotCount.toLocaleString()}件
            </div>
          )}
          <div className="flex items-center gap-1 text-sm font-medium text-ocean-600 dark:text-ocean-400 group">
            記事を読む
            <ArrowRight
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
