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
import { getArticlesByCountry } from "@/lib/articles";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Tag,
  Calendar,
} from "lucide-react";
import type { Metadata } from "next";

type Params = { country: string; category: string; slug: string };

export function generateStaticParams() {
  const phase1Countries = countries.filter((c) => c.phase === 1);
  const params: Params[] = [];
  for (const c of phase1Countries) {
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
  const relatedArticles = getArticlesByCountry(code).slice(0, 3);

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

  // パンくず JSON-LD
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
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbJsonLd),
          }}
        />

        {/* パンくず + ヘッダー */}
        <section className="bg-gradient-to-br from-ocean-800 to-ocean-600 text-white py-14 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex items-center gap-1.5 text-sm text-ocean-300 mb-6 flex-wrap">
              <Link
                href={`/${code}`}
                className="hover:text-white transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={14} />
              <Link
                href={`/${code}/spot`}
                className="hover:text-white transition-colors"
              >
                スポット
              </Link>
              <ChevronRight size={14} />
              <Link
                href={`/${code}/spot/${catSlug}`}
                className="hover:text-white transition-colors"
              >
                {category.name}
              </Link>
              <ChevronRight size={14} />
              <span className="text-white">{displayName}</span>
            </nav>

            <h1 className="heading-editorial text-3xl md:text-4xl font-bold mb-2">
              {displayName}
            </h1>
            {spot.name_ja && (
              <p className="text-ocean-300 text-sm">{spot.name}</p>
            )}
          </div>
        </section>

        {/* メインコンテンツ */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 左: メイン情報 */}
              <div className="md:col-span-2">
                {/* 説明 */}
                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 mb-6">
                  <h2 className="heading-editorial text-lg font-bold mb-3">
                    概要
                  </h2>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    {spot.description}
                  </p>

                  {spot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {spot.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 px-2.5 py-1 rounded-full"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 関連記事 */}
                {relatedArticles.length > 0 && (
                  <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
                    <h2 className="heading-editorial text-lg font-bold mb-4">
                      {country.name}の関連記事
                    </h2>
                    <div className="space-y-3">
                      {relatedArticles.map((article) => (
                        <Link
                          key={article.slug}
                          href={`/${code}/${article.slug}`}
                          className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors group"
                        >
                          <div>
                            <p className="text-sm font-medium group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                              {article.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-stone-400 mt-1">
                              <Calendar size={10} />
                              {article.date}
                            </div>
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-stone-400 group-hover:text-ocean-600 shrink-0"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 右: サイドバー（基本情報） */}
              <div>
                <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 sticky top-20">
                  <h2 className="heading-editorial text-lg font-bold mb-4">
                    基本情報
                  </h2>
                  <dl className="space-y-4 text-sm">
                    {/* エリア */}
                    <div>
                      <dt className="flex items-center gap-1.5 text-stone-400 mb-1">
                        <MapPin size={14} />
                        エリア
                      </dt>
                      <dd className="text-stone-700 dark:text-stone-300">
                        {spot.area}
                      </dd>
                    </div>

                    {/* 住所 */}
                    <div>
                      <dt className="flex items-center gap-1.5 text-stone-400 mb-1">
                        <MapPin size={14} />
                        住所
                      </dt>
                      <dd className="text-stone-700 dark:text-stone-300">
                        {spot.address}
                      </dd>
                    </div>

                    {/* 電話番号 */}
                    {spot.phone && (
                      <div>
                        <dt className="flex items-center gap-1.5 text-stone-400 mb-1">
                          <Phone size={14} />
                          電話番号
                        </dt>
                        <dd>
                          <a
                            href={`tel:${spot.phone}`}
                            className="text-ocean-600 dark:text-ocean-400 hover:underline"
                          >
                            {spot.phone}
                          </a>
                        </dd>
                      </div>
                    )}

                    {/* 営業時間 */}
                    {spot.hours && (
                      <div>
                        <dt className="flex items-center gap-1.5 text-stone-400 mb-1">
                          <Clock size={14} />
                          営業時間
                        </dt>
                        <dd className="text-stone-700 dark:text-stone-300">
                          {spot.hours}
                        </dd>
                      </div>
                    )}

                    {/* 公式サイト */}
                    {spot.website && (
                      <div>
                        <dt className="flex items-center gap-1.5 text-stone-400 mb-1">
                          <Globe size={14} />
                          公式サイト
                        </dt>
                        <dd>
                          <a
                            href={spot.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-ocean-600 dark:text-ocean-400 hover:underline"
                          >
                            公式サイトを見る
                            <ExternalLink size={12} />
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>

                  <p className="text-xs text-stone-400 mt-6 pt-4 border-t border-stone-100 dark:border-stone-700">
                    最終確認: {spot.last_verified}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 戻るリンク */}
        <section className="pb-12">
          <div className="max-w-4xl mx-auto px-4">
            <Link
              href={`/${code}/spot/${catSlug}`}
              className="inline-flex items-center gap-2 text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
            >
              ← {category.name}の一覧に戻る
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
