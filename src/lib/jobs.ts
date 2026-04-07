// 業種定義
export type IndustryDef = {
  slug: string;
  label: string;
  icon: string; // lucide-react アイコン名
  description: string;
};

export const JOB_INDUSTRIES: IndustryDef[] = [
  {
    slug: "restaurant",
    label: "飲食・レストラン",
    icon: "UtensilsCrossed",
    description: "日系レストラン・居酒屋・カフェなどの飲食スタッフ",
  },
  {
    slug: "retail",
    label: "小売・販売",
    icon: "ShoppingBag",
    description: "日系スーパー・ショップの販売・レジスタッフ",
  },
  {
    slug: "it",
    label: "IT・エンジニア",
    icon: "Laptop",
    description: "ソフトウェアエンジニア・インフラ・データ系エンジニア",
  },
  {
    slug: "education",
    label: "教育・講師",
    icon: "GraduationCap",
    description: "日本語教師・塾講師・インター校スタッフ",
  },
  {
    slug: "hospitality",
    label: "ホテル・観光",
    icon: "Hotel",
    description: "ホテルフロント・コンシェルジュ・ツアーガイド",
  },
  {
    slug: "beauty",
    label: "美容・エステ",
    icon: "Scissors",
    description: "美容師・ネイリスト・エステティシャン",
  },
  {
    slug: "medical",
    label: "医療・介護",
    icon: "Stethoscope",
    description: "医師・看護師・薬剤師・介護スタッフ",
  },
  {
    slug: "finance",
    label: "金融・会計",
    icon: "Calculator",
    description: "経理・会計士・税理士・FP・金融アドバイザー",
  },
  {
    slug: "office",
    label: "オフィス・事務",
    icon: "Briefcase",
    description: "事務・秘書・営業サポート・バックオフィス",
  },
  {
    slug: "other",
    label: "その他",
    icon: "MoreHorizontal",
    description: "上記カテゴリに当てはまらない求人",
  },
];

// 雇用形態
export type EmploymentType = "fulltime" | "parttime" | "contract" | "freelance";

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  fulltime: "正社員",
  parttime: "パートタイム",
  contract: "契約社員",
  freelance: "フリーランス",
};

// 給与タイプ
export type SalaryType = "monthly" | "hourly" | "annual";

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  monthly: "月給",
  hourly: "時給",
  annual: "年収",
};

// 掲載ステータス
export type JobStatus = "active" | "closed" | "unverified";

// 情報ソース
export type JobSource = "company" | "ai_collected" | "user_submitted";

// 求人データ型
export type Job = {
  slug: string;
  company: string;
  company_ja?: string;
  title: string;
  industry: string; // 業種スラッグ
  job_type: string; // 職種テキスト
  employment_type: EmploymentType;
  location: string;
  nearest_station?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  salary_type: SalaryType;
  language_requirement?: string | null;
  description: string;
  detail?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  contact_email?: string | null;
  contact_url?: string | null;
  company_website?: string | null;
  tags: string[];
  status: JobStatus;
  source: JobSource;
  posted_at: string;
  expires_at?: string | null;
  last_verified: string;
  priority?: number;
};

// Supabase REST API経由でフェッチ
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function supabaseFetch(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    next: { revalidate: 60 },
  });
}

// 業種別求人を取得
export async function getJobsByIndustry(
  countryCode: string,
  industry: string,
): Promise<Job[]> {
  const query = new URLSearchParams({
    country: `eq.${countryCode}`,
    industry: `eq.${industry}`,
    status: "neq.closed",
    order: "priority.desc,posted_at.desc",
  });
  const res = await supabaseFetch(`jobs?${query}`);
  if (!res.ok) return [];
  return res.json();
}

// 個別求人を取得
export async function getJob(
  countryCode: string,
  industry: string,
  slug: string,
): Promise<Job | undefined> {
  const query = new URLSearchParams({
    country: `eq.${countryCode}`,
    industry: `eq.${industry}`,
    slug: `eq.${slug}`,
    status: "neq.closed",
    limit: "1",
  });
  const res = await supabaseFetch(`jobs?${query}`);
  if (!res.ok) return undefined;
  const rows: Job[] = await res.json();
  return rows[0];
}

// 国の全求人を取得
export async function getAllJobs(
  countryCode: string,
): Promise<Array<Job & { industry: string }>> {
  const query = new URLSearchParams({
    country: `eq.${countryCode}`,
    status: "neq.closed",
    order: "priority.desc,posted_at.desc",
  });
  const res = await supabaseFetch(`jobs?${query}`);
  if (!res.ok) return [];
  const rows: Job[] = await res.json();
  return rows.map((job) => ({ ...job, industry: job.industry }));
}

// 業種別件数を取得
export async function getIndustryCounts(
  countryCode: string,
): Promise<Record<string, number>> {
  const query = new URLSearchParams({
    country: `eq.${countryCode}`,
    status: "neq.closed",
    select: "industry",
  });
  const res = await supabaseFetch(`jobs?${query}`);
  const counts: Record<string, number> = {};
  if (!res.ok) return counts;
  const rows: { industry: string }[] = await res.json();
  for (const row of rows) {
    counts[row.industry] = (counts[row.industry] ?? 0) + 1;
  }
  return counts;
}

// 業種定義を取得
export function getIndustry(slug: string): IndustryDef | undefined {
  return JOB_INDUSTRIES.find((i) => i.slug === slug);
}

// 給与表示文字列を生成
export function formatSalary(job: Job): string {
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
