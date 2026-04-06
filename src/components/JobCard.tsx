"use client";

import Link from "next/link";
import { MapPin, Clock, DollarSign } from "lucide-react";

// クライアントコンポーネントなので fs を使う jobs.ts を直接importしない
// 必要な型・定数はここで定義する
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
  return "要相談";
}

type Props = {
  job: Job;
  countryCode: string;
  industry: string;
};

// 雇用形態バッジの色
const employmentTypeBadge: Record<EmploymentType, { bg: string; text: string }> = {
  fulltime: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  parttime: { bg: "bg-teal-50 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-400" },
  contract: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  freelance: { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
};

export default function JobCard({ job, countryCode, industry }: Props) {
  const badge = employmentTypeBadge[job.employment_type];
  const salary = formatSalary(job);

  return (
    <Link
      href={`/${countryCode}/jobs/${industry}/${job.slug}`}
      className="group block"
    >
      <article className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all overflow-hidden flex">
        {/* カラーアクセントバー */}
        <div className="w-1.5 shrink-0 bg-blue-400 dark:bg-blue-600" />

        {/* 本体 */}
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          {/* 上段: 企業名 + 雇用形態 */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs text-stone-400 dark:text-stone-500 truncate">
              {job.company_ja ?? job.company}
            </p>
            <span
              className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}
            >
              {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
            </span>
          </div>

          {/* 求人タイトル */}
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-2 leading-snug">
            {job.title}
          </h2>

          {/* 説明文 */}
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2 mb-3">
            {job.description}
          </p>

          {/* 下段: 給与・勤務地・タグ */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 給与 */}
            <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
              <DollarSign size={11} className="text-blue-400" />
              {salary}
            </span>

            {/* 勤務地 */}
            <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
              <MapPin size={11} />
              {job.location}
            </span>

            {/* 語学要件 */}
            {job.language_requirement && (
              <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                <Clock size={11} />
                {job.language_requirement}
              </span>
            )}
          </div>

          {/* タグ */}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
