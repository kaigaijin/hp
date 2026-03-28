/**
 * enrich-spots.ts
 *
 * 既存スポットデータのうち place_id が空のエントリに
 * Google Places API で構造化データ（座標・営業時間・電話番号・日本語名）を補完する。
 *
 * フロー:
 *   ① AIがWebSearchで調査 → content/directory/{country}/{category}.json に直接追加（place_id空でOK）
 *   ② このスクリプト → place_id空のスポットをPlaces APIで補完（枠がある時に随時実行）
 *
 * 使い方:
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts <country> [category] [--dry-run]
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts sg           # SG全カテゴリ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts sg dental    # SG歯科のみ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts all          # 全国全カテゴリ
 */

import fs from "fs";
import path from "path";
import {
  GOOGLE_API_KEY,
  COUNTRY_SEARCH_CONFIG,
  type PlaceResult,
  type SpotEntry,
} from "./places-config.js";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

// Places API で施設名を検索（languageCode: "ja" で日本語名を取得）
async function findPlace(
  name: string,
  area: string,
  countryConfig: { cities: { name: string; lat: number; lng: number; radius: number }[] }
): Promise<PlaceResult | null> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const city = countryConfig.cities.find(
    (c) => c.name.toLowerCase() === area.toLowerCase()
  ) ?? countryConfig.cities[0];

  const body = {
    textQuery: `${name} ${area}`,
    locationBias: {
      circle: {
        center: { latitude: city.lat, longitude: city.lng },
        radius: city.radius,
      },
    },
    maxResultCount: 3,
    languageCode: "ja",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.location",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`  ✗ API Error (${res.status}): ${errText}`);
    return null;
  }

  const data = (await res.json()) as { places?: PlaceResult[] };
  return (data.places ?? [])[0] ?? null;
}

// 既存スポットをPlaces APIデータで補完する
function enrichSpot(spot: SpotEntry, place: PlaceResult): SpotEntry {
  const jaDisplayName = place.displayName?.text ?? null;

  // 座標
  if (!spot.lat && place.location?.latitude) {
    spot.lat = Math.round(place.location.latitude * 10000) / 10000;
  }
  if (!spot.lng && place.location?.longitude) {
    spot.lng = Math.round(place.location.longitude * 10000) / 10000;
  }

  // 営業時間
  if (!spot.hours && place.regularOpeningHours?.weekdayDescriptions) {
    spot.hours = place.regularOpeningHours.weekdayDescriptions.join(" / ");
  }

  // 電話番号
  if (!spot.phone && place.internationalPhoneNumber) {
    spot.phone = place.internationalPhoneNumber.replace(/[\s-]/g, "");
  }

  // 住所
  if (!spot.address && place.formattedAddress) {
    spot.address = place.formattedAddress;
  }

  // Webサイト
  if (!spot.website && place.websiteUri) {
    spot.website = place.websiteUri;
  }

  // 日本語名（APIから取得できた場合、既存のname_jaが空なら補完）
  if (!spot.name_ja && jaDisplayName && jaDisplayName !== spot.name) {
    spot.name_ja = jaDisplayName;
  }

  // place_id・source・last_verified を更新
  spot.place_id = place.id;
  spot.source = "google_maps";
  spot.last_verified = TODAY;

  return spot;
}

async function enrichCategory(
  country: string,
  category: string,
  countryConfig: { cities: { name: string; lat: number; lng: number; radius: number }[] },
  dryRun: boolean
): Promise<{ enriched: number; skipped: number; failed: number }> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) return { enriched: 0, skipped: 0, failed: 0 };

  const spots: SpotEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // place_id が空のスポットを対象にする
  const targets = spots.filter((s) => !s.place_id);
  if (targets.length === 0) return { enriched: 0, skipped: spots.length, failed: 0 };

  console.log(`  ${category}: ${targets.length}件 補完対象（全${spots.length}件中）`);

  let enriched = 0;
  let failed = 0;

  for (const spot of targets) {
    const place = await findPlace(spot.name, spot.area, countryConfig);
    await sleep(DELAY_MS);

    if (!place) {
      console.log(`    ✗ ${spot.name} — API検索失敗`);
      failed++;
      continue;
    }

    // 既に同じplace_idが存在する場合はスキップ（重複防止）
    const duplicate = spots.find((s) => s.place_id === place.id && s.slug !== spot.slug);
    if (duplicate) {
      console.log(`    → ${spot.name} — place_id重複（${duplicate.slug}）、スキップ`);
      failed++;
      continue;
    }

    enrichSpot(spot, place);
    enriched++;
    console.log(`    ✓ ${spot.name} → place_id: ${spot.place_id}${spot.name_ja ? ` / ${spot.name_ja}` : ""}`);
  }

  if (enriched > 0 && !dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(spots, null, 2) + "\n");
  }

  return { enriched, skipped: spots.length - targets.length, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const targetCategory = args.find((a) => !a.startsWith("--") && a !== target);
  const dryRun = args.includes("--dry-run");

  if (!target) {
    console.log("使い方:");
    console.log("  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts <country|all> [category] [--dry-run]");
    console.log("\n例:");
    console.log("  npx tsx scripts/enrich-spots.ts sg          # SG全カテゴリ");
    console.log("  npx tsx scripts/enrich-spots.ts sg dental   # SG歯科のみ");
    console.log("  npx tsx scripts/enrich-spots.ts all         # 全国全カテゴリ");
    process.exit(1);
  }

  const countries = target === "all"
    ? Object.keys(COUNTRY_SEARCH_CONFIG)
    : [target];

  let totalEnriched = 0;
  let totalFailed = 0;

  for (const country of countries) {
    const config = COUNTRY_SEARCH_CONFIG[country];
    if (!config) {
      console.error(`未対応の国: ${country}`);
      continue;
    }

    console.log(`\n=== ${country.toUpperCase()} ===`);

    const countryDir = path.join(DIRECTORY_PATH, country);
    if (!fs.existsSync(countryDir)) continue;

    const files = fs.readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .filter((f) => !targetCategory || f === `${targetCategory}.json`)
      .sort();

    for (const file of files) {
      const category = file.replace(".json", "");
      const result = await enrichCategory(country, category, config, dryRun);
      totalEnriched += result.enriched;
      totalFailed += result.failed;
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`補完: ${totalEnriched}件${dryRun ? "（dry-run）" : ""}`);
  if (totalFailed > 0) {
    console.log(`失敗: ${totalFailed}件`);
  }
}

main().catch(console.error);
