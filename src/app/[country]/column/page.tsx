import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import PaginatedArticleList from "@/components/PaginatedArticleList";
import CountryHero from "@/components/CountryHero";
import { getCategoryCounts, categoryGroups } from "@/lib/directory";

// overseas など countries 未登録コードのフォールバック
const FALLBACK_DISPLAY: Record<string, { name: string; flag: string }> = {
  overseas: { name: "海外生活", flag: "🌏" },
};

export function generateStaticParams() {
  return [
    ...countries.map((c) => ({ country: c.code })),
    { country: "overseas" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  const fallback = FALLBACK_DISPLAY[code];
  if (!country && !fallback) return {};
  const name = country?.name ?? fallback.name;
  return {
    title: `${name}の生活ガイド | Kaigaijin`,
    description: `${name}在住日本人のためのビザ・税金・保険・住居・医療情報。`,
  };
}

export default async function ColumnIndexPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  const fallback = FALLBACK_DISPLAY[code];
  if (!country && !fallback) notFound();

  const articles = getArticlesByCountry(code);
  const categoryCounts = getCategoryCounts(code);
  const totalplaces = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

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

  // overseasの場合はCountryHero不要（国情報がない）
  if (!country) {
    const display = fallback;
    return (
      <>
        <Header />
        <main className="py-12 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold mb-2">
              {display.flag} {display.name}のコラム
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mb-10">
              {articles.length}件の記事
            </p>
            {articles.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400">記事はまだありません。</p>
            ) : (
              <PaginatedArticleList
                articles={articles}
                countryCode={code}
                articleCategoryMap={articleCategoryMap}
                groupCounts={groupCounts}
                countryName={display.name}
              />
            )}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <CountryHero
          countryCode={code}
          countryName={country.name}
          countryFlag={country.flag}
          currentLabel="KAIコラム"
          label="— KAI COLUMN"
          title={country.name}
          subtitle={`${country.tagline}　在住日本人 ${country.population}`}
          articleCount={articles.length}
          placeCount={totalplaces}
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
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
