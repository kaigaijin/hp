import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getGuideArticle, getGuideArticles } from "@/lib/articles";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import Comments from "@/components/Comments";
import { BarChartMDX, LineChartMDX, PieChartMDX } from "@/components/charts";
import remarkGfm from "remark-gfm";

const mdxComponents = { BarChart: BarChartMDX, LineChart: LineChartMDX, PieChart: PieChartMDX };

export function generateStaticParams() {
  return getGuideArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getGuideArticle(slug);
  if (!article) return {};
  return {
    title: `${article.meta.title} | Kaigaijin`,
    description: article.meta.description,
    openGraph: {
      title: `${article.meta.title} | Kaigaijin`,
      description: article.meta.description,
      type: "article",
      publishedTime: article.meta.date,
      modifiedTime: article.meta.lastModified || article.meta.date,
    },
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getGuideArticle(slug);
  if (!article) notFound();

  const baseUrl = "https://kaigaijin.com";

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.meta.title,
    description: article.meta.description,
    datePublished: article.meta.date,
    dateModified: article.meta.lastModified || article.meta.date,
    url: `${baseUrl}/guide/${slug}`,
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
      "@id": `${baseUrl}/guide/${slug}`,
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
        name: "共通ガイド",
        item: `${baseUrl}/guide`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.meta.title,
        item: `${baseUrl}/guide/${slug}`,
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
            <Link href="/" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
              Kaigaijin
            </Link>
            <span>/</span>
            <Link
              href="/guide"
              className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
            >
              共通ガイド
            </Link>
            <span>/</span>
            <span className="text-stone-600 dark:text-stone-300">{article.meta.title}</span>
          </nav>

          {/* ヘッ���ー */}
          <header className="mb-12">
            <div className="flex items-center gap-2 text-sm text-ocean-600 dark:text-ocean-400 font-medium mb-3">
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
          <div className="prose prose-stone dark:prose-invert prose-lg max-w-none prose-headings:heading-editorial prose-a:text-ocean-600 dark:prose-a:text-ocean-400 prose-a:no-underline hover:prose-a:underline">
            <MDXRemote source={article.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </div>

          {/* コメント */}
          <Comments project="kaigaijin" articleSlug={`guide/${slug}`} />

          {/* 戻るリンク */}
          <div className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-700">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-ocean-600 dark:text-ocean-400 hover:text-ocean-800 dark:hover:text-ocean-300 font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              トップページに戻る
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
