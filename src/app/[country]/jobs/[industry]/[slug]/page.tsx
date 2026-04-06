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
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import type { Metadata } from "next";

type Params = { country: string; industry: string; slug: string };

export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  // オンデマンド生成
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

  const otherJobs = getJobsByIndustry(code, indSlug).filter(
    (j) => j.slug !== slug,
  );

  // 応募先URL（contact_url優先、なければcontact_emailのmailto:）
  const applyUrl =
    job.contact_url ??
    (job.contact_email ? `mailto:${job.contact_email}` : null);

  // JSON-LD: JobPosting
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

  // 雇用形態バッジ色
  const empBadge: Record<string, { bg: string; text: string }> = {
    fulltime: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-400",
    },
    parttime: {
      bg: "bg-teal-50 dark:bg-teal-900/30",
      text: "text-teal-700 dark:text-teal-400",
    },
    contract: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
    },
    freelance: {
      bg: "bg-violet-50 dark:bg-violet-900/30",
      text: "text-violet-700 dark:text-violet-400",
    },
  };
  const badge = empBadge[job.employment_type] ?? empBadge.fulltime;

  return (
    <>
      <Header />
      <main className="bg-stone-50 dark:bg-stone-950 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />

        {/* ─── パンくず ────────────────────────────── */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 flex-wrap">
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-indigo-600 transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/jobs`} className="hover:text-indigo-600 transition-colors">
                求人情報
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/jobs/${indSlug}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {industry.label}
              </Link>
            </nav>
          </div>
        </div>

        {/* ─── ヒーローエリア ────────────────────────── */}
        <div className="bg-gradient-to-b from-indigo-50 to-stone-50 dark:from-indigo-950/40 dark:to-stone-950 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
            {/* 業種バッジ + 雇用形態バッジ */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-xs font-semibold px-3 py-1.5 rounded-full">
                <BriefcaseBusiness size={13} />
                {industry.label}
              </span>
              <span
                className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${badge.bg} ${badge.text}`}
              >
                {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
              </span>
            </div>

            {/* 求人タイトル */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-50 mb-3 leading-tight tracking-tight">
              {job.title}
            </h1>

            {/* 企業名 */}
            <p className="text-stone-500 dark:text-stone-400 text-lg font-medium mb-5">
              {companyName}
              {job.company_ja && job.company !== job.company_ja && (
                <span className="text-stone-400 dark:text-stone-500 text-sm ml-2 font-normal">
                  / {job.company}
                </span>
              )}
            </p>

            {/* メタ情報 */}
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                <MapPin size={15} className="text-indigo-400" />
                {job.location}
                {job.nearest_station && (
                  <span className="text-stone-400">（{job.nearest_station}）</span>
                )}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                <DollarSign size={15} className="text-indigo-400" />
                {salary}
              </span>
              {job.language_requirement && (
                <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                  <Languages size={15} className="text-indigo-400" />
                  {job.language_requirement}
                </span>
              )}
            </div>

            {/* description */}
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl text-base">
              {job.description}
            </p>

            {/* 未確認注記 */}
            {job.status === "unverified" && (
              <div className="mt-4 flex items-start gap-2 text-xs text-stone-400">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>
                  この情報はWeb上のデータを元に掲載しています。応募前に公式サイトをご確認ください。
                </span>
              </div>
            )}

            {/* モバイル用応募ボタン（ヒーロー内） */}
            {applyUrl && (
              <a
                href={applyUrl}
                target={job.contact_url ? "_blank" : undefined}
                rel={job.contact_url ? "noopener noreferrer" : undefined}
                className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold px-7 py-3.5 rounded-xl transition shadow-md shadow-indigo-200 dark:shadow-none text-sm"
              >
                <ExternalLink size={15} />
                この求人に応募する
              </a>
            )}
          </div>
        </div>

        {/* ─── タグバー ──────────────────────────────── */}
        {job.tags.length > 0 && (
          <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── メインコンテンツ（2カラム） ───────────── */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

            {/* ─── 左カラム（メイン） ─── */}
            <div className="lg:col-span-2 space-y-6">

              {/* 仕事内容 */}
              {job.detail && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="text-sm font-bold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
                      仕事内容
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {job.detail}
                    </p>
                  </div>
                </div>
              )}

              {/* 応募要件 */}
              {job.requirements && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="text-sm font-bold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-teal-500 rounded-full inline-block" />
                      応募要件
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* 福利厚生 */}
              {job.benefits && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="text-sm font-bold text-stone-700 dark:text-stone-200 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-amber-400 rounded-full inline-block" />
                      待遇・福利厚生
                    </h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {job.benefits}
                    </p>
                  </div>
                </div>
              )}

              {/* 他の求人 */}
              {otherJobs.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-4 flex items-center gap-2">
                    <BriefcaseBusiness size={15} className="text-indigo-400" />
                    {industry.label}の他の求人
                  </h2>
                  <div className="space-y-4">
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

            {/* ─── 右サイドバー（スティッキー） ─── */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

              {/* 応募カード */}
              {applyUrl && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 dark:from-indigo-800 dark:to-indigo-700 rounded-2xl p-5">
                  <p className="text-white font-bold text-base mb-1">
                    この求人に応募する
                  </p>
                  <p className="text-indigo-200 text-xs mb-4 leading-relaxed">
                    公式サイトまたはメールから直接応募できます。
                  </p>
                  <a
                    href={applyUrl}
                    target={job.contact_url ? "_blank" : undefined}
                    rel={job.contact_url ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-center gap-2 w-full bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl py-3 text-sm font-bold transition shadow"
                  >
                    <ExternalLink size={14} />
                    応募する
                  </a>
                  {job.contact_email && job.contact_url && (
                    <a
                      href={`mailto:${job.contact_email}`}
                      className="flex items-center justify-center gap-2 w-full mt-2 bg-indigo-700/50 hover:bg-indigo-700/70 text-white rounded-xl py-2.5 text-xs font-medium transition"
                    >
                      <Mail size={13} />
                      メールで問い合わせ
                    </a>
                  )}
                </div>
              )}

              {/* メール応募のみの場合 */}
              {!job.contact_url && job.contact_email && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-200 mb-3">
                    応募方法
                  </p>
                  <a
                    href={`mailto:${job.contact_email}`}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold transition"
                  >
                    <Mail size={14} />
                    メールで応募する
                  </a>
                </div>
              )}

              {/* 基本情報カード */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                  <h2 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    求人情報
                  </h2>
                </div>
                <dl className="p-5 space-y-4">
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <MapPin size={11} />
                      勤務地
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300 font-medium">
                      {job.location}
                      {job.nearest_station && (
                        <span className="block text-xs text-stone-400 font-normal mt-0.5">
                          最寄り: {job.nearest_station}
                        </span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <DollarSign size={11} />
                      給与
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300 font-medium">
                      {salary}
                    </dd>
                  </div>

                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <Clock size={11} />
                      雇用形態
                    </dt>
                    <dd className="text-sm text-stone-700 dark:text-stone-300">
                      {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                    </dd>
                  </div>

                  {job.language_requirement && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Languages size={11} />
                        語学要件
                      </dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {job.language_requirement}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <CalendarDays size={11} />
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

                  {job.company_website && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-stone-400 mb-1">
                        <Globe size={11} />
                        企業サイト
                      </dt>
                      <dd>
                        <a
                          href={job.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                        >
                          {job.company_website}
                        </a>
                      </dd>
                    </div>
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

          {/* ─── 底部CTA ────────────────────────────── */}
          <div className="mt-12 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p className="font-extrabold text-stone-800 dark:text-stone-100 text-lg">
                {country.flag} {country.name}の{industry.label}求人をもっと見る
              </p>
              <p className="text-sm text-stone-400 mt-1">
                日本人向けの求人情報を一覧で確認できます
              </p>
            </div>
            <Link
              href={`/${code}/jobs/${indSlug}`}
              className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition shadow"
            >
              一覧を見る <ArrowRight size={14} />
            </Link>
          </div>

          {/* 業種一覧へ戻る */}
          <div className="mt-5 text-center">
            <Link
              href={`/${code}/jobs`}
              className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={14} />
              業種一覧へ戻る
            </Link>
          </div>
        </div>

        {/* ─── モバイル固定フッター応募ボタン ──────── */}
        {applyUrl && (
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm border-t border-stone-200 dark:border-stone-700 px-4 py-3">
            <a
              href={applyUrl}
              target={job.contact_url ? "_blank" : undefined}
              rel={job.contact_url ? "noopener noreferrer" : undefined}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold py-4 rounded-xl transition shadow-lg text-sm"
            >
              <ExternalLink size={15} />
              この求人に応募する
            </a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
