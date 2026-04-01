/**
 * enrich-spots.ts
 *
 * 既存スポットデータのうち place_id が空のエントリに
 * Google Places API で構造化データを補完する。
 *
 * 補完フィールド:
 *   - place_id, lat, lng
 *   - phone (internationalPhoneNumber), phone_local (nationalPhoneNumber)
 *   - website, hours (currentOpeningHours.weekdayDescriptions)
 *   - name_ja, address
 *   - rating, user_rating_count, price_level (保存のみ・表示しない)
 *   - photo_name (保存のみ・表示しない)
 *   - email: Places API (New) は非対応のため取得不可
 *
 * フロー:
 *   ① AIがWebSearchで調査 → content/directory/{country}/{category}.json に直接追加（place_id空でOK）
 *   ② このスクリプト → place_id空のスポットをPlaces APIで補完（枠がある時に随時実行）
 *
 * 使い方:
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts <country> [category] [--dry-run] [--limit N]
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts sg              # SG全カテゴリ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts sg dental       # SG歯科のみ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts all             # 全国全カテゴリ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts all --limit 500 # 最大500件で止める（無料枠管理用）
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

// Places API (New) の priceLevel 文字列 → 数値（1-4）に変換
const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: "1",
  PRICE_LEVEL_INEXPENSIVE: "1",
  PRICE_LEVEL_MODERATE: "2",
  PRICE_LEVEL_EXPENSIVE: "3",
  PRICE_LEVEL_VERY_EXPENSIVE: "4",
};

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
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.internationalPhoneNumber",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.currentOpeningHours",
        "places.regularOpeningHours",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.photos",
      ].join(","),
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

  // 営業時間（currentOpeningHours優先、なければregularOpeningHours）
  if (!spot.hours) {
    const weekdays =
      place.currentOpeningHours?.weekdayDescriptions ??
      place.regularOpeningHours?.weekdayDescriptions;
    if (weekdays) {
      spot.hours = weekdays.join(" / ");
    }
  }

  // 電話番号（国際形式）
  if (!spot.phone && place.internationalPhoneNumber) {
    spot.phone = place.internationalPhoneNumber.replace(/[\s-]/g, "");
  }

  // 電話番号（現地形式）
  if (!spot.phone_local && place.nationalPhoneNumber) {
    spot.phone_local = place.nationalPhoneNumber;
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

  // Googleレーティング（保存のみ・表示しない）
  if (spot.rating === undefined || spot.rating === null) {
    spot.rating = place.rating ?? null;
  }

  // 口コミ数（保存のみ・表示しない）
  if (spot.user_rating_count === undefined || spot.user_rating_count === null) {
    spot.user_rating_count = place.userRatingCount ?? null;
  }

  // 価格帯（保存のみ・表示しない）
  if (spot.price_level === undefined || spot.price_level === null) {
    spot.price_level = place.priceLevel
      ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null)
      : null;
  }

  // フォト参照キー（保存のみ・表示しない）
  if (!spot.photo_name && place.photos?.[0]?.name) {
    spot.photo_name = place.photos[0].name;
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
  dryRun: boolean,
  remaining: { count: number } // 残り処理可能件数（参照渡しで全カテゴリをまたいで管理）
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
    if (remaining.count <= 0) {
      console.log(`    ⏸ --limit に達したため中断`);
      break;
    }

    const place = await findPlace(spot.name, spot.area, countryConfig);
    await sleep(DELAY_MS);
    remaining.count--;

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
  const positional = args.filter((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--limit"));
  const target = positional[0];
  const targetCategory = positional[1];
  const dryRun = args.includes("--dry-run");

  // --limit N: API呼び出しの上限件数（無料枠管理用。未指定なら無制限）
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? "0", 10) : Infinity;
  const remaining = { count: isFinite(limit) ? limit : Number.MAX_SAFE_INTEGER };

  if (!target) {
    console.log("使い方:");
    console.log("  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts <country|all> [category] [--dry-run] [--limit N]");
    console.log("\n例:");
    console.log("  npx tsx scripts/enrich-spots.ts sg                  # SG全カテゴリ");
    console.log("  npx tsx scripts/enrich-spots.ts sg dental           # SG歯科のみ");
    console.log("  npx tsx scripts/enrich-spots.ts all                 # 全国全カテゴリ");
    console.log("  npx tsx scripts/enrich-spots.ts all --limit 500     # 最大500件（無料枠管理用）");
    process.exit(1);
  }

  if (isFinite(limit)) {
    console.log(`上限: ${limit}件（--limit指定）`);
  }

  const countries = target === "all"
    ? Object.keys(COUNTRY_SEARCH_CONFIG)
    : [target];

  let totalEnriched = 0;
  let totalFailed = 0;

  for (const country of countries) {
    if (remaining.count <= 0) break;

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
      if (remaining.count <= 0) break;
      const category = file.replace(".json", "");
      const result = await enrichCategory(country, category, config, dryRun, remaining);
      totalEnriched += result.enriched;
      totalFailed += result.failed;
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`補完: ${totalEnriched}件${dryRun ? "（dry-run）" : ""}`);
  if (totalFailed > 0) {
    console.log(`失敗: ${totalFailed}件`);
  }
  if (isFinite(limit)) {
    console.log(`残り枠: ${remaining.count}件`);
  }
}

main().catch(console.error);
