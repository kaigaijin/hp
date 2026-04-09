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
import { getCategoryTheme } from "@/lib/group-theme";
import SpotReportForm from "@/components/SpotReportForm";
import SpotReviewForm from "@/components/SpotReviewForm";
import RandomSpots from "@/components/RandomSpots";
import SpotDetailTabs from "@/components/SpotDetailTabs";
import PlaceActionBar from "@/components/PlaceActionBar";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Languages,
  UtensilsCrossed,
  Stethoscope,
  Scissors,
  Building2,
  GraduationCap,
  Coffee,
  Pill,
  Sparkles,
  Dumbbell,
  Calculator,
  Scale,
  Shield,
  Truck,
  Plane,
  PawPrint,
  Car,
  Wrench,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

type Params = { country: string; category: string; slug: string };

// カテゴリアイコンマップ
const categoryIconMap: Record<string, (size: number) => React.ReactNode> = {
  restaurant: (s) => <UtensilsCrossed size={s} />,
  cafe: (s) => <Coffee size={s} />,
  grocery: (s) => <UtensilsCrossed size={s} />,
  clinic: (s) => <Stethoscope size={s} />,
  dental: (s) => <Stethoscope size={s} />,
  pharmacy: (s) => <Pill size={s} />,
  beauty: (s) => <Scissors size={s} />,
  "nail-esthetic": (s) => <Sparkles size={s} />,
  fitness: (s) => <Dumbbell size={s} />,
  "real-estate": (s) => <Building2 size={s} />,
  moving: (s) => <Truck size={s} />,
  cleaning: (s) => <Sparkles size={s} />,
  repair: (s) => <Wrench size={s} />,
  education: (s) => <GraduationCap size={s} />,
  accounting: (s) => <Calculator size={s} />,
  legal: (s) => <Scale size={s} />,
  insurance: (s) => <Shield size={s} />,
  bank: (s) => <Calculator size={s} />,
  travel: (s) => <Plane size={s} />,
  coworking: (s) => <Building2 size={s} />,
  pet: (s) => <PawPrint size={s} />,
  car: (s) => <Car size={s} />,
};

// スポット数が多いためビルド時は主要ページのみ静的生成し、残りはオンデマンド生成
export const dynamicParams = true;
export const revalidate = false; // 一度生成したらデプロイまで再生成しない（ISR Write削減）

