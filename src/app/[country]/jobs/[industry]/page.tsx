import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  JOB_INDUSTRIES,
  getIndustry,
  getJobsByIndustry,
  EMPLOYMENT_TYPE_LABELS,
  formatSalary,
} from "@/lib/jobs";
import JobCard from "@/components/JobCard";
import { ChevronRight } from "lucide-react";

export function generateStaticParams() {
  return countries.flatMap((c) =>
    JOB_INDUSTRIES.map((ind) => ({
      country: c.code,
      industry: ind.slug,
    })),
  );
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; industry: string }>;
}) {
  return params.then(({ country: code, industry: slug }) => {
    const country = getCountry(code);
    const industry = getIndustry(slug);
    if (!country || !industry) return {};

    const desc = `${country.name}の${industry.label}求人一覧。${industry.description}`;
    return {
      title: `${country.name}の${industry.label}求人【日本人向け】`,
      description: desc,
      alternates: {
        canonical: `https://kaigaijin.jp/${code}/jobs/${slug}`,
      },
      openGraph: {
        title: `${country.name}の${industry.label}求人【日本人向け】 | Kaigaijin`,
        description: desc,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/jobs/${slug}`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function JobIndustryPage({
  params,
}: {
  params: Promise<{ country: string; industry: string }>;
}) {
  const { country: code, industry: slug } = await params;
  const country = getCountry(code);
  const industry = getIndustry(slug);
  if (!country || !industry) notFound();

  const jobs = getJobsByIndustry(code, slug);

  // 雇用形態別フィルター用
  const employmentTypes = [...new Set(jobs.map((j) => j.employment_type))];

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        {/* ヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
              <Link href="/" className="hover:text-warm-600 transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}`}
                className="hover:text-warm-600 transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/jobs`}
                className="hover:text-warm-600 transition-colors"
              >
                求人情報
              </Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">
                {industry.label}
              </span>
            </nav>
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {country.name}の{industry.label}求人
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {jobs.length > 0 ? `${jobs.length}件を掲載中` : "求人情報を準備中です"}
            </p>
          </div>

          {/* 雇用形態フィルター（複数ある場合） */}
          {employmentTypes.length > 1 && (
            <div className="max-w-6xl mx-auto px-4 border-t border-stone-100 dark:border-stone-700">
              <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                <span className="shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                  すべて（{jobs.length}）
                </span>
                {employmentTypes.map((et) => (
                  <span
                    key={et}
                    className="shrink-0 text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-3 py-1.5 rounded-full"
                  >
                    {EMPLOYMENT_TYPE_LABELS[et]}（
                    {jobs.filter((j) => j.employment_type === et).length}）
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 求人リスト */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {jobs.length > 0 ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.slug}
                  job={job}
                  countryCode={code}
                  industry={slug}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                {country.name}の{industry.label}求人を順次追加しています。
              </p>
              <Link
                href={`/${code}/jobs`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← 業種一覧に戻る
              </Link>
            </div>
          )}

          {/* フッター */}
          <div className="mt-8 flex items-center justify-between">
            <Link
              href={`/${code}/jobs`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← 業種一覧
            </Link>
            <Link
              href="/contact"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              求人情報の掲載・修正
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
