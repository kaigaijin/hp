import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpotMapLoader from "@/components/SpotMapLoader";
import { getCountry, countries } from "@/lib/countries";
import {
  getGeoSpots,
  getCategory,
  categoryGroups,
  getAllSpots,
} from "@/lib/directory";
import { ChevronRight } from "lucide-react";

// 国別のデフォルト中心座標
const countryCenter: Record<string, { lat: number; lng: number }> = {
  sg: { lat: 1.3521, lng: 103.8198 },
  th: { lat: 13.7563, lng: 100.5018 },
  my: { lat: 3.139, lng: 101.6869 },
  kr: { lat: 37.5665, lng: 126.978 },
  tw: { lat: 25.033, lng: 121.5654 },
  hk: { lat: 22.3193, lng: 114.1694 },
  ae: { lat: 25.2048, lng: 55.2708 },
  au: { lat: -33.8688, lng: 151.2093 },
};

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.code }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  return params.then(({ country: code }) => {
    const country = getCountry(code);
    if (!country) return {};
    return {
      title: `${country.name}のKAIスポット — 地図で探す`,
      description: `${country.name}の日本人向けスポットを地図上で探せます。`,
      robots: { index: false, follow: true },
    };
  });
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const geoSpots = getGeoSpots(code);
  const allSpots = getAllSpots(code);

  // 地図表示用データ
  const mapSpots = geoSpots.map((s) => ({
    slug: s.slug,
    name: s.name,
    name_ja: s.name_ja,
    area: s.area,
    category: s.category,
    categoryName: getCategory(s.category)?.name ?? s.category,
    lat: s.lat,
    lng: s.lng,
    priority: s.priority ?? 0,
    description: s.description,
    tags: s.tags,
  }));

  // カテゴリフィルタ用
  const catCounts: Record<string, number> = {};
  for (const s of geoSpots) {
    catCounts[s.category] = (catCounts[s.category] ?? 0) + 1;
  }
  const categoryFilters = Object.entries(catCounts)
    .map(([slug, count]) => ({
      slug,
      name: getCategory(slug)?.name ?? slug,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const center = countryCenter[code] ?? { lat: 0, lng: 0 };
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* コンパクトヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 shrink-0">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
              <Link href="/" className="hover:text-warm-600 transition-colors">トップ</Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-warm-600 transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/spot`} className="hover:text-warm-600 transition-colors">KAIスポット</Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">地図で探す</span>
            </nav>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                {country.flag} 地図で探す
              </h1>
              <div className="flex gap-2">
                <Link
                  href={`/${code}/spot`}
                  className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-3 py-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                >
                  カテゴリ
                </Link>
                <Link
                  href={`/${code}/spot/area`}
                  className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-3 py-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                >
                  エリア
                </Link>
              </div>
            </div>
            {geoSpots.length === 0 && allSpots.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                座標データを準備中です。{allSpots.length}件のスポットが登録されています。
              </p>
            )}
          </div>
        </div>

        {/* 地図エリア（残りの高さ全部使う） */}
        <div className="flex-1 min-h-0">
          <SpotMapLoader
            spots={mapSpots}
            countryCode={code}
            categories={categoryFilters}
            center={center}
            apiKey={apiKey}
          />
        </div>
      </main>
    </>
  );
}
