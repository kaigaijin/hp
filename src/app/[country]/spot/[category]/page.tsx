import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { categories, getCategory, getSpotsByCategory } from "@/lib/directory";
import { MapPin, Phone, Globe, Tag, ChevronRight } from "lucide-react";

export function generateStaticParams() {
  const phase1Countries = countries.filter((c) => c.phase === 1);
  return phase1Countries.flatMap((c) =>
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
      <main>
        {/* パンくず + ヒーロー */}
        <section className="bg-gradient-to-br from-ocean-800 to-ocean-600 text-white py-14 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            {/* パンくず */}
            <nav className="flex items-center gap-1.5 text-sm text-ocean-300 mb-6">
              <Link href={`/${code}`} className="hover:text-white transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={14} />
              <Link href={`/${code}/spot`} className="hover:text-white transition-colors">
                スポット
              </Link>
              <ChevronRight size={14} />
              <span className="text-white">{category.name}</span>
            </nav>

            <h1 className="heading-editorial text-3xl md:text-4xl font-bold mb-3">
              {country.name}の{category.name}
            </h1>
            <p className="text-ocean-200">
              {spots.length > 0
                ? `${spots.length}件のスポットを掲載中`
                : "スポット情報を準備中です"}
            </p>

            {/* エリアフィルタ（将来拡張用、現在は表示のみ） */}
            {areas.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {areas.map((area) => (
                  <span
                    key={area}
                    className="text-xs bg-white/10 px-3 py-1 rounded-full"
                  >
                    {area}（{spots.filter((s) => s.area === area).length}）
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* スポット一覧 */}
        <section className="py-12 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            {spots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {spots.map((spot) => (
                  <Link
                    key={spot.slug}
                    href={`/${code}/spot/${catSlug}/${spot.slug}`}
                    className="group"
                  >
                    <article className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 h-full flex flex-col country-card">
                      <h2 className="heading-editorial text-lg font-bold mb-1 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                        {spot.name_ja ?? spot.name}
                      </h2>
                      {spot.name_ja && (
                        <p className="text-xs text-stone-400 mb-3">
                          {spot.name}
                        </p>
                      )}

                      <div className="flex items-start gap-2 text-sm text-stone-500 dark:text-stone-400 mb-2">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0 text-ocean-500"
                        />
                        <span>{spot.area}</span>
                      </div>

                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-4 flex-1">
                        {spot.description}
                      </p>

                      {/* タグ */}
                      {spot.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {spot.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-xs bg-ocean-50 dark:bg-ocean-900/30 text-ocean-700 dark:text-ocean-400 px-2 py-0.5 rounded-full"
                            >
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* コンタクト情報 */}
                      <div className="flex items-center gap-4 text-xs text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-700">
                        {spot.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} />
                            {spot.phone}
                          </span>
                        )}
                        {spot.website && (
                          <span className="flex items-center gap-1">
                            <Globe size={10} />
                            公式サイト
                          </span>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h2 className="heading-editorial text-xl font-bold mb-3">
                  スポット情報を準備中
                </h2>
                <p className="text-stone-500 dark:text-stone-400 mb-6">
                  {country.name}の{category.name}
                  情報を順次追加しています。
                </p>
                <Link
                  href={`/${code}/spot`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-600 text-white rounded-xl hover:bg-ocean-700 transition-colors font-medium text-sm"
                >
                  カテゴリ一覧に戻る
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 bg-stone-100 dark:bg-stone-800/50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
              掲載されていないスポットや情報の修正は
              <Link
                href="/contact"
                className="text-ocean-600 dark:text-ocean-400 hover:underline ml-1"
              >
                こちら
              </Link>
              からお知らせください
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
