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
    slug: "cafe",
    name: "カフェ・ベーカリー",
    icon: "Coffee",
    description: "日系カフェ、パン屋、スイーツ店",
  },
  {
    slug: "izakaya-bar",
    name: "居酒屋・バー",
    icon: "Beer",
    description: "日本式居酒屋、日本酒バー、スナック",
  },
  {
    slug: "clinic",
    name: "クリニック・病院",
    icon: "Stethoscope",
    description: "日本語対応の病院、クリニック、総合病院",
  },
  {
    slug: "dental",
    name: "歯科",
    icon: "SmilePlus",
    description: "日本語対応の歯科医院・矯正歯科",
  },
  {
    slug: "pharmacy",
    name: "薬局・ドラッグストア",
    icon: "Pill",
    description: "日本の薬・サプリメントが手に入る薬局",
  },
  {
    slug: "beauty",
    name: "美容室・理容室",
    icon: "Scissors",
    description: "日本人スタイリスト在籍の美容室・理容室",
  },
  {
    slug: "nail-esthetic",
    name: "ネイル・エステ・スパ",
    icon: "Sparkles",
    description: "日系ネイルサロン、エステ、マッサージ・スパ",
  },
  {
    slug: "fitness",
    name: "ジム・フィットネス・ヨガ",
    icon: "Dumbbell",
    description: "日本人インストラクター在籍のジム・ヨガスタジオ",
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
  {
    slug: "accounting",
    name: "会計・税務",
    icon: "Calculator",
    description: "日本語対応の会計事務所、税理士、法人設立サポート",
  },
  {
    slug: "legal",
    name: "法律事務所",
    icon: "Scale",
    description: "日本語対応の弁護士、法律相談、ビザ手続き",
  },
  {
    slug: "insurance",
    name: "保険",
    icon: "Shield",
    description: "日本語対応の保険代理店、医療保険・生命保険",
  },
  {
    slug: "moving",
    name: "引越し・物流",
    icon: "Truck",
    description: "日系引越し業者、海外配送、倉庫・トランクルーム",
  },
  {
    slug: "travel",
    name: "旅行代理店",
    icon: "Plane",
    description: "日系旅行代理店、航空券手配、ツアー",
  },
  {
    slug: "coworking",
    name: "コワーキング・レンタルオフィス",
    icon: "Laptop",
    description: "コワーキングスペース、シェアオフィス、バーチャルオフィス",
  },
  {
    slug: "pet",
    name: "ペット関連",
    icon: "PawPrint",
    description: "ペットショップ、動物病院、トリミング、ペットホテル",
  },
  {
    slug: "car",
    name: "車・レンタカー",
    icon: "Car",
    description: "中古車販売、レンタカー、車検・整備",
  },
  {
    slug: "cleaning",
    name: "クリーニング・家事代行",
    icon: "SprayCan",
    description: "クリーニング店、メイドサービス、家事代行",
  },
  {
    slug: "repair",
    name: "修理・リフォーム",
    icon: "Wrench",
    description: "住宅修理、エアコン修理、リフォーム、内装工事",
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
