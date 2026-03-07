export type Country = {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  tagline: string;
  population: string; // 在住日本人数
  phase: number;
  topics: string[];
};

export const countries: Country[] = [
  {
    code: "sg",
    name: "シンガポール",
    nameEn: "Singapore",
    flag: "🇸🇬",
    tagline: "アジアのハブで暮らす",
    population: "約3.5万人",
    phase: 1,
    topics: ["ビザ・EP", "住居選び", "税金・CPF", "医療・保険", "教育・インター校"],
  },
  {
    code: "th",
    name: "タイ",
    nameEn: "Thailand",
    flag: "🇹🇭",
    tagline: "微笑みの国での日常",
    population: "約8.2万人",
    phase: 1,
    topics: ["リタイアメントビザ", "バンコク生活", "医療ツーリズム", "不動産", "タイ語"],
  },
  {
    code: "ae",
    name: "UAE（ドバイ）",
    nameEn: "UAE (Dubai)",
    flag: "🇦🇪",
    tagline: "砂漠の未来都市で挑む",
    population: "約4,500人",
    phase: 1,
    topics: ["ゴールデンビザ", "法人設立", "税制メリット", "生活コスト", "イスラム文化"],
  },
  {
    code: "vn",
    name: "ベトナム",
    nameEn: "Vietnam",
    flag: "🇻🇳",
    tagline: "活気あふれる成長市場",
    population: "約2.3万人",
    phase: 2,
    topics: ["労働許可証", "ハノイvsホーチミン", "駐在生活", "食文化", "医療事情"],
  },
  {
    code: "my",
    name: "マレーシア",
    nameEn: "Malaysia",
    flag: "🇲🇾",
    tagline: "多文化が交差する暮らし",
    population: "約2.7万人",
    phase: 2,
    topics: ["MM2Hビザ", "KL生活", "教育移住", "不動産投資", "医療"],
  },
  {
    code: "au",
    name: "オーストラリア",
    nameEn: "Australia",
    flag: "🇦🇺",
    tagline: "南半球のゆとりある生活",
    population: "約10.3万人",
    phase: 2,
    topics: ["永住権・PR", "ワーホリ後の定住", "不動産", "年金・スーパー", "医療制度"],
  },
];

export function getCountry(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}
