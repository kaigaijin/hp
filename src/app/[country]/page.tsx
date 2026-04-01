import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import {
  ArrowRight,
  MapPin,
  UtensilsCrossed,
  Stethoscope,
  Scissors,
  Building2,
  GraduationCap,
  Briefcase,
  Compass,
} from "lucide-react";
import PaginatedArticleList from "@/components/PaginatedArticleList";
import { getCategoryCounts, categoryGroups } from "@/lib/directory";

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
      title: `${country.name}の生活ガイド | Kaigaijin`,
      description: `${country.name}在住日本人のためのビザ・税金・保険・住居・医療情報。${country.tagline}`,
    };
  });
}

const groupIcons: Record<string, React.ReactNode> = {
  gourmet: <UtensilsCrossed size={20} />,
  medical: <Stethoscope size={20} />,
  "beauty-health": <Scissors size={20} />,
  housing: <Building2 size={20} />,
  education: <GraduationCap size={20} />,
  professional: <Briefcase size={20} />,
  lifestyle: <Compass size={20} />,
};

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const articles = getArticlesByCountry(code);
  const categoryCounts = getCategoryCounts(code);
  const totalSpots = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  // グループごとの件数
  const groupCounts = categoryGroups.map((group) => ({
    ...group,
    count: group.categories.reduce(
      (sum, cat) => sum + (categoryCounts[cat] ?? 0),
      0,
    ),
  }));

  // 記事にカテゴリグループslugを紐付け（関連記事表示用）
  const articleCategoryMap: Record<string, string[]> = {
    "医療・保険": ["medical"],
    "住居・賃貸": ["housing"],
    "不動産投資": ["housing"],
    "教育・インター校": ["education"],
    "ビザ・就労": ["professional"],
    "税金・CPF": ["professional"],
    グルメ: ["gourmet"],
    美容: ["beauty-health"],
  };

  return (
    <>
      <Header />
      <main>
        {/* ヒーロー */}
        <section className="bg-gradient-to-br from-warm-800 to-warm-600 text-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{country.flag}</span>
              <div>
                <h1 className="heading-editorial text-4xl md:text-5xl font-bold">
                  {country.name}
                </h1>
                <p className="text-warm-300 text-sm mt-1">
                  {country.nameEn} ・ 在住日本人 {country.population}
                </p>
              </div>
            </div>
            <p className="text-xl text-warm-200 italic heading-editorial">
              {country.tagline}
            </p>

            {/* CTA */}
            {totalSpots > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  href={`/${code}/spot`}
                  className="inline-flex items-center justify-center gap-2 bg-white text-warm-800 font-bold px-6 py-3 rounded-xl text-sm hover:bg-warm-50 transition-colors shadow-md"
                >
                  <MapPin size={16} />
                  日本人向けスポット {totalSpots}件を見る
                </Link>
                {articles.length > 0 && (
                  <a
                    href="#articles"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
                  >
                    生活ガイド記事を読む
                  </a>
                )}
              </div>
            )}

            {/* トピックタグ */}
            <div className="flex flex-wrap gap-2 mt-6">
              {country.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-sm bg-white/10 px-3 py-1 rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* KAIスポット + 記事 を統合した2カラムレイアウト */}
        <section id="articles" className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左カラム: 記事一覧 */}
              <div
                className={
                  totalSpots > 0 ? "lg:col-span-2" : "lg:col-span-3"
                }
              >
                {articles.length > 0 ? (
                  <PaginatedArticleList
                    articles={articles}
                    countryCode={code}
                    articleCategoryMap={articleCategoryMap}
                    groupCounts={groupCounts}
                    countryName={country.name}
                  />
                ) : (
                  <div className="text-center py-16">
                    <span className="text-6xl mb-6 block">{country.flag}</span>
                    <h2 className="heading-editorial text-2xl font-bold mb-4">
                      {country.name}の記事を準備中
                    </h2>
                    <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-8">
                      {country.name}
                      での生活に役立つ記事を鋭意執筆中です。
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-warm-600 text-white rounded-xl hover:bg-warm-700 transition-colors font-medium"
                    >
                      トップページへ戻る
                    </Link>
                  </div>
                )}
              </div>

              {/* 右カラム: KAIスポット */}
              {totalSpots > 0 && (
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <Link
                      href={`/${code}/spot`}
                      className="group flex items-center gap-2 mb-5"
                    >
                      <MapPin
                        size={18}
                        className="text-warm-600 dark:text-warm-400"
                      />
                      <h2 className="heading-editorial text-xl font-bold group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors">
                        KAIスポット
                      </h2>
                      <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
                        {totalSpots}件
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-warm-500 dark:text-warm-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      />
                    </Link>

                    <div className="grid grid-cols-1 gap-2">
                      {groupCounts
                        .filter((g) => g.count > 0)
                        .map((group) => (
                          <Link
                            key={group.slug}
                            href={`/${code}/spot/${group.slug}`}
                            className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-warm-300 dark:hover:border-warm-600 hover:shadow-sm transition-all"
                          >
                            <span className="text-warm-600 dark:text-warm-400">
                              {groupIcons[group.slug]}
                            </span>
                            <span className="flex-1 text-sm font-medium text-stone-700 dark:text-stone-200 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors">
                              {group.name}
                            </span>
                            <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                              {group.count}
                            </span>
                          </Link>
                        ))}
                    </div>

                    <Link
                      href={`/${code}/spot`}
                      className="mt-4 flex items-center justify-center gap-1.5 text-sm text-warm-600 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-300 font-medium py-2 transition-colors"
                    >
                      すべてのカテゴリを見る
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
