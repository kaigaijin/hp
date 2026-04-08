import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getArticle, getArticlesByCountry, getAllArticles } from "@/lib/articles";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Comments from "@/components/Comments";
import { BarChartMDX, LineChartMDX, PieChartMDX } from "@/components/charts";
import remarkGfm from "remark-gfm";

const mdxComponents = { BarChart: BarChartMDX, LineChart: LineChartMDX, PieChart: PieChartMDX };

export function generateStaticParams() {
  // countries リストに依存せず content/ ディレクトリを直接走査
  // （column など countries 未登録の記事も含める）
  return getAllArticles().map((a) => ({
    country: a.country,
    slug: a.slug,
  }));
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
    openGraph: {
      title: `${article.meta.title} | ${country?.name ?? ""} | Kaigaijin`,
      description: article.meta.description,
      type: "article",
      publishedTime: article.meta.date,
      modifiedTime: article.meta.lastModified || article.meta.date,
    },
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
  if (!article) notFound();
  // column など countries 未登録のコードは汎用フォールバックを使う
  const countryDisplay = country ?? { name: "コラム", flag: "📰", code };

  const baseUrl = "https://kaigaijin.com";

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.meta.title,
    description: article.meta.description,
    datePublished: article.meta.date,
    dateModified: article.meta.lastModified || article.meta.date,
    url: `${baseUrl}/${code}/column/${slug}`,
    author: {
      "@type": "Organization",
      name: "Kaigaijin",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Kaigaijin",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${code}/column/${slug}`,
    },
    ...(article.meta.tags.length > 0 ? { keywords: article.meta.tags.join(", ") } : {}),
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: countryDisplay.name,
        item: `${baseUrl}/${code}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "コラム",
        item: `${baseUrl}/${code}/column`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: article.meta.title,
        item: `${baseUrl}/${code}/column/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <Header />
      <main className="py-12 md:py-20">
        <article className="max-w-3xl mx-auto px-4">
          {/* パンくず */}
          <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
            <Link href="/" className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors">
              Kaigaijin
            </Link>
            <span>/</span>
            <Link
              href={`/${code}`}
              className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors"
            >
              {countryDisplay.flag} {countryDisplay.name}
            </Link>
            <span>/</span>
            <Link
              href={`/${code}/column`}
              className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors"
            >
              コラム
            </Link>
            <span>/</span>
            <span className="text-stone-600 dark:text-stone-300">{article.meta.title}</span>
          </nav>

          {/* ヘッダー */}
          <header className="mb-12">
            <div className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400 font-medium mb-3">
              <Tag size={14} />
              {article.meta.category}
            </div>
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold leading-tight mb-4">
              {article.meta.title}
            </h1>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
              {article.meta.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-stone-400">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {article.meta.date}
                {article.meta.lastModified && article.meta.lastModified !== article.meta.date && (
                  <span>（更新: {article.meta.lastModified}）</span>
                )}
              </div>
              <div className="flex gap-2">
                {article.meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <hr className="mt-8 border-stone-200 dark:border-stone-700" />
          </header>

          {/* 本文 */}
          <div className="prose prose-stone dark:prose-invert prose-lg max-w-none prose-headings:heading-editorial prose-a:text-warm-600 dark:prose-a:text-warm-400 prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={article.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </div>

          {/* コメント */}
          <Comments project="kaigaijin" articleSlug={`${code}/${slug}`} />

          {/* 戻るリンク */}
          <div className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-700">
            <Link
              href={`/${code}`}
              className="inline-flex items-center gap-2 text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-300 font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              {countryDisplay.name}の記事一覧に戻る
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
