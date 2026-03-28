/**
 * enrich-spots.ts
 *
 * AI選定済みの施設名リストからGoogle Places APIで構造化データを取得する。
 *
 * 新フロー:
 *   ① AI選定（WebSearch）→ spots-queue/{country}/{category}.json に施設名リスト作成
 *   ② このスクリプト → Places API で place_id, lat/lng, hours, phone, 日本語名を取得
 *   ③ AI検証 → description, tags付与 + validate-spots.ts で品質チェック
 *
 * 使い方:
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts <country> <category>
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts sg dental
 *   GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts sg dental --dry-run
 *
 * 入力ファイル: scripts/spots-queue/{country}/{category}.json
 * フォーマット:
 * [
 *   {
 *     "name": "Nihon Dental Clinic",
 *     "name_ja": "日本デンタルクリニック",   // AIが調査済みなら記入、不明ならnull
 *     "area": "Orchard",                    // エリア名（都市名 or 地区名）
 *     "reason": "日本人歯科医師が在籍、日本語対応可"  // 日本人向けの根拠（必須）
 *   }
 * ]
 */

import fs from "fs";
import path from "path";
import {
  GOOGLE_API_KEY,
  COUNTRY_SEARCH_CONFIG,
  toSlug,
  type PlaceResult,
  type SpotEntry,
} from "./places-config.js";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const QUEUE_PATH = path.resolve(__dirname, "spots-queue");
const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

interface QueueEntry {
  name: string;
  name_ja: string | null;
  area: string;
  reason: string;
}

// Places API で施設名を検索（languageCode: "ja" で日本語名を取得）
async function findPlace(
  name: string,
  area: string,
  countryConfig: { cities: { name: string; lat: number; lng: number; radius: number }[] }
): Promise<PlaceResult | null> {
  const url = "https://places.googleapis.com/v1/places:searchText";

  // エリアに最も近い都市の座標を使う
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
    languageCode: "ja", // 日本語名を取得
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.types,places.location,places.primaryType",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`  ✗ API Error (${res.status}): ${errText}`);
    return null;
  }

  const data = (await res.json()) as { places?: PlaceResult[] };
  const places = data.places ?? [];

  if (places.length === 0) {
    console.error(`  ✗ 見つかりません: ${name}`);
    return null;
  }

  // 最もマッチする結果を返す（1件目）
  return places[0];
}

// 英語名も取得する（別リクエスト）
async function getEnglishName(
  placeId: string
): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "displayName",
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { displayName?: { text: string } };
  return data.displayName?.text ?? null;
}

function toSpotEntry(
  place: PlaceResult,
  queue: QueueEntry,
  englishName: string | null
): SpotEntry {
  const jaName = place.displayName?.text ?? queue.name_ja ?? queue.name;
  const name = englishName ?? queue.name;
  const slug = toSlug(name);

  let hours: string | null = null;
  if (place.regularOpeningHours?.weekdayDescriptions) {
    hours = place.regularOpeningHours.weekdayDescriptions.join(" / ");
  }

  const lat = place.location?.latitude
    ? Math.round(place.location.latitude * 10000) / 10000
    : null;
  const lng = place.location?.longitude
    ? Math.round(place.location.longitude * 10000) / 10000
    : null;

  return {
    slug,
    name,
    name_ja: jaName !== name ? jaName : queue.name_ja,
    area: queue.area,
    address: place.formattedAddress ?? "",
    lat,
    lng,
    phone: place.internationalPhoneNumber?.replace(/[\s-]/g, "") ?? null,
    website: place.websiteUri ?? null,
    description: "", // AI検証フェーズで付与
    tags: [],        // AI検証フェーズで付与
    hours,
    last_verified: TODAY,
    status: "unverified",
    source: "google_maps",
    place_id: place.id,
    priority: 0,
    ai_reviewed: false,
  };
}

function loadExistingPlaceIds(country: string, category: string): Set<string> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) return new Set();
  const spots: { place_id?: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );
  return new Set(spots.filter((s) => s.place_id).map((s) => s.place_id!));
}

function loadExistingSlugs(country: string, category: string): Set<string> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) return new Set();
  const spots: { slug: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
  );
  return new Set(spots.map((s) => s.slug));
}

function deduplicateSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  let i = 2;
  while (existingSlugs.has(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

async function main() {
  const args = process.argv.slice(2);
  const country = args[0];
  const category = args[1];
  const dryRun = args.includes("--dry-run");

  if (!country || !category) {
    console.log("使い方:");
    console.log(
      "  GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/enrich-spots.ts <country> <category> [--dry-run]"
    );
    console.log("\n入力ファイル: scripts/spots-queue/{country}/{category}.json");
    console.log("\nフォーマット:");
    console.log(
      '  [{ "name": "施設名", "name_ja": "日本語名|null", "area": "エリア", "reason": "日本人向けの根拠" }]'
    );
    process.exit(1);
  }

  const config = COUNTRY_SEARCH_CONFIG[country];
  if (!config) {
    console.error(`未対応の国: ${country}`);
    process.exit(1);
  }

  // キューファイルを読み込み
  const queueFile = path.join(QUEUE_PATH, country, `${category}.json`);
  if (!fs.existsSync(queueFile)) {
    console.error(`キューファイルが見つかりません: ${queueFile}`);
    console.error(
      "先にAI選定でキューファイルを作成してください"
    );
    process.exit(1);
  }

  const queue: QueueEntry[] = JSON.parse(fs.readFileSync(queueFile, "utf-8"));
  console.log(`\n=== ${country.toUpperCase()} / ${category} ===`);
  console.log(`キュー: ${queue.length}件\n`);

  // reason が空のエントリを拒否
  const invalid = queue.filter((q) => !q.reason || q.reason.trim() === "");
  if (invalid.length > 0) {
    console.error(`✗ reason（日本人向けの根拠）が空のエントリがあります:`);
    for (const q of invalid) {
      console.error(`  - ${q.name}`);
    }
    console.error("\n全エントリに reason を記入してから再実行してください");
    process.exit(1);
  }

  const existingPlaceIds = loadExistingPlaceIds(country, category);
  const existingSlugs = loadExistingSlugs(country, category);

  // 既存データ
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  let existingSpots: SpotEntry[] = [];
  if (fs.existsSync(filePath)) {
    existingSpots = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  const newSpots: SpotEntry[] = [];
  const failed: string[] = [];

  for (const entry of queue) {
    console.log(`検索: ${entry.name} (${entry.area})`);

    // Places API で検索（日本語）
    const place = await findPlace(entry.name, entry.area, config);
    await sleep(DELAY_MS);

    if (!place) {
      failed.push(entry.name);
      continue;
    }

    // 重複チェック
    if (existingPlaceIds.has(place.id)) {
      console.log(`  → スキップ（既存: ${place.id}）`);
      continue;
    }

    // 英語名を取得
    const englishName = await getEnglishName(place.id);
    await sleep(DELAY_MS);

    const spot = toSpotEntry(place, entry, englishName);
    spot.slug = deduplicateSlug(spot.slug, existingSlugs);
    existingSlugs.add(spot.slug);
    existingPlaceIds.add(place.id);

    newSpots.push(spot);
    console.log(
      `  ✓ ${spot.name} → ${spot.name_ja ?? "(名前同一)"} [${spot.place_id}]`
    );
  }

  // 保存
  if (newSpots.length > 0 && !dryRun) {
    const dir = path.join(DIRECTORY_PATH, country);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const merged = [...existingSpots, ...newSpots];
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + "\n");
  }

  // レポート
  console.log(`\n--- 結果 ---`);
  console.log(`追加: ${newSpots.length}件${dryRun ? "（dry-run）" : ""}`);
  if (failed.length > 0) {
    console.log(`失敗: ${failed.length}件`);
    for (const name of failed) {
      console.log(`  ✗ ${name}`);
    }
  }

  // 成功したらキューファイルを処理済みに移動
  if (!dryRun && newSpots.length > 0) {
    const doneDir = path.join(QUEUE_PATH, country, "done");
    if (!fs.existsSync(doneDir)) fs.mkdirSync(doneDir, { recursive: true });
    const donePath = path.join(doneDir, `${category}-${TODAY}.json`);
    fs.renameSync(queueFile, donePath);
    console.log(`\nキューファイル → ${donePath} に移動`);
  }

  console.log(
    `\n次のステップ: AI検証（description, tags付与）→ validate-spots.ts 実行`
  );
}

main().catch(console.error);
