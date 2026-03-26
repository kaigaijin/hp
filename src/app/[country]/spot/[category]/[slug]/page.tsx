import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  categories,
  getCategory,
  getSpot,
  getSpotsByCategory,
} from "@/lib/directory";
import { statusConfig } from "@/lib/directory";
import SpotReportForm from "@/components/SpotReportForm";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { Metadata } from "next";

type Params = { country: string; category: string; slug: string };

export function generateStaticParams() {
  const params: Params[] = [];
  for (const c of countries) {
    for (const cat of categories) {
      const spots = getSpotsByCategory(c.code, cat.slug);
      for (const spot of spots) {
        params.push({
          country: c.code,
          category: cat.slug,
          slug: spot.slug,
        });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country: code, category: catSlug, slug } = await params;
  const country = getCountry(code);
  const category = getCategory(catSlug);
  const spot = getSpot(code, catSlug, slug);
  if (!country || !category || !spot) return {};

  const displayName = spot.name_ja ?? spot.name;
  return {
    title: `${displayName}（${country.name}・${spot.area}）`,
    description: spot.description,
    openGraph: {
      title: `${displayName} | ${country.name}の${category.name} | Kaigaijin`,
      description: spot.description,
      type: "website",
      locale: "ja_JP",
      url: `https://kaigaijin.jp/${code}/spot/${catSlug}/${slug}`,
      siteName: "Kaigaijin",
    },
  };
}

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country: code, category: catSlug, slug } = await params;
  const country = getCountry(code);
  const category = getCategory(catSlug);
  const spot = getSpot(code, catSlug, slug);
  if (!country || !category || !spot) notFound();

  const displayName = spot.name_ja ?? spot.name;
  const spotStatus = spot.status ?? "unverified";

  // 同じカテゴリの他のスポット
  const sameCategory = getSpotsByCategory(code, catSlug)
    .filter((s) => s.slug !== slug)
    .slice(0, 5);

  // JSON-LD 構造化データ（LocalBusiness）
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: spot.name,
    ...(spot.name_ja && { alternateName: spot.name_ja }),
    description: spot.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: spot.address,
      addressCountry: code.toUpperCase(),
    },
    ...(spot.phone && { telephone: spot.phone }),
    ...(spot.website && { url: spot.website }),
    ...(spot.hours && { openingHours: spot.hours }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: "https://kaigaijin.jp",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: country.name,
        item: `https://kaigaijin.jp/${code}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "スポット",
        item: `https://kaigaijin.jp/${code}/spot`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: category.name,
        item: `https://kaigaijin.jp/${code}/spot/${catSlug}`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: displayName,
      },
    ],
  };

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        {/* ヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3 flex-wrap">
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
              <Link
                href={`/${code}/spot/${catSlug}`}
                className="hover:text-ocean-600 transition-colors"
              >
                {category.name}
              </Link>
            </nav>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {displayName}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {spot.name_ja && (
                <span className="text-sm text-stone-400">{spot.name}</span>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-100 dark:bg-stone-700 px-2 py-0.5 rounded">
                <MapPin size={10} />
                {spot.area}
              </span>
              <span className="text-xs text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 px-2 py-0.5 rounded">
                {category.name}
              </span>
              {/* ステータスバッジ */}
              {spotStatus === "verified" && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                  <CheckCircle2 size={10} />
                  確認済み{spot.last_verified ? `（${spot.last_verified}）` : ""}
                </span>
              )}
              {spotStatus === "reported_closed" && (
                <span className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
                  <AlertTriangle size={10} />
                  閉店の可能性あり
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* メインカラム */}
            <div className="lg:col-span-2 space-y-4">
              {/* 未確認バナー */}
              {spotStatus === "unverified" && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                  <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    この情報はWeb上の情報を元に掲載しています。最新情報は公式サイトをご確認ください。実際に訪問された方は、ページ下部から情報の更新にご協力ください。
                  </p>
                </div>
              )}
              {spotStatus === "reported_closed" && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    このスポットは閉店の可能性があるとの報告を受けています。訪問前に公式サイトや電話で営業状況をご確認ください。
                  </p>
                </div>
              )}

              {/* アクションバー（モバイル向け） */}
              <div className="flex gap-2 lg:hidden">
                {spot.phone && (
                  <a
                    href={`tel:${spot.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-ocean-600 text-white rounded-xl py-3 font-medium text-sm hover:bg-ocean-700 transition-colors"
                  >
                    <Phone size={16} />
                    電話する
                  </a>
                )}
                {spot.website && (
                  <a
                    href={spot.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl py-3 font-medium text-sm hover:border-ocean-400 transition-colors"
                  >
                    <Globe size={16} />
                    公式サイト
                  </a>
                )}
              </div>

              {/* 概要 */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5">
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                  {spot.description}
                </p>
                {spot.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                    {spot.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-2.5 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 地図 */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-700">
                  <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                    地図
                  </h2>
                </div>
                <iframe
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(spot.name + " " + spot.address)}&output=embed`}
                  title={`${displayName}の地図`}
                />
              </div>

              {/* 情報更新フォーム */}
              <SpotReportForm
                country={code}
                category={catSlug}
                spotSlug={slug}
                spotName={displayName}
              />

              {/* 同じカテゴリのスポット */}
              {sameCategory.length > 0 && (
                <div className="mt-4 pt-6 border-t border-stone-300 dark:border-stone-600">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      {category.name}の他のスポット
                    </h2>
                    <Link
                      href={`/${code}/spot/${catSlug}`}
                      className="text-xs text-ocean-600 dark:text-ocean-400 hover:underline"
                    >
                      すべて見る
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sameCategory.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/${code}/spot/${catSlug}/${s.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-600 text-sm text-stone-600 dark:text-stone-400 hover:border-ocean-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                      >
                        {s.name_ja ?? s.name}
                        <span className="text-xs text-stone-400">· {s.area}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* サイドバー */}
            <div className="space-y-4">
              {/* 基本情報カード */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 sticky top-20">
                <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-700">
                  <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                    基本情報
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* 住所 */}
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <MapPin size={12} />
                      住所
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300">
                      {spot.address}
                    </dd>
                  </div>

                  {/* 電話番号 */}
                  {spot.phone && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Phone size={12} />
                        電話番号
                      </dt>
                      <dd>
                        <a
                          href={`tel:${spot.phone}`}
                          className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline font-medium"
                        >
                          {spot.phone}
                        </a>
                      </dd>
                    </div>
                  )}

                  {/* 営業時間 */}
                  {spot.hours && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Clock size={12} />
                        営業時間
                      </dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.hours}
                      </dd>
                    </div>
                  )}

                  {/* 公式サイト */}
                  {spot.website && (
                    <a
                      href={spot.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-ocean-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-ocean-700 transition-colors"
                    >
                      <ExternalLink size={14} />
                      公式サイトを見る
                    </a>
                  )}

                  {spot.phone && (
                    <a
                      href={`tel:${spot.phone}`}
                      className="hidden lg:flex items-center justify-center gap-2 w-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 rounded-lg py-2.5 text-sm font-medium hover:border-ocean-400 transition-colors"
                    >
                      <Phone size={14} />
                      電話する
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 戻るリンク */}
          <div className="mt-8">
            <Link
              href={`/${code}/spot/${catSlug}`}
              className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
            >
              ← {category.name}の一覧に戻る
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
