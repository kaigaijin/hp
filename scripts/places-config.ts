// Google Places API 設定・共通定義

export const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

if (!GOOGLE_API_KEY) {
  console.error("環境変数 GOOGLE_PLACES_API_KEY を設定してください");
  process.exit(1);
}

// 国別の検索設定（中心座標 + 主要都市）
export const COUNTRY_SEARCH_CONFIG: Record<
  string,
  { cities: { name: string; lat: number; lng: number; radius: number }[] }
> = {
  sg: {
    cities: [
      { name: "Singapore", lat: 1.3521, lng: 103.8198, radius: 25000 },
    ],
  },
  th: {
    cities: [
      { name: "Bangkok", lat: 13.7563, lng: 100.5018, radius: 30000 },
      { name: "Chiang Mai", lat: 18.7883, lng: 98.9853, radius: 15000 },
      { name: "Phuket", lat: 7.8804, lng: 98.3923, radius: 15000 },
      { name: "Pattaya", lat: 12.9236, lng: 100.8825, radius: 10000 },
      { name: "Sriracha", lat: 13.1674, lng: 100.9268, radius: 10000 },
    ],
  },
  my: {
    cities: [
      {
        name: "Kuala Lumpur",
        lat: 3.139,
        lng: 101.6869,
        radius: 25000,
      },
      { name: "Penang", lat: 5.4164, lng: 100.3327, radius: 15000 },
      { name: "Johor Bahru", lat: 1.4927, lng: 103.7414, radius: 15000 },
      { name: "Kota Kinabalu", lat: 5.9804, lng: 116.0735, radius: 10000 },
    ],
  },
  kr: {
    cities: [
      { name: "Seoul", lat: 37.5665, lng: 126.978, radius: 25000 },
      { name: "Busan", lat: 35.1796, lng: 129.0756, radius: 15000 },
      { name: "Incheon", lat: 37.4563, lng: 126.7052, radius: 15000 },
    ],
  },
  tw: {
    cities: [
      { name: "Taipei", lat: 25.033, lng: 121.5654, radius: 20000 },
      { name: "Taichung", lat: 24.1477, lng: 120.6736, radius: 15000 },
      { name: "Kaohsiung", lat: 22.6273, lng: 120.3014, radius: 15000 },
    ],
  },
  hk: {
    cities: [
      { name: "Hong Kong", lat: 22.3193, lng: 114.1694, radius: 20000 },
    ],
  },
  au: {
    cities: [
      { name: "Sydney", lat: -33.8688, lng: 151.2093, radius: 25000 },
      { name: "Melbourne", lat: -37.8136, lng: 144.9631, radius: 25000 },
      { name: "Brisbane", lat: -27.4698, lng: 153.0251, radius: 15000 },
      { name: "Perth", lat: -31.9505, lng: 115.8605, radius: 15000 },
      { name: "Gold Coast", lat: -28.0167, lng: 153.4, radius: 10000 },
    ],
  },
  ae: {
    cities: [
      { name: "Dubai", lat: 25.2048, lng: 55.2708, radius: 25000 },
      { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773, radius: 20000 },
    ],
  },
  vn: {
    cities: [
      {
        name: "Ho Chi Minh City",
        lat: 10.8231,
        lng: 106.6297,
        radius: 20000,
      },
      { name: "Hanoi", lat: 21.0278, lng: 105.8342, radius: 20000 },
      { name: "Da Nang", lat: 16.0544, lng: 108.2022, radius: 10000 },
    ],
  },
  gb: {
    cities: [
      { name: "London", lat: 51.5074, lng: -0.1278, radius: 30000 },
      { name: "Manchester", lat: 53.4808, lng: -2.2426, radius: 15000 },
      { name: "Edinburgh", lat: 55.9533, lng: -3.1883, radius: 10000 },
      { name: "Leeds", lat: 53.8008, lng: -1.5491, radius: 10000 },
      { name: "Birmingham", lat: 52.4862, lng: -1.8904, radius: 15000 },
    ],
  },
  de: {
    cities: [
      { name: "Düsseldorf", lat: 51.2277, lng: 6.7735, radius: 15000 },
      { name: "Berlin", lat: 52.52, lng: 13.405, radius: 25000 },
      { name: "Munich", lat: 48.1351, lng: 11.582, radius: 20000 },
      { name: "Frankfurt", lat: 50.1109, lng: 8.6821, radius: 15000 },
      { name: "Hamburg", lat: 53.5511, lng: 9.9937, radius: 15000 },
    ],
  },
  id: {
    cities: [
      { name: "Jakarta", lat: -6.2088, lng: 106.8456, radius: 25000 },
      { name: "Bali", lat: -8.3405, lng: 115.092, radius: 20000 },
      { name: "Surabaya", lat: -7.2575, lng: 112.7521, radius: 15000 },
      { name: "Bandung", lat: -6.9175, lng: 107.6191, radius: 10000 },
    ],
  },
};

