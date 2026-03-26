import fs from "fs";
import path from "path";

// カテゴリ定義
export type CategoryDef = {
  slug: string;
  name: string;
  icon: string; // lucide-react アイコン名
  description: string;
};

export const categories: CategoryDef[] = [
  {
    slug: "restaurant",
    name: "レストラン・日本食",
    icon: "UtensilsCrossed",
    description: "日本食レストラン、居酒屋、ラーメン店など",
  },
  {
    slug: "clinic",
    name: "クリニック・病院",
    icon: "Stethoscope",
    description: "日本語対応の病院、クリニック、歯科",
  },
  {
    slug: "beauty",
    name: "美容室・理容室",
    icon: "Scissors",
    description: "日本人スタイリスト在籍の美容室・理容室",
  },
  {
    slug: "real-estate",
    name: "不動産",
    icon: "Building2",
    description: "日系不動産エージェント、賃貸仲介",
  },
  {
    slug: "grocery",
    name: "日本食スーパー・食材店",
    icon: "ShoppingCart",
    description: "日本の食品・調味料が手に入るスーパー・食材店",
  },
  {
    slug: "education",
    name: "学習塾・幼稚園・インター校",
    icon: "GraduationCap",
    description: "日本語対応の学習塾、幼稚園、インターナショナルスクール",
  },
];

export function getCategory(slug: string): CategoryDef | undefined {
  return categories.find((c) => c.slug === slug);
}

// スポットデータ
export type Spot = {
  slug: string;
  name: string;
  name_ja?: string;
  area: string;
  address: string;
  phone?: string;
  website?: string;
  description: string;
  tags: string[];
  hours?: string;
  last_verified: string;
};

const directoryDir = path.join(process.cwd(), "content", "directory");

export function getSpotsByCategory(
  countryCode: string,
  categorySlug: string,
): Spot[] {
  const filePath = path.join(
    directoryDir,
    countryCode,
    `${categorySlug}.json`,
  );
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Spot[];
}

export function getSpot(
  countryCode: string,
  categorySlug: string,
  spotSlug: string,
): Spot | undefined {
  const spots = getSpotsByCategory(countryCode, categorySlug);
  return spots.find((s) => s.slug === spotSlug);
}

// 国ごとの全カテゴリのスポット数を取得
export function getCategoryCounts(
  countryCode: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    const spots = getSpotsByCategory(countryCode, cat.slug);
    counts[cat.slug] = spots.length;
  }
  return counts;
}

// 国ごとの全スポットを取得（sitemap用）
export function getAllSpots(
  countryCode: string,
): Array<Spot & { category: string }> {
  return categories.flatMap((cat) =>
    getSpotsByCategory(countryCode, cat.slug).map((spot) => ({
      ...spot,
      category: cat.slug,
    })),
  );
}
