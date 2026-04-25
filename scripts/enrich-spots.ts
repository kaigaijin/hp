/**
 * enrich-places.ts
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
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-places.ts <country> [category] [--dry-run] [--limit N]
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-places.ts sg              # SG全カテゴリ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-places.ts sg dental       # SG歯科のみ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-places.ts all             # 全国全カテゴリ
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-places.ts all --limit 500 # 最大500件で止める（無料枠管理用）
 */

import fs from "fs";
import path from "path";
import {
  GOOGLE_API_KEY,
  COUNTRY_SEARCH_CONFIG,
  type PlaceResult,
  type placeEntry,
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
      // Pro SKUフィールドのみ（月5,000件無料）
      // Enterprise SKUフィールド（websiteUri, internationalPhoneNumber, currentOpeningHours等）を
      // 含めると月1,000件無料に減り、超過$35/1,000件で高額請求になる。絶対に追加しない
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
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
function enrichplace(entry: placeEntry, apiResult: PlaceResult): placeEntry {
  const jaDisplayName = apiResult.displayName?.text ?? null;

  // 座標
  if (!entry.lat && apiResult.location?.latitude) {
    entry.lat = Math.round(apiResult.location.latitude * 10000) / 10000;
  }
  if (!entry.lng && apiResult.location?.longitude) {
    entry.lng = Math.round(apiResult.location.longitude * 10000) / 10000;
  }

  // 営業時間（currentOpeningHours優先、なければregularOpeningHours）
  if (!entry.hours) {
    const weekdays =
      apiResult.currentOpeningHours?.weekdayDescriptions ??
      apiResult.regularOpeningHours?.weekdayDescriptions;
    if (weekdays) {
      entry.hours = weekdays.join(" / ");
    }
  }

  // 電話番号（国際形式）
  if (!entry.phone && apiResult.internationalPhoneNumber) {
    entry.phone = apiResult.internationalPhoneNumber.replace(/[\s-]/g, "");
  }

  // 電話番号（現地形式）
  if (!entry.phone_local && apiResult.nationalPhoneNumber) {
    entry.phone_local = apiResult.nationalPhoneNumber;
  }

  // 住所
  if (!entry.address && apiResult.formattedAddress) {
    entry.address = apiResult.formattedAddress;
  }

  // Webサイト
  if (!entry.website && apiResult.websiteUri) {
    entry.website = apiResult.websiteUri;
  }

  // 日本語名（APIから取得できた場合、既存のname_jaが空なら補完）
  if (!entry.name_ja && jaDisplayName && jaDisplayName !== entry.name) {
    entry.name_ja = jaDisplayName;
  }

  // Googleレーティング（保存のみ・表示しない）
  if (entry.rating === undefined || entry.rating === null) {
    entry.rating = apiResult.rating ?? null;
  }

  // 口コミ数（保存のみ・表示しない）
  if (entry.user_rating_count === undefined || entry.user_rating_count === null) {
    entry.user_rating_count = apiResult.userRatingCount ?? null;
  }

  // 価格帯（保存のみ・表示しない）
  if (entry.price_level === undefined || entry.price_level === null) {
    entry.price_level = apiResult.priceLevel
      ? (PRICE_LEVEL_MAP[apiResult.priceLevel] ?? null)
      : null;
  }

  // フォト参照キー（保存のみ・表示しない）
  if (!entry.photo_name && apiResult.photos?.[0]?.name) {
    entry.photo_name = apiResult.photos[0].name;
  }

  // place_id・source・last_verified を更新
  entry.place_id = apiResult.id;
  entry.source = "google_maps";
  entry.last_verified = TODAY;

  return entry;
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

  const places: placeEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // place_id が空のスポットを対象にする
  const targets = places.filter((s) => !s.place_id);
  if (targets.length === 0) return { enriched: 0, skipped: places.length, failed: 0 };

  console.log(`  ${category}: ${targets.length}件 補完対象（全${places.length}件中）`);

  let enriched = 0;
  let failed = 0;

  for (const place of targets) {
    if (remaining.count <= 0) {
      console.log(`    ⏸ --limit に達したため中断`);
      break;
    }

    const apiResult = await findPlace(place.name, place.area, countryConfig);
    await sleep(DELAY_MS);
    remaining.count--;

    if (!apiResult) {
      console.log(`    ✗ ${place.name} — API検索失敗`);
      failed++;
      continue;
    }

    // 既に同じplace_idが存在する場合はスキップ（重複防止）
    const duplicate = places.find((s) => s.place_id === apiResult.id && s.slug !== place.slug);
    if (duplicate) {
      console.log(`    → ${place.name} — place_id重複（${duplicate.slug}）、スキップ`);
      failed++;
      continue;
    }

    enrichplace(place, apiResult);
    enriched++;
    console.log(`    ✓ ${place.name} → place_id: ${place.place_id}${place.name_ja ? ` / ${place.name_ja}` : ""}`);
  }

  if (enriched > 0 && !dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(places, null, 2) + "\n");
  }

  return { enriched, skipped: places.length - targets.length, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--limit"));
  const target = positional[0];
  const targetCategory = positional[1];
  const dryRun = args.includes("--dry-run");

  // --limit N: API呼び出しの上限件数（無料枠管理用）
  // デフォルト2,500件 = Pro SKU月額無料枠5,000件の半分
  // Pro SKU: places.rating/userRatingCount を含まないリクエスト（月5,000件無料）
  // Enterprise SKU: places.rating/userRatingCount を含むリクエスト（月1,000件無料）→ 使わない
  const limitIdx = args.indexOf("--limit");
  const DEFAULT_LIMIT = 2500;
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? "0", 10) : DEFAULT_LIMIT;
  const remaining = { count: limit };

  if (!target) {
    console.log("使い方:");
    console.log("  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-places.ts <country|all> [category] [--dry-run] [--limit N]");
    console.log("\n例:");
    console.log("  npx tsx scripts/enrich-places.ts sg                  # SG全カテゴリ");
    console.log("  npx tsx scripts/enrich-places.ts sg dental           # SG歯科のみ");
    console.log("  npx tsx scripts/enrich-places.ts all                 # 全国全カテゴリ");
    console.log("  npx tsx scripts/enrich-places.ts all                 # デフォルト2,500件（Pro SKU無料枠の半分）");
  console.log("  npx tsx scripts/enrich-places.ts all --limit 0       # 無制限（全件処理）");
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