// カテゴリ → Google Places APIのtype/キーワードマッピング
// 方針: 日本人向け施設のみをターゲット
// - 飲食系: 日本食・日本式の店舗のみ
// - サービス系（不動産・美容・医療等）: 日本語対応・日系のみ
// - 汎用カテゴリ（coworking・fitness等）: Places APIでは取得しない（日本人向けの絞り込みが困難）
export const CATEGORY_SEARCH_QUERIES: Record<
  string,
  { types: string[]; keywords: string[] }
> = {
  // === 飲食（日本食・日本式のみ） ===
  restaurant: {
    types: ["japanese_restaurant"],
    keywords: ["Japanese restaurant", "日本食レストラン", "日本料理"],
  },
  cafe: {
    types: ["cafe"],
    keywords: ["Japanese cafe", "Japanese bakery", "日本式カフェ"],
  },
  "izakaya-bar": {
    types: ["bar", "restaurant"],
    keywords: ["izakaya", "居酒屋", "Japanese bar", "焼鳥"],
  },
  grocery: {
    types: ["grocery_store", "supermarket"],
    keywords: ["Japanese grocery", "Japanese supermarket", "日本食材", "日本食品"],
  },

  // === 医療（日本語対応のみ） ===
  clinic: {
    types: ["doctor", "hospital"],
    keywords: ["Japanese clinic", "Japanese speaking doctor", "日本語対応 クリニック", "日系クリニック"],
  },
  dental: {
    types: ["dentist"],
    keywords: ["Japanese dentist", "Japanese speaking dentist", "日本語対応 歯科", "日系歯科"],
  },

  // === 美容（日系のみ） ===
  beauty: {
    types: ["hair_salon", "beauty_salon"],
    keywords: ["Japanese hair salon", "日系美容室", "日本人美容師"],
  },
  "nail-esthetic": {
    types: ["beauty_salon", "spa"],
    keywords: ["Japanese nail salon", "Japanese esthetic", "日系ネイル", "日系エステ"],
  },

  // === 住まい・暮らし（日系のみ） ===
  "real-estate": {
    types: ["real_estate_agency"],
    keywords: ["Japanese real estate", "日系不動産", "日本人向け 不動産"],
  },
  moving: {
    types: ["moving_company"],
    keywords: ["Japanese moving company", "日系引越し", "日通"],
  },

  // === 教育（日本人向けのみ） ===
  education: {
    types: ["school"],
    keywords: [
      "Japanese school",
      "日本人学校",
      "日本語補習校",
      "学習塾 日本人",
      "Japanese kindergarten",
    ],
  },

  // === 士業・専門サービス（日系のみ） ===
  accounting: {
    types: ["accounting"],
    keywords: ["Japanese accounting firm", "日系会計事務所", "日本語対応 会計"],
  },
  legal: {
    types: ["lawyer"],
    keywords: ["Japanese law firm", "Japanese lawyer", "日系法律事務所"],
  },
  insurance: {
    types: ["insurance_agency"],
    keywords: ["Japanese insurance", "日系保険"],
  },
  travel: {
    types: ["travel_agency"],
    keywords: ["Japanese travel agency", "日系旅行会社"],
  },
};

// slug生成（名前から）
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[''"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Places API (New) のレスポンス型
export interface PlaceResult {
  id: string; // place_id
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  types?: string[];
  location?: { latitude: number; longitude: number };
  primaryType?: string;
}

export interface SpotEntry {
  slug: string;
  name: string;
  name_ja: string | null;
  area: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  description: string;
  tags: string[];
  hours: string | null;
  last_verified: string;
  status: "unverified" | "verified" | "reported_closed";
  source: string;
  place_id: string;
  priority: number;
}
