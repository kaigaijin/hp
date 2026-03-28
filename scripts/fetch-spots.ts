// Google Places API（New）から新規スポットを一括取得するスクリプト
// 使い方: GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/fetch-spots.ts [country] [category]
// 例: GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/fetch-spots.ts sg restaurant
// 全国全カテゴリ: GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/fetch-spots.ts all

import fs from "fs";
import path from "path";
import {
  GOOGLE_API_KEY,
  COUNTRY_SEARCH_CONFIG,
  CATEGORY_SEARCH_QUERIES,
  toSlug,
  type PlaceResult,
  type SpotEntry,
} from "./places-config.js";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const DELAY_MS = 200; // レート制限
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TODAY = new Date().toISOString().slice(0, 10);

// 既存スポットのplace_idセットを読み込む
function loadExistingPlaceIds(country: string, category: string): Set<string> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  const ids = new Set<string>();
  if (!fs.existsSync(filePath)) return ids;

  const spots: { place_id?: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );
  for (const s of spots) {
    if (s.place_id) ids.add(s.place_id);
  }
  return ids;
}

// 既存スポットのslugセットを読み込む（place_idがない既存データ用）
function loadExistingSlugs(country: string, category: string): Set<string> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  const slugs = new Set<string>();
  if (!fs.existsSync(filePath)) return slugs;

  const spots: { slug: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );
  for (const s of spots) {
    slugs.add(s.slug);
  }
  return slugs;
}

// Places API (New) Text Search
async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  radius: number,
  pageToken?: string
): Promise<{ places: PlaceResult[]; nextPageToken?: string }> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body: Record<string, unknown> = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
      },
    },
    maxResultCount: 20,
    languageCode: "en",
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.types,places.location,places.primaryType,nextPageToken",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`API Error (${res.status}): ${errText}`);
    return { places: [] };
  }

  const data = (await res.json()) as {
    places?: PlaceResult[];
    nextPageToken?: string;
  };

  return {
    places: data.places ?? [],
    nextPageToken: data.nextPageToken,
  };
}

// PlaceResultをSpotEntryに変換
function toSpotEntry(
  place: PlaceResult,
  jaName: string | null,
  city: string
): SpotEntry {
  const name = place.displayName?.text ?? "Unknown";
  const slug = toSlug(name);
  const address = place.formattedAddress ?? "";

  // 営業時間をフォーマット
  let hours: string | null = null;
  if (place.regularOpeningHours?.weekdayDescriptions) {
    hours = place.regularOpeningHours.weekdayDescriptions.join(" / ");
  }

  // 座標（小数点4桁に丸める）
  const lat = place.location?.latitude
    ? Math.round(place.location.latitude * 10000) / 10000
    : null;
  const lng = place.location?.longitude
    ? Math.round(place.location.longitude * 10000) / 10000
    : null;

  return {
    slug,
    name,
    name_ja: jaName !== name ? jaName : null,
    area: city,
    address,
    lat,
    lng,
    phone: place.internationalPhoneNumber?.replace(/[\s-]/g, "") ?? null,
    website: place.websiteUri ?? null,
    description: "",
    tags: [],
    hours,
    last_verified: TODAY,
    status: "unverified",
    source: "google_maps",
    place_id: place.id,
    priority: 0,
    ai_reviewed: false,
  };
}

// slug重複を解消
function deduplicateSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  let i = 2;
  while (existingSlugs.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

async function fetchCategoryForCountry(
  country: string,
  category: string,
  dryRun: boolean
): Promise<number> {
  const config = COUNTRY_SEARCH_CONFIG[country];
  const queries = CATEGORY_SEARCH_QUERIES[category];
  if (!config || !queries) return 0;

  const existingPlaceIds = loadExistingPlaceIds(country, category);
  const existingSlugs = loadExistingSlugs(country, category);

  // 既存データを読み込み
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  let existingSpots: SpotEntry[] = [];
  if (fs.existsSync(filePath)) {
    existingSpots = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  const newSpots: SpotEntry[] = [];
  const seenPlaceIds = new Set<string>(existingPlaceIds);

  for (const city of config.cities) {
    for (const keyword of queries.keywords) {
      console.log(`    検索: "${keyword}" in ${city.name}`);

      let pageToken: string | undefined;
      let pages = 0;

      do {
        const result = await searchPlaces(
          keyword,
          city.lat,
          city.lng,
          city.radius,
          pageToken
        );

        for (const place of result.places) {
          // 重複チェック（place_id）
          if (seenPlaceIds.has(place.id)) continue;
          seenPlaceIds.add(place.id);

          // 日本語名はAIで後から付与（APIコスト削減）
          const spot = toSpotEntry(place, null, city.name);

          // slug重複解消
          spot.slug = deduplicateSlug(spot.slug, existingSlugs);
          existingSlugs.add(spot.slug);

          newSpots.push(spot);
          console.log(`      + ${spot.name}`);
        }

        pageToken = result.nextPageToken;
        pages++;
        await sleep(DELAY_MS);
      } while (pageToken && pages < 5); // 最大5ページ（100件）per keyword
    }
  }

  if (newSpots.length > 0 && !dryRun) {
    // ディレクトリ作成
    const dir = path.join(DIRECTORY_PATH, country);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 既存 + 新規をマージして保存
    const merged = [...existingSpots, ...newSpots];
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n");
  }

  return newSpots.length;
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0];
  const targetCategory = args[1];
  const dryRun = args.includes("--dry-run");

  if (!target) {
    console.log("使い方:");
    console.log(
      "  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/fetch-spots.ts <country|all> [category] [--dry-run]"
    );
    console.log("例:");
    console.log(
      "  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/fetch-spots.ts sg restaurant"
    );
    console.log("  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/fetch-spots.ts all");
    process.exit(1);
  }

  const countries =
    target === "all"
      ? Object.keys(COUNTRY_SEARCH_CONFIG)
      : [target];

  const allCategories = Object.keys(CATEGORY_SEARCH_QUERIES);

  let grandTotal = 0;

  for (const country of countries) {
    console.log(`\n=== ${country.toUpperCase()} ===`);

    const categories = targetCategory ? [targetCategory] : allCategories;

    for (const cat of categories) {
      console.log(`\n  [${cat}]`);
      const count = await fetchCategoryForCountry(country, cat, dryRun);
      console.log(`  → ${count}件 追加${dryRun ? "（dry-run）" : ""}`);
      grandTotal += count;
    }
  }

  console.log(`\n=== 完了: 合計 ${grandTotal}件 追加 ===`);
}

main().catch(console.error);
