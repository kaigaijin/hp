import { categoryGroups } from "./directory";

// カテゴリグループごとのテーマカラー定義
// 全グループを warm/stone 統一テーマに統一（KAIジョブと同じデザイン言語）
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
  // カラーアクセントバー（bg-色クラス）
  accentBar: string;
  // ヒーローグラデーション（from-色クラス）
  heroGradientFrom: string;
};

// 全グループ共通の warm/stone 統一テーマ
const unifiedTheme: GroupTheme = {
  iconBg: "bg-warm-50 dark:bg-warm-900/20",
  iconBgActive: "group-hover:bg-warm-100 dark:group-hover:bg-warm-900/30",
  iconText: "text-warm-600 dark:text-warm-400",
  accent: "text-warm-600 dark:text-warm-400",
  accentHover: "group-hover:text-warm-700 dark:group-hover:text-warm-400",
  badgeBg: "bg-warm-50 dark:bg-warm-900/30",
  badgeText: "text-warm-600 dark:text-warm-400",
  hoverBorder: "hover:border-warm-300 dark:hover:border-warm-600",
  filterActive: "text-warm-700 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30",
  numberText: "text-warm-600 dark:text-warm-400",
  ctaBg: "bg-warm-600",
  ctaHover: "hover:bg-warm-700",
  topBorder: "border-t-warm-500",
  accentBar: "bg-warm-400",
  heroGradientFrom: "from-stone-950",
};

const themes: Record<string, GroupTheme> = {
  gourmet: unifiedTheme,
  medical: unifiedTheme,
  "beauty-health": unifiedTheme,
  housing: unifiedTheme,
  education: unifiedTheme,
  professional: unifiedTheme,
  lifestyle: unifiedTheme,
};

// デフォルト（フォールバック用）
const defaultTheme: GroupTheme = unifiedTheme;

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
