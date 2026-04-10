/**
 * validate-places.ts
 *
 * 全スポットデータを検証し、日本人向けでないスポットを検出する。
 *
 * 使い方:
 *   npx tsx scripts/validate-places.ts              # レポートのみ（変更なし）
 *   npx tsx scripts/validate-places.ts --remove      # suspectを自動削除
 *   npx tsx scripts/validate-places.ts --country my   # 特定国のみ
 *   npx tsx scripts/validate-places.ts --category dental  # 特定カテゴリのみ
 */

import fs from "fs";
import path from "path";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");

// --- 日本関連キーワード ---

// 店名に含まれていれば日本関連と判定するキーワード
const JAPANESE_NAME_KEYWORDS = [
  // 日本語文字（ひらがな・カタカナ・漢字）
  /[\u3040-\u309F]/, // ひらがな
  /[\u30A0-\u30FF]/, // カタカナ
  /[\u4E00-\u9FFF]/, // 漢字
  // 英語の日本関連キーワード
  /\bjapan/i,
  /\bnihon/i,
  /\bnippon/i,
  /\bsushi\b/i,
  /\bramen\b/i,
  /\bsashimi\b/i,
  /\btempura\b/i,
  /\byakiniku\b/i,
  /\bteppanyaki\b/i,
  /\btonkatsu\b/i,
  /\budon\b/i,
  /\bsoba\b/i,
  /\bmatcha\b/i,
  /\bwagyu\b/i,
  /\bsake\b/i,
  /\bizakaya\b/i,
  /\bdonburi\b/i,
  /\bbento\b/i,
  /\btakoyaki\b/i,
  /\bokonomiyaki\b/i,
  /\bgyoza\b/i,
  /\bkatsu\b/i,
  /\bunagi\b/i,
  /\byakitori\b/i,
  /\bshabu\b/i,
  /\bsukiyaki\b/i,
  /\bmiso\b/i,
  /\btofu\b/i,
  /\bedamame\b/i,
  /\bteriyaki\b/i,
  /\bwasabi\b/i,
  /\bonigiri\b/i,
  /\btsukemen\b/i,
  /\bkushikatsu\b/i,
  /\bkaraage\b/i,
  /\bomotenashi\b/i,
  /\bzen\b/i,
  /\bsamurai\b/i,
  /\bgeisha\b/i,
  // 日本の地名
  /\btokyo\b/i, /\bosaka\b/i, /\bkyoto\b/i, /\bhokkaido\b/i, /\bokinawa\b/i,
  /\bnagoya\b/i, /\bkobe\b/i, /\byokohama\b/i, /\bginza\b/i, /\bshinjuku\b/i,
  /\bshibuya\b/i, /\broppongi\b/i, /\basakusa\b/i, /\bakihabara\b/i,
  /\bomotesando\b/i, /\bebisu\b/i, /\bazabu\b/i, /\bdaikanyama\b/i,
  /\bnakameguro\b/i, /\bharajuku\b/i, /\bikebukuro\b/i, /\bueno\b/i,
  /\bchayamachi\b/i, /\bshirokane\b/i, /\bnihonbashi\b/i, /\bmeguro\b/i,
  /\baoyama\b/i, /\bhiroo\b/i, /\bnishi-azabu\b/i, /\bfukuoka\b/i,
  /\bsapporo\b/i, /\bhiroshima\b/i, /\bsendai\b/i, /\bnara\b/i,
  /\bkamakura\b/i, /\bnikko\b/i, /\bhakone\b/i, /\bkanazawa\b/i,
  // 日本の有名チェーン・ブランド
  /\bippudo\b/i, /\bmarukame\b/i, /\byoshinoya\b/i, /\bkomeda\b/i,
  /\bmatsuya\b/i, /\bsukiya\b/i, /\bmos burger\b/i, /\bcoco ichibanya\b/i,
  /\bgindaco\b/i, /\btsurutontan\b/i, /\bafuri\b/i, /\bichiran\b/i,
  /\bgenki\b/i, /\bsaizeriya\b/i, /\bmuji\b/i, /\buniqlo\b/i,
  /\bpeek-?a-?boo\b/i, /\btaya\b/i, /\bearth\b.*\bhair\b/i,
  // よくある日本人名（姓）
  /\btanaka\b/i, /\bsuzuki\b/i, /\bsato\b/i, /\bwatanabe\b/i,
  /\btakahashi\b/i, /\bito\b/i, /\byamamoto\b/i, /\bnakamura\b/i,
  /\bkobayashi\b/i, /\bkato\b/i, /\byoshida\b/i, /\byamada\b/i,
  /\bsasaki\b/i, /\byamazaki\b/i, /\binoue\b/i, /\bkimura\b/i,
  /\bhayashi\b/i, /\bshimizu\b/i, /\byamaguchi\b/i, /\bmatsumoto\b/i,
  /\bikeda\b/i, /\bhashimoto\b/i, /\babe\b/i, /\bmori\b/i,
  /\bishikawa\b/i, /\bmaeda\b/i, /\bogawa\b/i, /\bfujita\b/i,
  /\bokada\b/i, /\bgoto\b/i, /\bhasegawa\b/i, /\bmurakami\b/i,
  /\bkondo\b/i, /\bishii\b/i, /\bsakai\b/i, /\bkuroda\b/i,
  /\bfujii\b/i, /\bnishimura\b/i, /\bfukuda\b/i, /\bando\b/i,
  /\baoki\b/i, /\bokamoto\b/i, /\bmatsuda\b/i, /\bnakajima\b/i,
  /\bnakano\b/i, /\bharada\b/i, /\bono\b/i, /\btamura\b/i,
  /\bkomats[iu]\b/i, /\bkanzaki\b/i, /\bishina[bg]e\b/i,
  /\bkojima\b/i, /\btsukada\b/i, /\bnagai\b/i, /\bmiura\b/i,
  /\bichikawa\b/i, /\btakeda\b/i, /\bnakagawa\b/i,
  // 日本語ローマ字（店名によく使われる）
  /\bichiban\b/i, /\bsakura\b/i, /\bhinata\b/i, /\bhanabi\b/i,
  /\bfuji\b/i, /\bnozomi\b/i, /\bhibari\b/i, /\btsubaki\b/i,
  /\bmatsuri\b/i, /\bkoi\b/i, /\bmomiji\b/i, /\bsumire\b/i,
  /\byuki\b/i, /\bhana\b/i, /\btsubasa\b/i, /\bkaze\b/i,
  /\byume\b/i, /\bnami\b/i, /\bsora\b/i, /\bkenko\b/i,
  /\byukkuri\b/i, /\bnichijou\b/i, /\bhibi\b/i, /\bkokoro\b/i,
  /\bikigai\b/i, /\bwabi\b/i, /\bsabi\b/i, /\btsuki\b/i,
  /\bkawa\b/i, /\byama\b/i, /\bumi\b/i, /\bmizu\b/i,
  /\bkumo\b/i, /\bhoshi\b/i, /\bhikari\b/i, /\bkagami\b/i,
  /\bniji\b/i, /\bhotaru\b/i, /\btanuki\b/i, /\bdaruma\b/i,
  /\bmaneki\b/i, /\btori\b/i, /\btengu\b/i, /\bkappa\b/i,
  /\bkitsune\b/i, /\bdango\b/i, /\bmochi\b/i, /\bdaifuku\b/i,
  /\btaiyaki\b/i, /\bkinako\b/i, /\bazuki\b/i, /\byokan\b/i,
  /\btendon\b/i, /\bdondon\b/i, /\bkoffi\b/i,
  /\bhasuhana\b/i, /\bshuubi\b/i, /\blashicu\b/i, /\bfjino\b/i,
  /\breon\b/i, /\bkagu\b/i, /\bsozo\b/i, /\bmisso\b/i,
  // 追加チェーン・ブランド
  /\bsushiro\b/i, /\bkurazushi\b/i, /\bgyuukaku\b/i, /\bcocokara\b/i,
  /\btsuruha\b/i, /\bmatsuya\b/i, /\btenya\b/i, /\bkatsuya\b/i,
  /\bnakau\b/i, /\bototoya\b/i, /\bjoyfull?\b/i, /\bsaizeriya\b/i,
  // 追加ローマ字
  /\baozora\b/i, /\bhiroshi\b/i, /\bryoyu\b/i, /kaikei/i,
  /\bshokudo\b/i, /\bteishoku\b/i, /\bkaiseki\b/i, /\bkappo\b/i,
  /\bobanzai\b/i, /\byatai\b/i, /\bnoren\b/i, /\bchawan\b/i,
  /\byunomi\b/i, /\bchazuke\b/i, /\bnatto\b/i, /\bsenbei\b/i,
  /\bkashiwa\b/i, /\bnikujaga\b/i, /\bnabemono\b/i, /\bnabe\b/i,
  /\boden\b/i, /\bchirashi\b/i, /\bkaiten\b/i, /\bomakase\b/i,
  /\brobata\b/i, /\bsumibiyaki\b/i, /\bshiokara\b/i,
  /\btaiko\b/i, /\bshamisen\b/i, /\bkimono\b/i, /\byukata\b/i,
  /\bonsen\b/i, /\bsento\b/i, /\bfuro\b/i, /\bshiatsu\b/i,
  /\breiki\b/i, /\bbonsai\b/i, /\bikebana\b/i, /\borigami\b/i,
  /\bkendo\b/i, /\bjudo\b/i, /\bkarate\b/i, /\baikido\b/i,
  /\bbushido\b/i, /\bninja\b/i, /\bshogun\b/i,
  /\bchidori\b/i, /\btsuru\b/i, /\bbotan\b/i, /\bkiku\b/i,
  /\bfuudo\b/i, /\btakenoko\b/i, /\bshiitake\b/i,
  /\btakumi\b/i, /\bmeijin\b/i, /\bshokunin\b/i,
  // 店名サフィックスパターン
  /-ya$/i, /-en$/i, /-tei$/i, /-an$/i, /-do$/i, /-kan$/i, /-so$/i,
];

