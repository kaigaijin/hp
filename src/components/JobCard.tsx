"use client";

import Link from "next/link";
import { MapPin, DollarSign, Languages, ArrowUpRight } from "lucide-react";

// クライアントコンポーネントなので fs を使う jobs.ts を直接importしない
type EmploymentType = "fulltime" | "parttime" | "contract" | "freelance";
type SalaryType = "monthly" | "hourly" | "annual";

type Job = {
  slug: string;
  company: string;
  company_ja?: string;
  title: string;
  industry: string;
  job_type: string;
  employment_type: EmploymentType;
  location: string;
  nearest_station?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  salary_type: SalaryType;
  language_requirement?: string | null;
  description: string;
  tags: string[];
  status: string;
};

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  fulltime: "正社員",
  parttime: "パートタイム",
  contract: "契約社員",
  freelance: "フリーランス",
};

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  monthly: "月給",
  hourly: "時給",
  annual: "年収",
};

// 雇用形態バッジの色（indigo系）
const employmentTypeBadge: Record<EmploymentType, { bg: string; text: string }> = {
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

function formatSalary(job: Job): string {
  const typeLabel = SALARY_TYPE_LABELS[job.salary_type];
  if (job.salary_min != null && job.salary_max != null) {
    return `${job.salary_currency} ${job.salary_min.toLocaleString()}〜${job.salary_max.toLocaleString()} / ${typeLabel}`;
  }
  if (job.salary_min != null) {
    return `${job.salary_currency} ${job.salary_min.toLocaleString()}〜 / ${typeLabel}`;
  }
  if (job.salary_max != null) {
    return `〜${job.salary_currency} ${job.salary_max.toLocaleString()} / ${typeLabel}`;
  }
  return "給与：要相談";
}

type Props = {
  job: Job;
  countryCode: string;
  industry: string;
};

export default function JobCard({ job, countryCode, industry }: Props) {
  const badge = employmentTypeBadge[job.employment_type];
  const salary = formatSalary(job);

  return (
    <Link href={`/${countryCode}/jobs/${industry}/${job.slug}`} className="group block">
      <article className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5 p-5">
        {/* 上段: 雇用形態バッジ + 企業名 */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}
          >
            {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
          </span>
          <p className="text-xs text-stone-400 dark:text-stone-500 truncate text-right">
            {job.company_ja ?? job.company}
          </p>
        </div>

        {/* 求人タイトル */}
        <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors mb-2 leading-snug">
          {job.title}
        </h2>

        {/* 説明文（2行まで） */}
        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 mb-4">
          {job.description}
        </p>

        {/* 下段: 給与・勤務地・語学要件 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
            <DollarSign size={12} className="text-indigo-400 shrink-0" />
            {salary}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
            <MapPin size={12} className="shrink-0" />
            {job.location}
          </span>
          {job.language_requirement && (
            <span className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
              <Languages size={12} className="shrink-0" />
              {job.language_requirement}
            </span>
          )}
        </div>

        {/* タグ + 詳細リンク */}
        <div className="flex items-end justify-between gap-2 mt-3">
          {job.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {job.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div />
          )}
          <ArrowUpRight
            size={16}
            className="shrink-0 text-stone-300 dark:text-stone-600 group-hover:text-indigo-500 transition-colors"
          />
        </div>
      </article>
    </Link>
  );
}
