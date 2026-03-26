import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { categories, getCategory, getSpotsByCategory } from "@/lib/directory";
import {
  MapPin,
  Phone,
  Globe,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

export function generateStaticParams() {
  return countries.flatMap((c) =>
    categories.map((cat) => ({ country: c.code, category: cat.slug })),
  );
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; category: string }>;
}) {
  return params.then(({ country: code, category: catSlug }) => {
    const country = getCountry(code);
    const category = getCategory(catSlug);
    if (!country || !category) return {};
    return {
      title: `${country.name}の${category.name}`,
      description: `${country.name}で日本人におすすめの${category.name}を一覧で紹介。住所・電話番号・営業時間など詳細情報つき。`,
      openGraph: {
        title: `${country.name}の${category.name} | Kaigaijin`,
        description: `${country.name}の${category.name}を探すなら。日本語対応スポットを中心にご紹介。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/spot/${catSlug}`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ country: string; category: string }>;
}) {
  const { country: code, category: catSlug } = await params;
  const country = getCountry(code);
  const category = getCategory(catSlug);
  if (!country || !category) notFound();

  const spots = getSpotsByCategory(code, catSlug);

  // エリア別に集計
  const areas = [...new Set(spots.map((s) => s.area))].sort();

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        {/* コンパクトヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
              <Link
                href="/"
                className="hover:text-ocean-600 transition-colors"
              >
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}`}
                className="hover:text-ocean-600 transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/spot`}
                className="hover:text-ocean-600 transition-colors"
              >
                スポット
              </Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">
                {category.name}
              </span>
            </nav>
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {country.name}の{category.name}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {spots.length > 0
                ? `${spots.length}件のスポットを掲載中`
                : "スポット情報を準備中です"}
            </p>
          </div>

          {/* エリアタブ */}
          {areas.length > 1 && (
            <div className="max-w-6xl mx-auto px-4 border-t border-stone-100 dark:border-stone-700">
              <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                <span className="shrink-0 text-xs font-medium text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 px-3 py-1.5 rounded-full">
                  すべて（{spots.length}）
                </span>
                {areas.map((area) => (
                  <span
                    key={area}
                    className="shrink-0 text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-3 py-1.5 rounded-full"
                  >
                    {area}（{spots.filter((s) => s.area === area).length}）
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* スポットリスト */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {spots.length > 0 ? (
            <div className="space-y-3">
              {spots.map((spot, i) => (
                <Link
                  key={spot.slug}
                  href={`/${code}/spot/${catSlug}/${spot.slug}`}
                  className="group block"
                >
                  <article className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-md transition-all">
                    <div className="p-4 sm:p-5">
                      {/* 上段: 店名 + エリア */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-ocean-600 dark:text-ocean-400">
                              {i + 1}
                            </span>
                            <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 truncate group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                              {spot.name_ja ?? spot.name}
                            </h2>
                          </div>
                          {spot.name_ja && (
                            <p className="text-xs text-stone-400 mt-0.5 ml-5">
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
                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3 ml-5 line-clamp-2">
                        {spot.description}
                      </p>

                      {/* 下段: タグ + 連絡先 */}
                      <div className="flex items-center justify-between gap-4 ml-5">
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
                            <span className="flex items-center gap-1 text-xs text-ocean-500">
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
          ) : (
            <div className="text-center py-20 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                {country.name}の{category.name}情報を順次追加しています。
              </p>
              <Link
                href={`/${code}/spot`}
                className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                ← カテゴリ一覧に戻る
              </Link>
            </div>
          )}

          {/* フッター */}
          <div className="mt-8 flex items-center justify-between">
            <Link
              href={`/${code}/spot`}
              className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
            >
              ← カテゴリ一覧
            </Link>
            <Link
              href="/contact"
              className="text-xs text-stone-400 hover:text-ocean-600 transition-colors"
            >
              情報の修正・掲載リクエスト
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