// descriptionに含まれていれば日本関連と判定
const JAPANESE_DESC_KEYWORDS = [
  /日本/,
  /和食/,
  /日系/,
  /日本語/,
  /日本人/,
  /日本式/,
  /japanese/i,
  /nihon/i,
  /和牛/,
  /寿司/,
  /ラーメン/,
  /居酒屋/,
  /焼肉/,
  /天ぷら/,
  /うどん/,
  /そば/,
  /抹茶/,
  /刺身/,
  /丼/,
  /弁当/,
];

// tagsに含まれていれば日本関連と判定
const JAPANESE_TAGS = [
  "日本食",
  "日本料理",
  "和食",
  "寿司",
  "ラーメン",
  "居酒屋",
  "焼肉",
  "日系",
  "日本語対応",
  "日本人経営",
  "日本式",
  "Japanese",
  "japanese",
];

// websiteドメインが .jp なら日本関連
const JP_DOMAIN_REGEX = /\.jp\b/i;

interface placeEntry {
  slug: string;
  name: string;
  name_ja: string | null;
  description: string;
  tags: string[];
  website: string | null;
  ai_reviewed?: boolean;
  source?: string;
  [key: string]: unknown;
}

interface ValidationResult {
  country: string;
  category: string;
  place: placeEntry;
  reasons: string[];
  score: number; // 0 = 完全にsuspect, 高いほど日本関連の可能性が高い
}

