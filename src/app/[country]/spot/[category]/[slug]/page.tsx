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
import { getCategoryTheme } from "@/lib/group-theme";
import SpotReportForm from "@/components/SpotReportForm";
import SpotReviewForm from "@/components/SpotReviewForm";
import SpotDetailTabs from "@/components/SpotDetailTabs";
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
  CreditCard,
  Armchair,
  CarFront,
  CalendarCheck,
  Cigarette,
  Languages,
  DollarSign,
  UtensilsCrossed,
  Camera,
  ArrowRight,
} from "lucide-react";
import { getArticlesByCountry } from "@/lib/articles";
import type { Metadata } from "next";

type Params = { country: string; category: string; slug: string };

// スポット数が多いためビルド時は主要ページのみ静的生成し、残りはオンデマンド生成
export const dynamicParams = true;

export function generateStaticParams() {
  // Vercelの80MBデプロイ制限のため、スポット個別ページは全てオンデマンド生成
  // 初回アクセス時に生成されキャッシュされる（ISR相当）
  return [];
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
  const canonicalUrl = `https://kaigaijin.jp/${code}/spot/${catSlug}/${slug}`;
  return {
    title: `${displayName}｜${country.name}の${category.name}（${spot.area}）`,
    description: spot.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${displayName} | ${country.name}の${category.name} | Kaigaijin`,
      description: spot.description,
      type: "article",
      locale: "ja_JP",
      url: canonicalUrl,
      siteName: "Kaigaijin",
      ...(spot.last_verified && {
        modifiedTime: spot.last_verified,
      }),
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
  const theme = getCategoryTheme(catSlug);

  // 同じカテゴリの他のスポット
  const sameCategory = getSpotsByCategory(code, catSlug)
    .filter((s) => s.slug !== slug)
    .slice(0, 5);

  // 国別記事（関連記事表示用）
  const relatedArticles = getArticlesByCountry(code).slice(0, 3);

  // カテゴリに応じたSchema.orgの具体的な@type
  const schemaTypeMap: Record<string, string> = {
    restaurant: "Restaurant",
    cafe: "CafeOrCoffeeShop",
    "izakaya-bar": "BarOrPub",
    grocery: "GroceryStore",
    clinic: "MedicalClinic",
    dental: "Dentist",
    pharmacy: "Pharmacy",
    beauty: "HairSalon",
    "nail-esthetic": "BeautySalon",
    fitness: "ExerciseGym",
    "real-estate": "RealEstateAgent",
    education: "EducationalOrganization",
    accounting: "AccountingService",
    legal: "LegalService",
    insurance: "InsuranceAgency",
    travel: "TravelAgency",
  };
  const schemaType = schemaTypeMap[catSlug] ?? "LocalBusiness";

  // 画像配列
  const images = (spot as Record<string, unknown>).images as string[] | undefined;

  // JSON-LD 構造化データ（LocalBusiness / Restaurant 等）
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
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
    ...(spot.price_range && { priceRange: spot.price_range }),
    // 座標
    ...(spot.lat != null && spot.lng != null && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: spot.lat,
        longitude: spot.lng,
      },
    }),
    // 画像
    ...(images && images.length > 0 && { image: images }),
    // 確認日をdateModifiedとして使用
    ...(spot.last_verified && { dateModified: spot.last_verified }),
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
        name: "KAIスポット",
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
                className="hover:text-warm-600 transition-colors"
              >
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}`}
                className="hover:text-warm-600 transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/spot`}
                className="hover:text-warm-600 transition-colors"
              >
                KAIスポット
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/spot/${catSlug}`}
                className="hover:text-warm-600 transition-colors"
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
              <span className={`text-xs ${theme.badgeText} ${theme.badgeBg} px-2 py-0.5 rounded`}>
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

        {/* 画像ギャラリー */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          {(() => {
            const hasImages = images && images.length > 0;
            return (
              <div className="rounded-xl overflow-hidden">
                {hasImages ? (
                  <div className="flex gap-1 h-48 sm:h-64 lg:h-80">
                    <div className="relative w-1/2">
                      <img src={images[0]} alt={displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-1/2 flex flex-col gap-1">
                      <div className="relative flex-1">
                        {images[1] ? (
                          <img src={images[1]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                            <Camera size={20} className="text-stone-300 dark:text-stone-500" />
                          </div>
                        )}
                      </div>
                      <div className="relative flex-1">
                        {images[2] ? (
                          <>
                            <img src={images[2]} alt="" className="w-full h-full object-cover" />
                            {images.length > 3 && (
                              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium">
                                +{images.length - 3}枚
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                            <Camera size={20} className="text-stone-300 dark:text-stone-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1 h-36 sm:h-44">
                    <div className="w-1/2 bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-750 dark:to-stone-800 rounded-l-xl flex flex-col items-center justify-center gap-2">
                      <Camera size={28} className="text-stone-300 dark:text-stone-500" />
                      <span className="text-xs text-stone-300 dark:text-stone-500">写真募集中</span>
                    </div>
                    <div className="w-1/2 flex flex-col gap-1">
                      <div className="flex-1 bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-750 rounded-tr-xl flex items-center justify-center">
                        <Camera size={18} className="text-stone-300 dark:text-stone-500" />
                      </div>
                      <div className="flex-1 bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-750 dark:to-stone-800 rounded-br-xl flex items-center justify-center">
                        <Camera size={18} className="text-stone-300 dark:text-stone-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
                    閉店の可能性があるとの報告を受けています。訪問前に公式サイトや電話で営業状況をご確認ください。
                  </p>
                </div>
              )}

              {/* アクションバー（モバイル向け） */}
              <div className="flex gap-2 lg:hidden">
                {spot.phone && (
                  <a
                    href={`tel:${spot.phone}`}
                    className={`flex-1 flex items-center justify-center gap-2 ${theme.ctaBg} text-white rounded-xl py-3 font-medium text-sm ${theme.ctaHover} transition-colors`}
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
                    className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl py-3 font-medium text-sm hover:border-warm-400 transition-colors"
                  >
                    <Globe size={16} />
                    公式サイト
                  </a>
                )}
              </div>

              {/* タグ */}
              {spot.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {spot.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* レビュー（目立つ位置に配置） */}
              <SpotReviewForm
                country={code}
                category={catSlug}
                spotSlug={slug}
                spotName={displayName}
              />

              {/* タブUI: 概要・写真・メニュー・料金詳細 */}
              <SpotDetailTabs
                spot={spot}
                displayName={displayName}
                overviewContent={null}
                mapEmbed={
                  <iframe
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(spot.name + " " + spot.address)}&output=embed`}
                    title={`${displayName}の地図`}
                  />
                }
              />

              {/* 情報更新フォーム（モバイル） */}
              <div className="lg:hidden">
                <SpotReportForm
                  country={code}
                  category={catSlug}
                  spotSlug={slug}
                  spotName={displayName}
                />
              </div>

              {/* 同じカテゴリのスポット */}
              {sameCategory.length > 0 && (
                <div className="mt-4 pt-6 border-t border-stone-300 dark:border-stone-600">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      {category.name}の他の場所
                    </h2>
                    <Link
                      href={`/${code}/spot/${catSlug}`}
                      className={`text-xs ${theme.accent} hover:underline`}
                    >
                      すべて見る
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sameCategory.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/${code}/spot/${catSlug}/${s.slug}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-600 text-sm text-stone-600 dark:text-stone-400 ${theme.hoverBorder} transition-colors`}
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
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              {/* 基本情報カード */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
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
                          className="text-sm text-warm-600 dark:text-warm-400 hover:underline font-medium"
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
                        <table className="w-full">
                          <tbody>
                            {(() => {
                              // 曜日区切りの「 / 」でのみ分割（時間帯の「 / 」は維持）
                              // 時間帯の / : 前後が時刻パターン（00:00）
                              const lines = spot.hours.split(/\s\/\s(?=(?:[月火水木金土日祝]|[^\d]))/);
                              return lines.map((line, i) => {
                                // 「曜日: 時間」形式をパース
                                const colonIdx = line.indexOf(": ");
                                if (colonIdx > 0 && colonIdx < 15) {
                                  const day = line.slice(0, colonIdx);
                                  const time = line.slice(colonIdx + 2);
                                  return (
                                    <tr key={i}>
                                      <td className="pr-3 py-0.5 text-stone-500 dark:text-stone-400 whitespace-nowrap align-top text-xs font-medium">{day}</td>
                                      <td className="py-0.5">{time}</td>
                                    </tr>
                                  );
                                }
                                // 末尾の（〜休）を分離して定休日行にする
                                const restMatch = line.match(/^(.+?)（([^）]*休[^）]*)）$/);
                                if (restMatch) {
                                  return (
                                    <>
                                      <tr key={i}>
                                        <td colSpan={2} className="py-0.5">{restMatch[1]}</td>
                                      </tr>
                                      <tr key={`${i}-rest`}>
                                        <td className="pr-3 py-0.5 text-stone-500 dark:text-stone-400 whitespace-nowrap align-top text-xs font-medium">定休日</td>
                                        <td className="py-0.5">{restMatch[2]}</td>
                                      </tr>
                                    </>
                                  );
                                }
                                return (
                                  <tr key={i}>
                                    <td colSpan={2} className="py-0.5">{line}</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </dd>
                    </div>
                  )}

                  {/* 価格帯 */}
                  {spot.price_range && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <DollarSign size={12} />
                        価格帯
                      </dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.price_range}
                      </dd>
                    </div>
                  )}

                  {/* 対応言語 */}
                  {spot.languages && spot.languages.length > 0 && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Languages size={12} />
                        対応言語
                      </dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.languages.join(", ")}
                      </dd>
                    </div>
                  )}

                  {/* 公式サイト */}
                  {spot.website && (
                    <a
                      href={spot.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full ${theme.ctaBg} text-white rounded-lg py-2.5 text-sm font-medium ${theme.ctaHover} transition-colors`}
                    >
                      <ExternalLink size={14} />
                      公式サイトを見る
                    </a>
                  )}

                  {spot.phone && (
                    <a
                      href={`tel:${spot.phone}`}
                      className="hidden lg:flex items-center justify-center gap-2 w-full bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-200 rounded-lg py-2.5 text-sm font-medium hover:border-warm-400 transition-colors"
                    >
                      <Phone size={14} />
                      電話する
                    </a>
                  )}
                </div>
              </div>

              {/* 行ったセクション（デスクトップ） */}
              <div className="hidden lg:block">
                <SpotReportForm
                  country={code}
                  category={catSlug}
                  spotSlug={slug}
                  spotName={displayName}
                />
              </div>
            </div>
          </div>

          {/* 戻るリンク */}
          <div className="mt-8">
            <Link
              href={`/${code}/spot/${catSlug}`}
              className={`text-sm ${theme.accent} hover:underline`}
            >
              ← {category.name}の一覧に戻る
            </Link>
          </div>

          {/* 関連記事（回遊促進） */}
          {relatedArticles.length > 0 && (
            <div className="mt-10 pt-8 border-t border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-stone-700 dark:text-stone-200">
                  {country.name}の生活ガイド記事
                </h2>
                <Link
                  href={`/${code}`}
                  className="text-xs text-warm-600 dark:text-warm-400 hover:underline flex items-center gap-1"
                >
                  すべて見る <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${code}/${article.slug}`}
                    className="group block bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4 hover:border-warm-300 dark:hover:border-warm-600 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 line-clamp-2">
                      {article.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* スポット一覧へのCTA */}
          <div className="mt-8 bg-gradient-to-br from-warm-50 to-warm-100 dark:from-warm-900/20 dark:to-warm-800/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-100">
                {country.flag} {country.name}の{category.name}をもっと見る
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                日本人向けのスポットを一覧で確認できます
              </p>
            </div>
            <Link
              href={`/${code}/spot/${catSlug}`}
              className={`shrink-0 inline-flex items-center gap-2 ${theme.ctaBg} ${theme.ctaHover} text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors`}
            >
              一覧を見る <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
