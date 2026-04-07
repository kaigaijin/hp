import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import PaginatedArticleList from "@/components/PaginatedArticleList";
import CountryHero from "@/components/CountryHero";
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
        <CountryHero
          countryCode={code}
          countryName={country.name}
          countryFlag={country.flag}
          currentLabel="記事"
          label={`${country.flag} ${country.name} — ${country.nameEn}`}
          title={country.name}
          subtitle={`${country.tagline}　在住日本人 ${country.population}`}
          articleCount={articles.length}
          spotCount={totalSpots}
        />

        {/* ===== 記事一覧 ===== */}
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