function checkJapaneseRelevance(place: placeEntry): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const positiveReasons: string[] = [];
  const negativeReasons: string[] = [];

  // 1. name_ja がある → 強いシグナル
  if (place.name_ja) {
    score += 3;
    positiveReasons.push("name_jaあり");
  } else {
    negativeReasons.push("name_jaなし");
  }

  // 2. 店名に日本関連キーワード（_や.をスペースに正規化して判定）
  const normalizedName = place.name.replace(/[_.,]/g, " ");
  const nameMatch = JAPANESE_NAME_KEYWORDS.some((kw) => kw.test(normalizedName) || kw.test(place.name));
  if (nameMatch) {
    score += 2;
    positiveReasons.push("店名に日本関連キーワード");
  }

  // 3. descriptionに日本関連キーワード
  const descMatch = JAPANESE_DESC_KEYWORDS.some((kw) =>
    kw.test(place.description)
  );
  if (descMatch) {
    score += 2;
    positiveReasons.push("説明文に日本関連キーワード");
  }

  // 4. tagsに日本関連タグ
  const tagMatch = place.tags.some((tag) =>
    JAPANESE_TAGS.some((jt) => tag.toLowerCase().includes(jt.toLowerCase()))
  );
  if (tagMatch) {
    score += 2;
    positiveReasons.push("日本関連タグあり");
  }

  // 5. websiteが.jpドメイン
  if (place.website && JP_DOMAIN_REGEX.test(place.website)) {
    score += 1;
    positiveReasons.push(".jpドメイン");
  }

  // 6. テンプレ説明文（AI reviewが甘かった証拠）
  const templatePatterns = [
    /にある歯科クリニック。一般歯科・予防歯科などの歯科治療を提供。$/,
    /にあるクリニック。一般診療・健康診断などの医療サービスを提供。$/,
    /にある美容サロン。カット・カラー・パーマなどのヘアサービスを提供。$/,
    /にあるネイルサロン。.*を提供。$/,
    /にある.*サロン。.*サービスを提供。$/,
  ];
  const isTemplate = templatePatterns.some((p) => p.test(place.description));
  if (isTemplate) {
    score -= 1;
    negativeReasons.push("テンプレ説明文（AI reviewが甘い）");
  }

  const reasons =
    score <= 1
      ? [...negativeReasons, ...positiveReasons]
      : [...positiveReasons];

  return { score, reasons };
}

