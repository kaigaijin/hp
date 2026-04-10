/**
 * check-fake-places.ts
 *
 * 架空スポット・カテゴリ間違いを検出して削除するスクリプト。
 * validate-places.ts（日本人向け判定）とセットで使う。
 *
 * 検出パターン:
 *   1. 施設名が「都市名+カテゴリ」の単純パターン かつ website=null → 架空の可能性大
 *   2. カテゴリと施設名が明らかに矛盾している（groceryに歯科、travelに動物病院など）
 *
 * 使い方:
 *   npx tsx scripts/check-fake-places.ts              # レポートのみ（変更なし）
 *   npx tsx scripts/check-fake-places.ts --remove      # 自動削除
 *   npx tsx scripts/check-fake-places.ts --country ch  # 特定国のみ
 */

import fs from "fs";
import path from "path";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");

// 「都市名+カテゴリ」パターン検出用
const CITY_NAMES = [
  "Zurich", "Geneva", "Bern", "Basel",
  "Paris", "Lyon", "Marseille",
  "Madrid", "Barcelona", "Seville",
  "Amsterdam", "Rotterdam", "The Hague",
  "Rome", "Milan", "Florence", "Naples",
  "Auckland", "Wellington", "Christchurch",
  "Lisbon", "Porto",
  "Toronto", "Vancouver", "Montreal", "Calgary",
  "Shanghai", "Beijing", "Shenzhen", "Guangzhou",
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
  "Manila", "Cebu", "Makati",
  "Tokyo", "Osaka", "Kyoto",
].join("|");

const CATEGORY_WORDS = [
  "Pharmacy", "Pharmacie", "Apotheke",
  "Cleaning", "Cleaning Service", "Cleaning Professionals",
  "Laundry", "Laundry Service",
  "Dental", "Dentist", "Dentist Clinic", "Dental Center",
  "Clinic", "Medical Clinic", "Health Center",
  "Fitness", "Fitness Center", "Gym", "Yoga", "Yoga Studio",
  "Accounting", "Accounting Services",
  "Legal", "Legal Services", "Law",
  "Insurance", "Insurance Advisory",
  "Real Estate", "Property Agency",
  "Car Rental",
  "Nail", "Nail Salon", "Nails",
  "Pet", "Veterinary",
  "Appliance Repair", "Repair", "Handyman",
  "Moving", "Moving Company", "Relocation",
].join("|");

const SIMPLE_PATTERN = new RegExp(
  `^(${CITY_NAMES})\\s+(${CATEGORY_WORDS})`,
  "i"
);

// カテゴリ間違い検出ルール: { カテゴリ: [そのカテゴリに入ってはいけないキーワード] }
// beautyはクリニック系（美容クリニック）が混在するケースがあるため除外
const WRONG_CATEGORY_RULES: Record<string, RegExp[]> = {
  grocery: [/dental|dentist|clinic|hospital|medical|veterinary|vet/i],
  education: [/\bbank\b|dental|dentist|clinic|hospital|veterinary|vet/i],
  insurance: [/\blaw firm\b|\blawyer\b|\battorney\b|\babogados\b/i],
  travel: [/veterinary|animal hospital|pet clinic|動物病院/i],
  restaurant: [/\bdental\b|\bdentist\b|\bhospital\b|\bpharmacy\b|薬局/i],
  cafe: [/\bdental\b|\bdentist\b|\bhospital\b|\bpharmacy\b|薬局/i],
};

interface placeEntry {
  slug: string;
  name: string;
  website?: string | null;
  [key: string]: unknown;
}

interface FakeResult {
  country: string;
  category: string;
  place: placeEntry;
  reason: string;
}

function checkFake(place: placeEntry, category: string): string | null {
  const name = place.name || "";
  const website = place.website;

  // パターン1: 「都市名+カテゴリ」かつ website=null
  // 名前が「都市名 カテゴリ語」で終わる（後ろに固有名詞がない）場合のみ
  const simpleMatch = SIMPLE_PATTERN.exec(name);
  if (simpleMatch && !website) {
    // source_urlがある場合は実在確認済みとみなしてスキップ
    if (place.source_url) return null;
    // 後ろに固有名詞・地区名等があれば実在の可能性→スキップ
    const afterMatch = name.slice(simpleMatch[0].length).trim();
    if (!afterMatch) {
      // 「Bern Health Center」のように完全一致 → 架空の可能性大
      return `施設名が「都市名+カテゴリ」の単純パターンかつwebsite/source_urlなし: "${name}"`;
    }
  }

  // パターン2: カテゴリ間違い
  const rules = WRONG_CATEGORY_RULES[category];
  if (rules) {
    for (const rule of rules) {
      if (rule.test(name)) {
        return `カテゴリ「${category}」に不適切な施設名: "${name}"`;
      }
    }
  }

  return null;
}

function main() {
  const args = process.argv.slice(2);
  const removeMode = args.includes("--remove");
  const countryFilter = args.includes("--country")
    ? args[args.indexOf("--country") + 1]
    : null;

  const countries = fs
    .readdirSync(DIRECTORY_PATH)
    .filter((f) => fs.statSync(path.join(DIRECTORY_PATH, f)).isDirectory())
    .filter((f) => !countryFilter || f === countryFilter)
    .sort();

  const allFakes: FakeResult[] = [];
  let totalplaces = 0;
  let totalFakes = 0;
  let totalRemoved = 0;

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_PATH, country);
    const files = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const file of files) {
      const category = file.replace(".json", "");
      const filePath = path.join(countryDir, file);
      let places: placeEntry[];
      try {
        places = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        continue;
      }
      if (!Array.isArray(places)) continue;

      const fakes: FakeResult[] = [];

      for (const place of places) {
        totalplaces++;
        const reason = checkFake(place, category);
        if (reason) {
          totalFakes++;
          fakes.push({ country, category, place, reason });
          allFakes.push({ country, category, place, reason });
        }
      }

      if (removeMode && fakes.length > 0) {
        const slugsToRemove = new Set(fakes.map((f) => f.place.slug));
        const filtered = places.filter((s) => !slugsToRemove.has(s.slug));
        totalRemoved += places.length - filtered.length;
        fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2) + "\n");
        console.log(`[削除] ${country}/${category}: ${fakes.length}件削除 (${places.length}→${filtered.length}件)`);
        for (const f of fakes) {
          console.log(`  - ${f.place.name}: ${f.reason}`);
        }
      }
    }
  }

  console.log("\n=== 架空スポット検出レポート ===\n");
  console.log(`総スポット数: ${totalplaces}`);
  console.log(`架空疑い: ${totalFakes}件 (${totalplaces > 0 ? ((totalFakes / totalplaces) * 100).toFixed(1) : 0}%)`);

  if (removeMode) {
    console.log(`削除済み: ${totalRemoved}件`);
  } else if (allFakes.length > 0) {
    console.log("\n--- 架空疑いスポット一覧 ---\n");
    for (const f of allFakes) {
      console.log(`[${f.country}/${f.category}] ${f.place.name}`);
      console.log(`  理由: ${f.reason}`);
    }
    console.log(`\n削除するには: npx tsx scripts/check-fake-places.ts --remove`);
  } else {
    console.log("\n架空スポットは検出されませんでした。");
  }
}

main();
