import fs from "fs";
import path from "path";

// カテゴリ定義
export type CategoryDef = {
  slug: string;
  name: string;
  icon: string; // lucide-react アイコン名
  description: string;
};

// カテゴリグループ定義
export type CategoryGroup = {
  slug: string;
  name: string;
  icon: string;
  categories: string[]; // 子カテゴリのslug配列
};

export const categoryGroups: CategoryGroup[] = [
  {
    slug: "gourmet",
    name: "グルメ",
    icon: "UtensilsCrossed",
    categories: ["restaurant", "cafe", "grocery"],
  },
  {
    slug: "medical",
    name: "医療",
    icon: "Stethoscope",
    categories: ["clinic", "dental", "pharmacy"],
  },
  {
    slug: "beauty-health",
    name: "美容・健康",
    icon: "Scissors",
    categories: ["beauty", "nail-esthetic", "fitness"],
  },
  {
    slug: "housing",
    name: "住まい・暮らし",
    icon: "Building2",
    categories: ["real-estate", "moving", "cleaning", "repair"],
  },
  {
    slug: "education",
    name: "教育",
    icon: "GraduationCap",
    categories: ["education"],
  },
  {
    slug: "professional",
    name: "士業・専門サービス",
    icon: "Briefcase",
    categories: ["accounting", "legal", "insurance", "bank"],
  },
  {
    slug: "lifestyle",
    name: "その他サービス",
    icon: "Compass",
    categories: ["travel", "coworking", "pet", "car"],
  },
];

