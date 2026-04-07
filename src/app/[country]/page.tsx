import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import {
  ArrowRight,
  MapPin,
  BriefcaseBusiness,
  BookOpen,
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

  const groupCounts = categoryGroups.map((group) => ({
    ...group,
    count: group.categories.reduce(
      (sum, cat) => sum + (categoryCounts[cat] ?? 0),
      0,
    ),
  }));

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
        {/* ===== ヒーロー ===== */}
        <section className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e] text-white pt-12 pb-0">
          <div className="max-w-6xl mx-auto px-4">
            {/* 国名・タグライン */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-7xl">{country.flag}</span>
                <div>
                  <h1 className="heading-editorial text-4xl md:text-5xl font-bold">
                    {country.name}
                  </h1>
                  <p className="text-stone-400 text-sm mt-1">
                    {country.nameEn} ・ 在住日本人 {country.population}
                  </p>
                </div>
              </div>
              <p className="text-xl text-stone-300 italic heading-editorial max-w-xl">
                {country.tagline}
              </p>
              {/* トピックタグ */}
              <div className="flex flex-wrap gap-2 mt-4">
                {country.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs bg-white/10 text-stone-300 px-3 py-1 rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* ナビカード3枚 — ヒーロー下部にアタッチ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-0">
              {/* 記事 */}
              <a
                href="#articles"
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-warm-400/40 rounded-t-2xl px-6 py-5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-warm-500/20 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-warm-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 mb-0.5">生活ガイド</p>
                  <p className="font-bold text-white group-hover:text-warm-300 transition-colors">
                    記事
                    <span className="text-stone-400 font-normal text-sm ml-1.5">{articles.length}件</span>
                  </p>
                </div>
                <ArrowRight size={14} className="text-stone-500 group-hover:text-warm-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </a>

              {/* KAIスポット */}
              <Link
                href={`/${code}/spot`}
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-warm-400/40 rounded-t-2xl px-6 py-5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-warm-500/20 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-warm-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 mb-0.5">— KAI SPOT</p>
                  <p className="font-bold text-white group-hover:text-warm-300 transition-colors">
                    スポット
                    <span className="text-stone-400 font-normal text-sm ml-1.5">{totalSpots}件</span>
                  </p>
                </div>
                <ArrowRight size={14} className="text-stone-500 group-hover:text-warm-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </Link>

              {/* KAIジョブ */}
              <Link
                href={`/${code}/jobs`}
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-warm-400/40 rounded-t-2xl px-6 py-5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-warm-500/20 flex items-center justify-center shrink-0">
                  <BriefcaseBusiness size={18} className="text-warm-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 mb-0.5">— KAI JOB</p>
                  <p className="font-bold text-white group-hover:text-warm-300 transition-colors">
                    求人
                  </p>
                </div>
                <ArrowRight size={14} className="text-stone-500 group-hover:text-warm-400 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        {/* ===== 記事一覧（フルワイド） ===== */}
        <section id="articles" className="py-12 md:py-16 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-6xl mx-auto px-4">
            {articles.length > 0 ? (
              <PaginatedArticleList
                articles={articles}
                countryCode={code}
                articleCategoryMap={articleCategoryMap}
                groupCounts={groupCounts}
                countryName={country.name}
              />
            ) : (
              <div className="text-center py-20">
                <span className="text-6xl mb-6 block">{country.flag}</span>
                <h2 className="heading-editorial text-2xl font-bold mb-4">
                  {country.name}の記事を準備中
                </h2>
                <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-8">
                  {country.name}での生活に役立つ記事を鋭意執筆中です。
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
        </section>
      </main>
      <Footer />
    </>
  );
}
