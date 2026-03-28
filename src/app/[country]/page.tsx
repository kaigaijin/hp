import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import {
  ArrowRight,
  Calendar,
  Tag,
  MapPin,
  UtensilsCrossed,
  Stethoscope,
  Scissors,
  Building2,
  GraduationCap,
  Briefcase,
  Compass,
} from "lucide-react";
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
        <section className="bg-gradient-to-br from-ocean-800 to-ocean-600 text-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-6xl">{country.flag}</span>
              <div>
                <h1 className="heading-editorial text-4xl md:text-5xl font-bold">
                  {country.name}
                </h1>
                <p className="text-ocean-300 text-sm mt-1">
                  {country.nameEn} ・ 在住日本人 {country.population}
                </p>
              </div>
            </div>
            <p className="text-xl text-ocean-200 italic heading-editorial">
              {country.tagline}
            </p>

            {/* トピックタグ */}
            <div className="flex flex-wrap gap-2 mt-8">
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
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左カラム: 記事一覧 */}
              <div
                className={
                  totalSpots > 0 ? "lg:col-span-2" : "lg:col-span-3"
                }
              >
                {articles.length > 0 ? (
                  <>
                    <h2 className="heading-editorial text-xl font-bold mb-6">
                      {country.name}の記事
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {articles.map((article) => {
                        // 記事カテゴリに対応するKAIスポットグループを取得
                        const relatedGroups =
                          articleCategoryMap[article.category] ?? [];
                        const relatedGroup = relatedGroups[0]
                          ? groupCounts.find(
                              (g) =>
                                g.slug === relatedGroups[0] && g.count > 0,
                            )
                          : null;

                        return (
                          <article
                            key={article.slug}
                            className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 flex flex-col country-card"
                          >
                            <div className="flex items-center gap-2 text-xs text-ocean-600 dark:text-ocean-400 font-medium mb-2">
                              <Tag size={12} />
                              {article.category}
                            </div>

                            <Link
                              href={`/${code}/${article.slug}`}
                              className="group"
                            >
                              <h3 className="heading-editorial text-base font-bold mb-2 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors leading-snug">
                                {article.title}
                              </h3>
                            </Link>
                            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-3 flex-1 line-clamp-2">
                              {article.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-stone-400">
                                <Calendar size={12} />
                                {article.date}
                              </div>
                              <div className="flex items-center gap-3">
                                {/* 関連KAIスポットへのリンク */}
                                {relatedGroup && (
                                  <Link
                                    href={`/${code}/spot/${relatedGroup.slug}`}
                                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                                    title={`${relatedGroup.name}のKAIスポット`}
                                  >
                                    <MapPin size={11} />
                                    {relatedGroup.name}
                                    {relatedGroup.count}件
                                  </Link>
                                )}
                                <Link
                                  href={`/${code}/${article.slug}`}
                                  className="flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 font-medium hover:gap-1.5 transition-all"
                                >
                                  読む
                                  <ArrowRight size={12} />
                                </Link>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
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
                      className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-600 text-white rounded-xl hover:bg-ocean-700 transition-colors font-medium"
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
                        className="text-ocean-600 dark:text-ocean-400"
                      />
                      <h2 className="heading-editorial text-xl font-bold group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                        KAIスポット
                      </h2>
                      <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
                        {totalSpots}件
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-ocean-500 dark:text-ocean-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      />
                    </Link>

                    <div className="grid grid-cols-1 gap-2">
                      {groupCounts
                        .filter((g) => g.count > 0)
                        .map((group) => (
                          <Link
                            key={group.slug}
                            href={`/${code}/spot/${group.slug}`}
                            className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-ocean-300 dark:hover:border-ocean-600 hover:shadow-sm transition-all"
                          >
                            <span className="text-ocean-600 dark:text-ocean-400">
                              {groupIcons[group.slug]}
                            </span>
                            <span className="flex-1 text-sm font-medium text-stone-700 dark:text-stone-200 group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
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
                      className="mt-4 flex items-center justify-center gap-1.5 text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 font-medium py-2 transition-colors"
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
