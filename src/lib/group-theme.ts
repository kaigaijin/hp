import { categoryGroups } from "./directory";

// カテゴリグループごとのテーマカラー定義
// Tailwindはクラス名を静的に解析するため、全クラス名を文字列リテラルで記述する必要がある
export type GroupTheme = {
  // アイコン背景（ニュートラル状態）
  iconBg: string;
  // アイコン背景（ホバー/アクティブ）
  iconBgActive: string;
  // アイコン文字色
  iconText: string;
  // テキスト（リンク・アクセントカラー）
  accent: string;
  // ホバー時のテキスト
  accentHover: string;
  // バッジ背景
  badgeBg: string;
  // バッジテキスト
  badgeText: string;
  // ホバー時のボーダー
  hoverBorder: string;
  // フィルター（アクティブ）テキスト+背景
  filterActive: string;
  // 番号の色
  numberText: string;
  // CTAボタン
  ctaBg: string;
  ctaHover: string;
  // ヘッダーの上部アクセントライン
  topBorder: string;
};

const themes: Record<string, GroupTheme> = {
  gourmet: {
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconBgActive: "group-hover:bg-orange-50 dark:group-hover:bg-orange-900/30",
    iconText: "text-orange-600 dark:text-orange-400",
    accent: "text-orange-600 dark:text-orange-400",
    accentHover: "group-hover:text-orange-700 dark:group-hover:text-orange-400",
    badgeBg: "bg-orange-50 dark:bg-orange-900/30",
    badgeText: "text-orange-600 dark:text-orange-400",
    hoverBorder: "hover:border-orange-400 dark:hover:border-orange-500",
    filterActive: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30",
    numberText: "text-orange-600 dark:text-orange-400",
    ctaBg: "bg-orange-600",
    ctaHover: "hover:bg-orange-700",
    topBorder: "border-t-orange-500",
  },
  medical: {
    iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconBgActive: "group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30",
    iconText: "text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-600 dark:text-emerald-400",
    accentHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-900/30",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
    filterActive: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
    numberText: "text-emerald-600 dark:text-emerald-400",
    ctaBg: "bg-emerald-600",
    ctaHover: "hover:bg-emerald-700",
    topBorder: "border-t-emerald-500",
  },
  "beauty-health": {
    iconBg: "bg-rose-50 dark:bg-rose-900/20",
    iconBgActive: "group-hover:bg-rose-50 dark:group-hover:bg-rose-900/30",
    iconText: "text-rose-600 dark:text-rose-400",
    accent: "text-rose-600 dark:text-rose-400",
    accentHover: "group-hover:text-rose-700 dark:group-hover:text-rose-400",
    badgeBg: "bg-rose-50 dark:bg-rose-900/30",
    badgeText: "text-rose-600 dark:text-rose-400",
    hoverBorder: "hover:border-rose-400 dark:hover:border-rose-500",
    filterActive: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30",
    numberText: "text-rose-600 dark:text-rose-400",
    ctaBg: "bg-rose-600",
    ctaHover: "hover:bg-rose-700",
    topBorder: "border-t-rose-500",
  },
  housing: {
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconBgActive: "group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30",
    iconText: "text-amber-600 dark:text-amber-400",
    accent: "text-amber-600 dark:text-amber-400",
    accentHover: "group-hover:text-amber-700 dark:group-hover:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-900/30",
    badgeText: "text-amber-600 dark:text-amber-400",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500",
    filterActive: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
    numberText: "text-amber-600 dark:text-amber-400",
    ctaBg: "bg-amber-600",
    ctaHover: "hover:bg-amber-700",
    topBorder: "border-t-amber-500",
  },
  education: {
    iconBg: "bg-violet-50 dark:bg-violet-900/20",
    iconBgActive: "group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30",
    iconText: "text-violet-600 dark:text-violet-400",
    accent: "text-violet-600 dark:text-violet-400",
    accentHover: "group-hover:text-violet-700 dark:group-hover:text-violet-400",
    badgeBg: "bg-violet-50 dark:bg-violet-900/30",
    badgeText: "text-violet-600 dark:text-violet-400",
    hoverBorder: "hover:border-violet-400 dark:hover:border-violet-500",
    filterActive: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30",
    numberText: "text-violet-600 dark:text-violet-400",
    ctaBg: "bg-violet-600",
    ctaHover: "hover:bg-violet-700",
    topBorder: "border-t-violet-500",
  },
  professional: {
    iconBg: "bg-slate-100 dark:bg-slate-800/50",
    iconBgActive: "group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60",
    iconText: "text-slate-600 dark:text-slate-400",
    accent: "text-slate-600 dark:text-slate-400",
    accentHover: "group-hover:text-slate-700 dark:group-hover:text-slate-400",
    badgeBg: "bg-slate-100 dark:bg-slate-800/40",
    badgeText: "text-slate-600 dark:text-slate-400",
    hoverBorder: "hover:border-slate-400 dark:hover:border-slate-500",
    filterActive: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40",
    numberText: "text-slate-600 dark:text-slate-400",
    ctaBg: "bg-slate-600",
    ctaHover: "hover:bg-slate-700",
    topBorder: "border-t-slate-500",
  },
  lifestyle: {
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    iconBgActive: "group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30",
    iconText: "text-teal-600 dark:text-teal-400",
    accent: "text-teal-600 dark:text-teal-400",
    accentHover: "group-hover:text-teal-700 dark:group-hover:text-teal-400",
    badgeBg: "bg-teal-50 dark:bg-teal-900/30",
    badgeText: "text-teal-600 dark:text-teal-400",
    hoverBorder: "hover:border-teal-400 dark:hover:border-teal-500",
    filterActive: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30",
    numberText: "text-teal-600 dark:text-teal-400",
    ctaBg: "bg-teal-600",
    ctaHover: "hover:bg-teal-700",
    topBorder: "border-t-teal-500",
  },
};

// デフォルト（ocean、フォールバック用）
const defaultTheme: GroupTheme = {
  iconBg: "bg-ocean-50 dark:bg-ocean-900/20",
  iconBgActive: "group-hover:bg-ocean-50 dark:group-hover:bg-ocean-900/30",
  iconText: "text-ocean-600 dark:text-ocean-400",
  accent: "text-ocean-600 dark:text-ocean-400",
  accentHover: "group-hover:text-ocean-700 dark:group-hover:text-ocean-400",
  badgeBg: "bg-ocean-50 dark:bg-ocean-900/30",
  badgeText: "text-ocean-600 dark:text-ocean-400",
  hoverBorder: "hover:border-ocean-400 dark:hover:border-ocean-500",
  filterActive: "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30",
  numberText: "text-ocean-600 dark:text-ocean-400",
  ctaBg: "bg-ocean-600",
  ctaHover: "hover:bg-ocean-700",
  topBorder: "border-t-ocean-500",
};

// グループslugからテーマを取得
export function getGroupTheme(groupSlug: string): GroupTheme {
  return themes[groupSlug] ?? defaultTheme;
}

// カテゴリslugからテーマを取得（親グループのテーマを返す）
export function getCategoryTheme(categorySlug: string): GroupTheme {
  const group = categoryGroups.find((g) =>
    g.categories.includes(categorySlug),
  );
  if (!group) return defaultTheme;
  return themes[group.slug] ?? defaultTheme;
}
