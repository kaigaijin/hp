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
    population: "約3.1万人",
    phase: 1,
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
    topics: ["MM2Hビザ", "KL生活", "教育移住", "不動産投資", "医療"],
  },
  {
    code: "au",
    name: "オーストラリア",
    nameEn: "Australia",
    flag: "🇦🇺",
    tagline: "南半球のゆとりある生活",
    population: "約9.9万人",
    phase: 2,
    topics: ["永住権・PR", "ワーホリ後の定住", "不動産", "年金・スーパー", "医療制度"],
  },
  {
    code: "kr",
    name: "韓国",
    nameEn: "South Korea",
    flag: "🇰🇷",
    tagline: "いちばん近い海外生活",
    population: "約4.3万人",
    phase: 2,
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
    topics: ["就労ビザ", "住居・家賃事情", "税制・MPF", "医療・保険", "広東語・英語"],
  },
  {
    code: "ae",
    name: "UAE（ドバイ）",
    nameEn: "UAE (Dubai)",
    flag: "🇦🇪",
    tagline: "砂漠の未来都市で挑む",
    population: "約0.5万人",
    phase: 3,
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
    topics: ["労働許可証", "ハノイvsホーチミン", "駐在生活", "食文化", "医療事情"],
  },
];

export function getCountry(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}
