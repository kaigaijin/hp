import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  JOB_INDUSTRIES,
  getIndustry,
  getJob,
  getJobsByIndustry,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_TYPE_LABELS,
  formatSalary,
} from "@/lib/jobs";
import JobCard from "@/components/JobCard";
import {
  MapPin,
  Globe,
  Mail,
  ChevronRight,
  ExternalLink,
  BriefcaseBusiness,
  DollarSign,
  Languages,
  ArrowRight,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";

type Params = { country: string; industry: string; slug: string };

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  // スポットと同様にオンデマンド生成
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country: code, industry: indSlug, slug } = await params;
  const country = getCountry(code);
  const industry = getIndustry(indSlug);
  const job = getJob(code, indSlug, slug);
  if (!country || !industry || !job) return {};

  const canonicalUrl = `https://kaigaijin.jp/${code}/jobs/${indSlug}/${slug}`;
  const companyName = job.company_ja ?? job.company;
  return {
    title: `${job.title}｜${companyName}（${country.name}）`,
    description: job.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${job.title} | ${companyName} | Kaigaijin`,
      description: job.description,
      type: "article",
      locale: "ja_JP",
      url: canonicalUrl,
      siteName: "Kaigaijin",
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country: code, industry: indSlug, slug } = await params;
  const country = getCountry(code);
  const industry = getIndustry(indSlug);
  const job = getJob(code, indSlug, slug);
  if (!country || !industry || !job) notFound();

  const companyName = job.company_ja ?? job.company;
  const salary = formatSalary(job);

  // 同業種の他求人
  const otherJobs = getJobsByIndustry(code, indSlug).filter(
    (j) => j.slug !== slug,
  );

  // JSON-LD: JobPosting schema
  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.detail ?? job.description,
    datePosted: job.posted_at,
    ...(job.expires_at && { validThrough: job.expires_at }),
    employmentType:
      job.employment_type === "fulltime"
        ? "FULL_TIME"
        : job.employment_type === "parttime"
          ? "PART_TIME"
          : job.employment_type === "contract"
            ? "CONTRACTOR"
            : "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.company_website && { sameAs: job.company_website }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: code.toUpperCase(),
      },
    },
    ...(job.salary_min != null && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.salary_currency,
        value: {
          "@type": "QuantitativeValue",
          minValue: job.salary_min,
          ...(job.salary_max != null && { maxValue: job.salary_max }),
          unitText:
            job.salary_type === "monthly"
              ? "MONTH"
              : job.salary_type === "hourly"
                ? "HOUR"
                : "YEAR",
        },
      },
    }),
    ...(job.contact_url && { url: job.contact_url }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "トップ",
        item: "https://kaigaijin.jp",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: country.name,
        item: `https://kaigaijin.jp/${code}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "求人情報",
        item: `https://kaigaijin.jp/${code}/jobs`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: industry.label,
        item: `https://kaigaijin.jp/${code}/jobs/${indSlug}`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: job.title,
      },
    ],
  };

  // 応募先URL（contact_url優先、なければcontact_emailのmailto:）
  const applyUrl =
    job.contact_url ??
    (job.contact_email ? `mailto:${job.contact_email}` : null);

  return (
    <>
      <Header />
      <main className="bg-sand-50 dark:bg-stone-950 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        {/* パンくず */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 flex-wrap">
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
              <Link
                href={`/${code}/jobs/${indSlug}`}
                className="hover:text-warm-600 transition-colors"
              >
                {industry.label}
              </Link>
            </nav>
          </div>
        </div>

        {/* ヒーローエリア */}
        <div className="bg-gradient-to-b from-blue-50 to-sand-50 dark:from-blue-950/30 dark:to-stone-950 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
            {/* 業種バッジ */}
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <BriefcaseBusiness size={14} />
              {industry.label}
              <span className="text-blue-400 dark:text-blue-500">
                /{EMPLOYMENT_TYPE_LABELS[job.employment_type]}
              </span>
            </div>

            {/* 求人タイトル */}
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-50 mb-2 leading-tight">
              {job.title}
            </h1>

            {/* 企業名 */}
            <p className="text-stone-500 dark:text-stone-400 text-base mb-4">
              {companyName}
              {job.company_ja && job.company !== job.company_ja && (
                <span className="text-stone-400 dark:text-stone-500 text-sm ml-2">
                  / {job.company}
                </span>
              )}
            </p>

            {/* 勤務地 */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                <MapPin size={14} />
                {job.location}
                {job.nearest_station && (
                  <span className="text-stone-400">（{job.nearest_station}）</span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                <DollarSign size={14} />
                {salary}
              </span>
            </div>

            {/* description */}
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              {job.description}
            </p>

            {/* 未確認注記 */}
            {job.status === "unverified" && (
              <p className="mt-3 text-xs text-stone-400 italic">
                ※ この情報はWeb上のデータを元に掲載しています。応募前に公式サイトをご確認ください。
              </p>
            )}
          </div>
        </div>

        {/* アクションバー */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 sticky top-16 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            {applyUrl && (
              <a
                href={applyUrl}
                target={job.contact_url ? "_blank" : undefined}
                rel={job.contact_url ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors"
              >
                <ExternalLink size={14} />
                応募する
              </a>
            )}
            {/* タグ */}
            {job.tags.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5">
                {job.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex-1" />
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左カラム */}
            <div className="lg:col-span-2 space-y-6">
              {/* タグ（モバイル） */}
              {job.tags.length > 0 && (
                <div className="md:hidden flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 詳細説明 */}
              {job.detail && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-50 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      仕事内容
                    </h2>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {job.detail}
                    </p>
                  </div>
                </div>
              )}

              {/* 応募要件 */}
              {job.requirements && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-50 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      応募要件
                    </h2>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* 福利厚生 */}
              {job.benefits && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                  <div className="px-5 py-3 border-b border-stone-50 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      待遇・福利厚生
                    </h2>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {job.benefits}
                    </p>
                  </div>
                </div>
              )}

              {/* 他の求人 */}
              {otherJobs.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300 mb-3">
                    {industry.label}の他の求人
                  </h2>
                  <div className="space-y-3">
                    {otherJobs.slice(0, 3).map((j) => (
                      <JobCard
                        key={j.slug}
                        job={j}
                        countryCode={code}
                        industry={indSlug}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 右サイドバー */}
            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              {/* 基本情報カード */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-50 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                  <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    求人情報
                  </h2>
                </div>
                <dl className="p-5 space-y-4">
                  {/* 勤務地 */}
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <MapPin size={12} />
                      勤務地
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300">
                      {job.location}
                      {job.nearest_station && (
                        <span className="block text-xs text-stone-400 mt-0.5">
                          最寄り: {job.nearest_station}
                        </span>
                      )}
                    </dd>
                  </div>

                  {/* 給与 */}
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <DollarSign size={12} />
                      給与
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300">
                      {salary}
                    </dd>
                  </div>

                  {/* 雇用形態 */}
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <Clock size={12} />
                      雇用形態
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300">
                      {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                    </dd>
                  </div>

                  {/* 語学要件 */}
                  {job.language_requirement && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Languages size={12} />
                        語学要件
                      </dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {job.language_requirement}
                      </dd>
                    </div>
                  )}

                  {/* 掲載日 */}
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <CalendarDays size={12} />
                      掲載日
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300">
                      {job.posted_at}
                      {job.expires_at && (
                        <span className="block text-xs text-stone-400 mt-0.5">
                          締切: {job.expires_at}
                        </span>
                      )}
                    </dd>
                  </div>

                  {/* 公式サイト */}
                  {job.company_website && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Globe size={12} />
                        企業サイト
                      </dt>
                      <dd>
                        <a
                          href={job.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                        >
                          {job.company_website}
                        </a>
                      </dd>
                    </div>
                  )}

                  {/* 応募ボタン */}
                  {applyUrl && (
                    <a
                      href={applyUrl}
                      target={job.contact_url ? "_blank" : undefined}
                      rel={job.contact_url ? "noopener noreferrer" : undefined}
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
                    >
                      <ExternalLink size={14} />
                      応募する
                    </a>
                  )}

                  {/* メール応募 */}
                  {job.contact_email && (
                    <a
                      href={`mailto:${job.contact_email}`}
                      className="flex items-center justify-center gap-2 w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-xl py-2.5 text-sm font-medium hover:border-blue-400 transition-colors"
                    >
                      <Mail size={14} />
                      メールで問い合わせ
                    </a>
                  )}
                </dl>
              </div>

              {/* 注意書き */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 p-4">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  掲載情報は変更になる場合があります。応募前に必ず公式サイトで最新情報をご確認ください。
                </p>
              </div>
            </div>
          </div>

          {/* 底部CTA */}
          <div className="mt-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-100">
                {country.flag} {country.name}の{industry.label}求人をもっと見る
              </p>
              <p className="text-sm text-stone-400 mt-0.5">
                日本人向けの求人情報を一覧で確認できます
              </p>
            </div>
            <Link
              href={`/${code}/jobs/${indSlug}`}
              className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-full text-sm transition-colors"
            >
              一覧を見る <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
