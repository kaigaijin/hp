import { redirect, notFound } from "next/navigation";
import { getAllArticles } from "@/lib/articles";

// 記事以外のルート（place/jobs/column等）はこのページを経由しない
const RESERVED_SEGMENTS = ["place", "jobs", "column", "area", "map"];

export function generateStaticParams() {
  return getAllArticles().map((a) => ({
    country: a.country,
    slug: a.slug,
  }));
}

export default async function ArticleRedirectPage({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country, slug } = await params;

  // 予約済みセグメントはリダイレクトしない
  if (RESERVED_SEGMENTS.includes(slug)) {
    notFound();
  }

  // 記事URLを /column/ 付きに301リダイレクト
  redirect(`/${country}/column/${slug}`);
}
