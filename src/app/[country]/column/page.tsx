import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticlesByCountry } from "@/lib/articles";
import { Calendar, Tag, ArrowLeft } from "lucide-react";

// overseas など countries 未登録コードのフォールバック表示名
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
    title: `${name}のコラム一覧 | Kaigaijin`,
    description: `${name}の生活情報・現地レポートのコラム一覧。在住者向けの実用情報から読み物まで。`,
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

  const display = country
    ? { name: country.name, flag: country.flag }
    : fallback;
  const articles = getArticlesByCountry(code);

  return (
    <>
      <Header />
      <main className="py-12 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          {/* パンくず */}
          <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
            <Link href="/" className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors">
              Kaigaijin
            </Link>
            <span>/</span>
            {country ? (
              <Link
                href={`/${code}`}
                className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors"
              >
                {display.flag} {display.name}
              </Link>
            ) : (
              <span className="text-stone-600 dark:text-stone-300">{display.flag} {display.name}</span>
            )}
            {country && (
              <>
                <span>/</span>
                <span className="text-stone-600 dark:text-stone-300">コラム</span>
              </>
            )}
          </nav>

          <h1 className="heading-editorial text-3xl md:text-4xl font-bold mb-2">
            {display.flag} {display.name}のコラム
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mb-10">
            {articles.length}件の記事
          </p>

          {articles.length === 0 ? (
            <p className="text-stone-500 dark:text-stone-400">記事はまだありません。</p>
          ) : (
            <ul className="space-y-6">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/${code}/column/${article.slug}`}
                    className="block group p-5 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-warm-400 dark:hover:border-warm-500 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs text-warm-600 dark:text-warm-400 font-medium mb-2">
                      <Tag size={12} />
                      {article.category}
                    </div>
                    <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors mb-1 leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Calendar size={12} />
                      {article.date}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {country && (
            <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-700">
              <Link
                href={`/${code}`}
                className="inline-flex items-center gap-2 text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-300 font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                {display.name}のトップに戻る
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
