export type Region = "southeast-asia" | "east-asia" | "oceania" | "middle-east" | "europe";

export const regionLabels: Record<Region, string> = {
  "southeast-asia": "東南アジア",
  "east-asia": "東アジア",
  "oceania": "オセアニア",
  "middle-east": "中東",
  "europe": "ヨーロッパ",
};

export const regionOrder: Region[] = [
  "southeast-asia",
  "east-asia",
  "oceania",
  "middle-east",
  "europe",
];

export type Country = {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  tagline: string;
  population: string; // 在住日本人数
  phase: number;
  region: Region;
  topics: string[];
};

export const countries: Country[] = [
  {
    code: "sg",
    name: "シンガポール",
    nameEn: "Singapore",
    flag: "🇸🇬",
    tagline: "アジアのハブで暮らす",
    population: "約3.1万人",
    phase: 1,
    region: "southeast-asia",
    topics: ["ビザ・EP", "住居選び", "税金・CPF", "医療・保険", "教育・インター校"],
  },
  {
    code: "th",
    name: "タイ",
    nameEn: "Thailand",
    flag: "🇹🇭",
    tagline: "微笑みの国での日常",
    population: "約7.2万人",
    phase: 1,
    region: "southeast-asia",
    topics: ["リタイアメントビザ", "バンコク生活", "医療ツーリズム", "不動産", "タイ語"],
  },
  {
    code: "my",
    name: "マレーシア",
    nameEn: "Malaysia",
    flag: "🇲🇾",
    tagline: "多文化が交差する暮らし",
    population: "約2.1万人",
    phase: 1,
    region: "southeast-asia",
    topics: ["MM2Hビザ", "KL生活", "教育移住", "不動産投資", "医療"],
  },
  {
    code: "kr",
    name: "韓国",
    nameEn: "South Korea",
    flag: "🇰🇷",
    tagline: "いちばん近い海外生活",
    population: "約4.3万人",
    phase: 2,
    region: "east-asia",
    topics: ["就労ビザ・D-7/E-7", "ソウル生活", "住居・チョンセ", "医療・国民健康保険", "韓国語"],
  },
  {
    code: "tw",
    name: "台湾",
    nameEn: "Taiwan",
    flag: "🇹🇼",
    tagline: "親日の島でのんびり暮らす",
    population: "約2.1万人",
    phase: 2,
    region: "east-asia",
    topics: ["就労ビザ・居留証", "台北生活", "住居選び", "全民健康保険", "中国語"],
  },
  {
    code: "hk",
    name: "香港",
    nameEn: "Hong Kong",
    flag: "🇭🇰",
    tagline: "アジア金融の中心で働く",
    population: "約2.3万人",
    phase: 2,
    region: "east-asia",
    topics: ["就労ビザ", "住居・家賃事情", "税制・MPF", "医療・保険", "広東語・英語"],
  },
  {
    code: "au",
    name: "オーストラリア",
    nameEn: "Australia",
    flag: "🇦🇺",
    tagline: "南半球のゆとりある生活",
    population: "約9.9万人",
    phase: 3,
    region: "oceania",
    topics: ["永住権・PR", "ワーホリ後の定住", "不動産", "年金・スーパー", "医療制度"],
  },
  {
    code: "ae",
    name: "UAE（ドバイ）",
    nameEn: "UAE (Dubai)",
    flag: "🇦🇪",
    tagline: "砂漠の未来都市で挑む",
    population: "約0.5万人",
    phase: 3,
    region: "middle-east",
    topics: ["ゴールデンビザ", "法人設立", "税制メリット", "生活コスト", "イスラム文化"],
  },
  {
    code: "vn",
    name: "ベトナム",
    nameEn: "Vietnam",
    flag: "🇻🇳",
    tagline: "活気あふれる成長市場",
    population: "約1.9万人",
    phase: 3,
    region: "southeast-asia",
    topics: ["労働許可証", "ハノイvsホーチミン", "駐在生活", "食文化", "医療事情"],
  },
  {
    code: "gb",
    name: "イギリス",
    nameEn: "United Kingdom",
    flag: "🇬🇧",
    tagline: "伝統と多様性が共存する街",
    population: "約6.2万人",
    phase: 3,
    region: "europe",
    topics: ["ビザ・BRP", "ロンドン生活", "NHS・医療", "住居・Council Tax", "教育"],
  },
  {
    code: "de",
    name: "ドイツ",
    nameEn: "Germany",
    flag: "🇩🇪",
    tagline: "欧州最大の日本人コミュニティ",
    population: "約4.5万人",
    phase: 3,
    region: "europe",
    topics: ["ビザ・滞在許可", "デュッセルドルフ", "医療保険", "住居・家賃", "ドイツ語"],
  },
  {
    code: "id",
    name: "インドネシア",
    nameEn: "Indonesia",
    flag: "🇮🇩",
    tagline: "多島国家でビジネスに挑む",
    population: "約1.5万人",
    phase: 3,
    region: "southeast-asia",
    topics: ["KITAS・就労ビザ", "ジャカルタ生活", "医療事情", "住居選び", "インドネシア語"],
  },
];

export function getCountry(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}
