import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticle, getArticlesByCountry } from "@/lib/articles";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

export function generateStaticParams() {
  return countries.flatMap((c) =>
    getArticlesByCountry(c.code).map((a) => ({
      country: c.code,
      slug: a.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country: code, slug } = await params;
  const article = getArticle(code, slug);
  if (!article) return {};
  const country = getCountry(code);
  return {
    title: `${article.meta.title} | ${country?.name ?? ""} | Kaigaijin`,
    description: article.meta.description,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country: code, slug } = await params;
  const country = getCountry(code);
  const article = getArticle(code, slug);
  if (!country || !article) notFound();

  return (
    <>
      <Header />
      <main className="py-12 md:py-20">
        <article className="max-w-3xl mx-auto px-4">
          {/* パンくず */}
          <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
            <Link href="/" className="hover:text-ocean-600 transition-colors">
              Kaigaijin
            </Link>
            <span>/</span>
            <Link
              href={`/${code}`}
              className="hover:text-ocean-600 transition-colors"
            >
              {country.flag} {country.name}
            </Link>
            <span>/</span>
            <span className="text-stone-600">{article.meta.title}</span>
          </nav>

          {/* ヘッダー */}
          <header className="mb-12">
            <div className="flex items-center gap-2 text-sm text-ocean-600 font-medium mb-3">
              <Tag size={14} />
              {article.meta.category}
            </div>
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold leading-tight mb-4">
              {article.meta.title}
            </h1>
            <p className="text-lg text-stone-500 leading-relaxed mb-4">
              {article.meta.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-stone-400">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {article.meta.date}
              </div>
              <div className="flex gap-2">
                {article.meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <hr className="mt-8 border-stone-200" />
          </header>

          {/* 本文 */}
          <div className="prose prose-stone prose-lg max-w-none prose-headings:heading-editorial prose-a:text-ocean-600 prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={article.content} />
          </div>

          {/* 戻るリンク */}
          <div className="mt-16 pt-8 border-t border-stone-200">
            <Link
              href={`/${code}`}
              className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-800 font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              {country.name}の記事一覧に戻る
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