export function generateStaticParams() {
  // Vercelの80MBデプロイ制限のため、スポット個別ページは全てオンデマンド生成
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
  const titleName =
    spot.name_ja && spot.name_ja !== spot.name
      ? `${spot.name_ja} / ${spot.name}`
      : displayName;
  const canonicalUrl = `https://kaigaijin.jp/${code}/place/${catSlug}/${slug}`;
  return {
    title: `${titleName}｜${country.name}の${category.name}（${spot.area}）`,
    description: spot.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${titleName} | ${country.name}の${category.name} | Kaigaijin`,
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

  const sameCategory = getSpotsByCategory(code, catSlug)
    .filter((s) => s.slug !== slug);

  // スキーマタイプ
  const schemaTypeMap: Record<string, string> = {
    restaurant: "Restaurant",
    cafe: "CafeOrCoffeeShop",
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

  const images = (spot as Record<string, unknown>).images as string[] | undefined;
  const hasImages = images && images.length > 0;

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
    ...(spot.lat != null && spot.lng != null && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: spot.lat,
        longitude: spot.lng,
      },
    }),
    ...(images && images.length > 0 && { image: images }),
    ...(spot.last_verified && { dateModified: spot.last_verified }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: "https://kaigaijin.jp" },
      { "@type": "ListItem", position: 2, name: country.name, item: `https://kaigaijin.jp/${code}` },
      { "@type": "ListItem", position: 3, name: "KAIプレイス", item: `https://kaigaijin.jp/${code}/place` },
      { "@type": "ListItem", position: 4, name: category.name, item: `https://kaigaijin.jp/${code}/place/${catSlug}` },
      { "@type": "ListItem", position: 5, name: displayName },
    ],
  };

  const renderCategoryIcon = categoryIconMap[catSlug];

  return (
    <>
      <Header />
      <main className="bg-sand-50 dark:bg-stone-950 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        {/* パンくず */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 flex-wrap">
              <Link href="/" className="hover:text-warm-600 transition-colors">トップ</Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-warm-600 transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/place`} className="hover:text-warm-600 transition-colors">KAIプレイス</Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/place/${catSlug}`} className="hover:text-warm-600 transition-colors">
                {category.name}
              </Link>
            </nav>
          </div>
        </div>

        {/* ヒーローエリア */}
        {hasImages ? (
          /* 写真ありの場合: ギャラリー */
          <div className="max-w-5xl mx-auto px-4 pt-4">
            <div className="rounded-2xl overflow-hidden">
              <div className="flex gap-1 h-72 sm:h-96">
                <div className="relative w-1/2">
                  <img src={images[0]} alt={displayName} className="w-full h-full object-cover" />
                </div>
                <div className="w-1/2 flex flex-col gap-1">
                  <div className="relative flex-1">
                    {images[1] ? (
                      <img src={images[1]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-100 dark:bg-stone-800" />
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
                      <div className="w-full h-full bg-stone-100 dark:bg-stone-800" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 写真なしの場合: テキストヒーロー */
          <div className={`${theme.heroGradientFrom} to-sand-50 dark:to-stone-950 border-b border-stone-100 dark:border-stone-800`}
            style={{ background: undefined }}
          >
            <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
              {/* カテゴリバッジ */}
              <div className={`inline-flex items-center gap-2 ${theme.badgeBg} ${theme.badgeText} text-xs font-semibold px-3 py-1.5 rounded-full mb-4`}>
                {renderCategoryIcon?.(14)}
                {category.name}
              </div>
              {/* スポット名 */}
              <h1 className="heading-editorial text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2">
                {displayName}
              </h1>
              {/* 英語名 */}
              {spot.name_ja && (
                <p className="text-stone-400 text-sm mb-3">{spot.name}</p>
              )}
              {/* エリア + ステータス */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400">
                  <MapPin size={14} />
                  {spot.area}
                </span>
                {spotStatus === "verified" && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} />
                    確認済み{spot.last_verified ? `（${spot.last_verified}）` : ""}
                  </span>
                )}
                {spotStatus === "reported_closed" && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                    <AlertTriangle size={11} />
                    閉店済み
                  </span>
                )}
              </div>
              {/* description を大きく */}
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                {spot.description}
              </p>
              {/* 未確認注記 */}
              {spotStatus === "unverified" && (
                <p className="mt-3 text-xs text-stone-400 italic">
                  ※ この情報はWeb上のデータを元に掲載しています。訪問前に公式サイトでご確認ください。
                </p>
              )}
              {/* 写真募集バナー */}
              <a
                href="/contact"
                className="mt-6 inline-flex items-center gap-3 bg-white/60 dark:bg-stone-800/60 backdrop-blur-sm border border-stone-200 dark:border-stone-700 hover:border-warm-300 dark:hover:border-warm-700 rounded-xl px-4 py-3 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 dark:text-stone-500">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors">
                    写真を掲載しませんか？
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    店舗オーナー・訪問者の方はこちら
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 dark:text-stone-600 group-hover:text-warm-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* アクションバー（計測付き） */}
        <PlaceActionBar
          country={code}
          category={catSlug}
          slug={slug}
          website={spot.website}
          phone={spot.phone}
          tags={spot.tags}
          ctaBg={theme.ctaBg}
          ctaHover={theme.ctaHover}
          badgeText={theme.badgeText}
          badgeBg={theme.badgeBg}
        />

        {/* メインコンテンツ */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 左カラム */}
            <div className="lg:col-span-2 space-y-6">

              {/* タグ（モバイル） */}
              {spot.tags.length > 0 && (
                <div className="md:hidden flex flex-wrap gap-2">
                  {spot.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* SpotDetailTabs */}
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

              {/* SpotReviewForm */}
              <SpotReviewForm
                country={code}
                category={catSlug}
                spotSlug={slug}
                spotName={displayName}
              />

              {/* SpotReportForm（モバイル） */}
              <div className="lg:hidden">
                <SpotReportForm
                  country={code}
                  category={catSlug}
                  spotSlug={slug}
                  spotName={displayName}
                />
              </div>

              {/* 同カテゴリのスポット */}
              {sameCategory.length > 0 && (
                <RandomSpots
                  spots={sameCategory}
                  countryCode={code}
                  categorySlug={catSlug}
                  accentClass={theme.accent}
                  hoverBorderClass={theme.hoverBorder}
                  categoryName={category.name}
                  count={5}
                />
              )}
            </div>

            {/* 右サイドバー */}
            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">

              {/* 基本情報カード */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-50 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                  <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">基本情報</h2>
                </div>
                <dl className="p-5 space-y-4">
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
                              const lines = spot.hours.split(/\s\/\s(?=(?:[月火水木金土日祝]|[^\d]))/);
                              return lines.map((line, i) => {
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

                  {/* 公式サイトボタン */}
                  {spot.website && (
                    <a
                      href={spot.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full ${theme.ctaBg} text-white rounded-xl py-2.5 text-sm font-medium ${theme.ctaHover} transition-colors`}
                    >
                      <ExternalLink size={14} />
                      公式サイトを見る
                    </a>
                  )}

                  {spot.phone && (
                    <a
                      href={`tel:${spot.phone}`}
                      className="hidden lg:flex items-center justify-center gap-2 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl py-2.5 text-sm font-medium hover:border-warm-400 transition-colors"
                    >
                      <Phone size={14} />
                      電話する
                    </a>
                  )}
                </dl>
              </div>

              {/* SpotReportForm（デスクトップ） */}
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

          {/* 底部CTA */}
          <div className="mt-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-100">
                {country.flag} {country.name}の{category.name}をもっと見る
              </p>
              <p className="text-sm text-stone-400 mt-0.5">
                日本人向けのスポットを一覧で確認できます
              </p>
            </div>
            <Link
              href={`/${code}/place/${catSlug}`}
              className={`shrink-0 inline-flex items-center gap-2 ${theme.ctaBg} ${theme.ctaHover} text-white font-medium px-6 py-2.5 rounded-full text-sm transition-colors`}
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
