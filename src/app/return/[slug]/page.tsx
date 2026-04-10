import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getReturnArticle, getReturnArticles } from "@/lib/articles";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Comments from "@/components/Comments";
import { BarChartMDX, LineChartMDX, PieChartMDX } from "@/components/charts";
import remarkGfm from "remark-gfm";

const mdxComponents = {
  BarChart: BarChartMDX,
  LineChart: LineChartMDX,
  PieChart: PieChartMDX,
  table: (props: React.ComponentProps<"table">) => (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as const }}>
      <table {...props} />
    </div>
  ),
  a: (props: React.ComponentProps<"a">) => {
    const isExternal = props.href?.startsWith("http");
    return isExternal ? (
      <a {...props} target="_blank" rel="noopener noreferrer" />
    ) : (
      <a {...props} />
    );
  },
};

export function generateStaticParams() {
  return getReturnArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getReturnArticle(slug);
  if (!article) return {};
  const baseUrl = "https://kaigaijin.jp";
  return {
    title: `${article.meta.title} | 帰国準備 | Kaigaijin`,
    description: article.meta.description,
    alternates: { canonical: `${baseUrl}/return/${slug}` },
    openGraph: {
      title: `${article.meta.title} | 帰国準備 | Kaigaijin`,
      description: article.meta.description,
      type: "article",
      publishedTime: article.meta.date,
      modifiedTime: article.meta.lastModified || article.meta.date,
      locale: "ja_JP",
    },
  };
}

export default async function ReturnArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getReturnArticle(slug);
  if (!article) notFound();

  const baseUrl = "https://kaigaijin.jp";

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.meta.title,
    description: article.meta.description,
    datePublished: article.meta.date,
    dateModified: article.meta.lastModified || article.meta.date,
    url: `${baseUrl}/return/${slug}`,
    author: { "@type": "Organization", name: "Kaigaijin", url: baseUrl },
    publisher: { "@type": "Organization", name: "Kaigaijin", url: baseUrl },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/return/${slug}` },
    ...(article.meta.tags.length > 0 ? { keywords: article.meta.tags.join(", ") } : {}),
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "トップ", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "帰国準備ガイド", item: `${baseUrl}/return` },
      { "@type": "ListItem", position: 3, name: article.meta.title, item: `${baseUrl}/return/${slug}` },
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
          <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors">
              Kaigaijin
            </Link>
            <span>/</span>
            <Link href="/return" className="hover:text-warm-600 dark:hover:text-warm-400 transition-colors">
              帰国準備ガイド
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
            <div className="flex flex-col gap-2 text-sm text-stone-400">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {article.meta.date}
                {article.meta.lastModified && article.meta.lastModified !== article.meta.date && (
                  <span>（更新: {article.meta.lastModified}）</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {article.meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
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
            <MDXRemote
              source={article.content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>

          {/* コメント */}
          <Comments project="kaigaijin" articleSlug={`return/${slug}`} />

          {/* 戻るリンク */}
          <div className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-700">
            <Link
              href="/return"
              className="inline-flex items-center gap-2 text-warm-600 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-300 font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              帰国準備ガイド一覧に戻る
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
