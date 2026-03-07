import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import { ArrowRight, Calendar, Tag } from "lucide-react";

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.code }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  // generateMetadata is async in Next.js 15+
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

        {/* 記事一覧 */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            {articles.length > 0 ? (
              <>
                <h2 className="heading-editorial text-2xl font-bold mb-8 line-accent">
                  {country.name}の記事
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/${code}/${article.slug}`}
                      className="group"
                    >
                      <article className="bg-white rounded-2xl border border-stone-200 p-6 h-full flex flex-col country-card">
                        {/* カテゴリ */}
                        <div className="flex items-center gap-2 text-xs text-ocean-600 font-medium mb-3">
                          <Tag size={12} />
                          {article.category}
                        </div>

                        <h3 className="heading-editorial text-lg font-bold mb-2 group-hover:text-ocean-700 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-stone-500 leading-relaxed mb-4 flex-1">
                          {article.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-stone-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {article.date}
                          </div>
                          <span className="flex items-center gap-1 text-ocean-600 font-medium group-hover:gap-2 transition-all">
                            続きを読む
                            <ArrowRight size={12} />
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              /* 記事なし — Coming Soon */
              <div className="text-center py-16">
                <span className="text-6xl mb-6 block">{country.flag}</span>
                <h2 className="heading-editorial text-2xl font-bold mb-4">
                  {country.name}の記事を準備中
                </h2>
                <p className="text-stone-500 max-w-md mx-auto mb-8">
                  {country.name}
                  での生活に役立つ記事を鋭意執筆中です。公開時にお知らせを受け取りたい方は、トップページからメールアドレスをご登録ください。
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
        </section>
      </main>
      <Footer />
    </>
  );
}