function main() {
  const args = process.argv.slice(2);
  const removeMode = args.includes("--remove");
  const countryFilter = args.includes("--country")
    ? args[args.indexOf("--country") + 1]
    : null;
  const categoryFilter = args.includes("--category")
    ? args[args.indexOf("--category") + 1]
    : null;

  const countries = fs
    .readdirSync(DIRECTORY_PATH)
    .filter((f) => fs.statSync(path.join(DIRECTORY_PATH, f)).isDirectory())
    .filter((f) => !countryFilter || f === countryFilter)
    .sort();

  const allSuspects: ValidationResult[] = [];
  let totalplaces = 0;
  let totalSuspects = 0;
  let totalRemoved = 0;

  const countryStats: Record<
    string,
    { total: number; suspect: number; categories: Record<string, { total: number; suspect: number }> }
  > = {};

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_PATH, country);
    const files = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .filter((f) => !categoryFilter || f === `${categoryFilter}.json`)
      .sort();

    countryStats[country] = { total: 0, suspect: 0, categories: {} };

    for (const file of files) {
      const category = file.replace(".json", "");
      const filePath = path.join(countryDir, file);
      const places: placeEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      const suspects: ValidationResult[] = [];

      for (const place of places) {
        totalplaces++;
        countryStats[country].total++;

        const { score, reasons } = checkJapaneseRelevance(place);

        // score <= 1 をsuspectとする
        if (score <= 1) {
          totalSuspects++;
          countryStats[country].suspect++;
          suspects.push({ country, category, place, reasons, score });
          allSuspects.push({ country, category, place, reasons, score });
        }
      }

      countryStats[country].categories[category] = {
        total: places.length,
        suspect: suspects.length,
      };

      // --remove モードでsuspectを削除
      if (removeMode && suspects.length > 0) {
        const slugsToRemove = new Set(suspects.map((s) => s.place.slug));
        const filtered = places.filter((s) => !slugsToRemove.has(s.slug));
        totalRemoved += places.length - filtered.length;
        fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2) + "\n");
      }
    }
  }

  // --- レポート出力 ---

  console.log("\n=== スポット検証レポート ===\n");
  console.log(`総スポット数: ${totalplaces}`);
  console.log(`suspect数: ${totalSuspects} (${((totalSuspects / totalplaces) * 100).toFixed(1)}%)`);

  if (removeMode) {
    console.log(`\n🗑️  削除済み: ${totalRemoved} スポット`);
  }

  // 国別サマリー
  console.log("\n--- 国別サマリー ---\n");
  console.log(
    "| 国 | 総数 | suspect | 割合 |"
  );
  console.log("|---|---|---|---|");
  for (const [country, stats] of Object.entries(countryStats).sort(
    (a, b) => b[1].suspect - a[1].suspect
  )) {
    if (stats.suspect > 0) {
      console.log(
        `| ${country} | ${stats.total} | ${stats.suspect} | ${((stats.suspect / stats.total) * 100).toFixed(1)}% |`
      );
    }
  }

  // カテゴリ別の詳細（suspect > 0のみ）
  console.log("\n--- カテゴリ別詳細 ---\n");
  for (const [country, stats] of Object.entries(countryStats).sort(
    (a, b) => b[1].suspect - a[1].suspect
  )) {
    const suspectCategories = Object.entries(stats.categories).filter(
      ([, c]) => c.suspect > 0
    );
    if (suspectCategories.length === 0) continue;

    console.log(`\n### ${country.toUpperCase()}`);
    console.log("| カテゴリ | 総数 | suspect | 割合 |");
    console.log("|---|---|---|---|");
    for (const [cat, catStats] of suspectCategories.sort(
      (a, b) => b[1].suspect - a[1].suspect
    )) {
      console.log(
        `| ${cat} | ${catStats.total} | ${catStats.suspect} | ${((catStats.suspect / catStats.total) * 100).toFixed(1)}% |`
      );
    }
  }

  // suspect一覧（上位100件）
  if (!removeMode) {
    console.log("\n--- suspect一覧（上位100件） ---\n");
    const top = allSuspects.slice(0, 100);
    for (const s of top) {
      console.log(
        `[${s.country}/${s.category}] ${s.place.name} (score: ${s.score}) — ${s.reasons.join(", ")}`
      );
    }
    if (allSuspects.length > 100) {
      console.log(`\n... 他 ${allSuspects.length - 100} 件`);
    }

    console.log(
      `\n💡 削除するには: npx tsx scripts/validate-places.ts --remove`
    );
  }
}

main();