export const categories: CategoryDef[] = [
  {
    slug: "restaurant",
    name: "日本食レストラン・居酒屋",
    icon: "UtensilsCrossed",
    description: "日本食レストラン、居酒屋、ラーメン店、バーなど",
  },
  {
    slug: "cafe",
    name: "カフェ・ベーカリー",
    icon: "Coffee",
    description: "日系カフェ、パン屋、スイーツ店",
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
    slug: "bank",
    name: "銀行",
    icon: "Landmark",
    description: "日本語対応の銀行、外国人口座開設対応の銀行",
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

export function getCategoryGroup(slug: string): CategoryGroup | undefined {
  return categoryGroups.find((g) => g.slug === slug);
}

// 確認ステータス
export type placeStatus = "unverified" | "verified" | "reported_closed";

// 情報ソース
export type placeSource = "website" | "google_maps" | "sns" | "user_report";

// メニュー項目
export type MenuItem = {
  name: string;
  price?: string; // 表示用価格（例: "SGD 15"）
  description?: string;
  category?: string; // メニューカテゴリ（例: "ランチ", "ドリンク"）
};

// スポットデータ
export type place = {
  slug: string;
  name: string;
  name_ja?: string;
  area: string;
  address: string;
  phone?: string | null;
  website?: string | null;
  description: string;
  detail?: string | null; // 詳細説明（300-500文字。ページ内表示用）
  tags: string[];
  hours?: string | null;
  status?: placeStatus;
  source?: placeSource;
  last_verified?: string;

  // Google Places連携
  place_id?: string | null;
  lat?: number | null;
  lng?: number | null;

  // 掲載優先度（有料掲載で上位表示）
  priority?: number; // 0=通常, 1=有料掲載

  // レビュー待ちフラグ（trueのスポットはサイト非表示）
  needs_review?: boolean;

  // 食べログ風拡張フィールド（すべてオプショナル）
  menu?: MenuItem[]; // メニュー
  price_range?: string; // 価格帯（例: "¥1,000〜¥3,000"）
  payment?: string[]; // 支払い方法（例: ["現金", "VISA", "Mastercard", "PayPay"]）
  seats?: number | null; // 席数
  parking?: string | null; // 駐車場情報
  reservation?: string | null; // 予約情報（例: "電話予約可", "予約不要"）
  smoking?: string | null; // 喫煙情報
  languages?: string[]; // 対応言語
};

// ステータスの表示情報
export const statusConfig: Record<
  placeStatus,
  { label: string; note: string; color: string }
> = {
  unverified: {
    label: "未確認",
    note: "Web上の情報です。最新情報は公式サイトをご確認ください",
    color: "amber",
  },
  verified: {
    label: "確認済み",
    note: "",
    color: "green",
  },
  reported_closed: {
    label: "閉店の可能性あり",
    note: "訪問前に公式サイトをご確認ください",
    color: "red",
  },
};

const directoryDir = path.join(process.cwd(), "content", "directory");

export function getplacesByCategory(
  countryCode: string,
  categorySlug: string,
): place[] {
  const filePath = path.join(
    directoryDir,
    countryCode,
    `${categorySlug}.json`,
  );
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  const places = JSON.parse(raw) as place[];
  return places.filter((s) => !s.needs_review);
}

export function getplace(
  countryCode: string,
  categorySlug: string,
  placeSlug: string,
): place | undefined {
  const places = getplacesByCategory(countryCode, categorySlug);
  return places.find((s) => s.slug === placeSlug);
}

// 国ごとの全カテゴリのスポット数を取得
export function getCategoryCounts(
  countryCode: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    const places = getplacesByCategory(countryCode, cat.slug);
    counts[cat.slug] = places.length;
  }
  return counts;
}

// 国ごとのグループ別スポット数を取得
export function getGroupCounts(countryCode: string): Record<string, number> {
  const catCounts = getCategoryCounts(countryCode);
  const groupCounts: Record<string, number> = {};
  for (const group of categoryGroups) {
    groupCounts[group.slug] = group.categories.reduce(
      (sum, cat) => sum + (catCounts[cat] ?? 0),
      0
    );
  }
  return groupCounts;
}

// needs_review スポットを全国・全カテゴリから取得（/review ページ用）
export function getNeedsReviewplaces(): Array<
  place & { country: string; category: string; review_note?: string; japanese_staff?: boolean | null }
> {
  const results: Array<place & { country: string; category: string; review_note?: string; japanese_staff?: boolean | null }> = [];

  if (!fs.existsSync(directoryDir)) return results;

  const countries = fs.readdirSync(directoryDir).filter((d: string) =>
    fs.statSync(path.join(directoryDir, d)).isDirectory()
  );

  for (const country of countries) {
    const countryDir = path.join(directoryDir, country);
    const files = fs.readdirSync(countryDir).filter((f: string) => f.endsWith(".json"));
    for (const file of files) {
      const category = file.replace(".json", "");
      const raw = fs.readFileSync(path.join(countryDir, file), "utf-8");
      const places = JSON.parse(raw) as Array<place & { review_note?: string; japanese_staff?: boolean | null }>;
      for (const place of places) {
        if (place.needs_review && place.status !== "reported_closed") {
          results.push({ ...place, country, category });
        }
      }
    }
  }

  return results;
}

// 国ごとの全スポットを取得（sitemap用）
export function getAllplaces(
  countryCode: string,
): Array<place & { category: string }> {
  return categories.flatMap((cat) =>
    getplacesByCategory(countryCode, cat.slug).map((place) => ({
      ...place,
      category: cat.slug,
    })),
  );
}

// エリアスラッグ変換
export function toAreaSlug(area: string): string {
  return area
    .toLowerCase()
    .replace(/[\/&]/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// エリア別のスポット件数を取得
export function getAreaCounts(
  countryCode: string,
): Record<string, number> {
  const allplaces = getAllplaces(countryCode);
  const counts: Record<string, number> = {};
  for (const place of allplaces) {
    const area = place.area;
    counts[area] = (counts[area] ?? 0) + 1;
  }
  return counts;
}

// 全エリア名一覧を件数順で取得
export function getAllAreas(
  countryCode: string,
): Array<{ name: string; slug: string; count: number }> {
  const counts = getAreaCounts(countryCode);
  return Object.entries(counts)
    .map(([name, count]) => ({ name, slug: toAreaSlug(name), count }))
    .sort((a, b) => b.count - a.count);
}

// エリアスラッグから元のエリア名を逆引き
export function getAreaNameBySlug(
  countryCode: string,
  areaSlug: string,
): string | undefined {
  const areas = getAllAreas(countryCode);
  return areas.find((a) => a.slug === areaSlug)?.name;
}

// エリア別の全スポットを取得
export function getplacesByArea(
  countryCode: string,
  areaName: string,
): Array<place & { category: string }> {
  return getAllplaces(countryCode).filter((s) => s.area === areaName);
}

// 座標付きスポットのみ取得（地図表示用）
export function getGeoplaces(
  countryCode: string,
): Array<place & { category: string; lat: number; lng: number }> {
  return getAllplaces(countryCode).filter(
    (s): s is place & { category: string; lat: number; lng: number } =>
      typeof s.lat === "number" && typeof s.lng === "number",
  );
}
