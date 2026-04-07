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
} from "@/lib/jobs";
import JobCard from "@/components/JobCard";
import {
  ChevronRight,
  BriefcaseBusiness,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const revalidate = 60;

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

  const jobs = await getJobsByIndustry(code, slug);
  const employmentTypes = [...new Set(jobs.map((j) => j.employment_type))];

  return (
    <>
      <Header />
      <main className="bg-stone-50 dark:bg-stone-900 min-h-screen">

        {/* ─── ページヘッダー ──────────────────────── */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-6">
            {/* パンくず */}
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-5 flex-wrap">
              <Link href="/" className="hover:text-warm-600 transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-warm-600 transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/jobs`} className="hover:text-warm-600 transition-colors">
                求人情報
              </Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">{industry.label}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warm-50 dark:bg-stone-700 rounded-xl flex items-center justify-center text-warm-600 dark:text-warm-400 shrink-0">
                  <BriefcaseBusiness size={22} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-50 leading-tight">
                    {country.name}の{industry.label}求人
                  </h1>
                  <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">
                    {jobs.length > 0
                      ? `${jobs.length}件を掲載中`
                      : "求人情報を準備中です"}
                  </p>
                </div>
              </div>
              <Link
                href={`/${code}/jobs/new`}
                className="shrink-0 inline-flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                この業種で求人を掲載する
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* 雇用形態フィルター（pillボタン） */}
          {employmentTypes.length > 1 && (
            <div className="max-w-6xl mx-auto px-4 pb-4">
              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
                <span className="shrink-0 text-xs font-semibold text-white bg-warm-500 px-4 py-2 rounded-full cursor-default">
                  すべて（{jobs.length}）
                </span>
                {employmentTypes.map((et) => (
                  <span
                    key={et}
                    className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-700/60 hover:bg-stone-200 dark:hover:bg-stone-700 px-4 py-2 rounded-full cursor-pointer transition"
                  >
                    {EMPLOYMENT_TYPE_LABELS[et]}（
                    {jobs.filter((j) => j.employment_type === et).length}）
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── 求人リスト ──────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {jobs.length > 0 ? (
            <div className="space-y-4">
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
            <div className="text-center py-20 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700">
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BriefcaseBusiness size={24} className="text-stone-400" />
              </div>
              <p className="text-stone-500 dark:text-stone-400 mb-2 font-medium">
                {country.name}の{industry.label}求人を準備中です
              </p>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
                求人掲載の受付を行っています。お気軽にご投稿ください。
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href={`/${code}/jobs`}
                  className="text-sm text-warm-600 dark:text-warm-400 hover:underline"
                >
                  ← 業種一覧に戻る
                </Link>
                <Link
                  href={`/${code}/jobs/new`}
                  className="inline-flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                >
                  求人を掲載する（無料）
                </Link>
              </div>
            </div>
          )}

          {/* ─── CTAバナー ─────────────────────────── */}
          {jobs.length > 0 && (
            <div className="mt-10 bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e] rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Sparkles size={14} className="text-stone-400" />
                  <p className="text-stone-400 text-xs font-semibold">
                    採用担当者の方へ
                  </p>
                </div>
                <p className="text-white font-bold text-lg">
                  この業種で求人を掲載しませんか？
                </p>
                <p className="text-stone-300 text-sm mt-0.5">
                  掲載料無料・審査後3営業日以内に掲載
                </p>
              </div>
              <Link
                href={`/${code}/jobs/new`}
                className="shrink-0 inline-flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white font-bold px-7 py-3.5 rounded-xl transition shadow text-sm whitespace-nowrap"
              >
                求人を無料掲載する
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* フッター */}
          <div className="mt-6 flex items-center justify-between">
            <Link
              href={`/${code}/jobs`}
              className="text-sm text-warm-600 dark:text-warm-400 hover:underline"
            >
              ← 業種一覧
            </Link>
            <Link
              href="/contact"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              掲載情報の修正・削除
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
