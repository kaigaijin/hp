/**
 * enrich-places-latlng.ts
 *
 * Supabase の places テーブルから lat/lng が null のプレイスを取得し、
 * Google Places API (Text Search) で座標・place_id・電話番号・営業時間等を補完する。
 *
 * 使い方:
 *   npx tsx scripts/enrich-places-latlng.ts --limit 4000
 *   npx tsx scripts/enrich-places-latlng.ts --country sg --limit 500
 *   npx tsx scripts/enrich-places-latlng.ts --limit 100 --dry-run
 */

import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// .env / .env.local 読み込み
for (const name of [".env", ".env.local"]) {
  const envPath = path.resolve(__dirname, `../${name}`);
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^([^#\s][^=]*)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  }
}

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://itvobfrmbrtlisyojlqr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DELAY_MS = 300;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);

const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: "1",
  PRICE_LEVEL_INEXPENSIVE: "1",
  PRICE_LEVEL_MODERATE: "2",
  PRICE_LEVEL_EXPENSIVE: "3",
  PRICE_LEVEL_VERY_EXPENSIVE: "4",
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.location",
  "places.priceLevel",
  "places.photos",
].join(",");

interface PlaceResult {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { weekdayDescriptions?: string[] };
  location?: { latitude: number; longitude: number };
  priceLevel?: string;
  photos?: { name: string }[];
  rating?: number;
  userRatingCount?: number;
}

type PlaceRow = {
  id: number;
  slug: string;
  name: string;
  name_ja: string | null;
  country_code: string;
  category: string;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  place_id: string | null;
};

async function searchPlace(name: string, area: string | null, countryCode: string): Promise<PlaceResult | null> {
  const query = area ? `${name} ${area}` : name;
  const url = "https://places.googleapis.com/v1/places:searchText";

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 3,
    languageCode: "ja",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`  ✗ API Error (${res.status}): ${errText.slice(0, 200)}`);
    return null;
  }

  const data = (await res.json()) as { places?: PlaceResult[] };
  return (data.places ?? [])[0] ?? null;
}

function buildUpdateData(row: PlaceRow, api: PlaceResult): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if (api.location?.latitude && !row.lat) {
    update.lat = Math.round(api.location.latitude * 10000) / 10000;
  }
  if (api.location?.longitude && !row.lng) {
    update.lng = Math.round(api.location.longitude * 10000) / 10000;
  }

  if (!row.place_id && api.id) {
    update.place_id = api.id;
  }

  if (!row.phone && api.internationalPhoneNumber) {
    update.phone = api.internationalPhoneNumber.replace(/[\s-]/g, "");
  }

  if (!row.address && api.formattedAddress) {
    update.address = api.formattedAddress;
  }

  if (!row.website && api.websiteUri) {
    update.website = api.websiteUri;
  }

  if (!row.hours) {
    const weekdays =
      api.currentOpeningHours?.weekdayDescriptions ??
      api.regularOpeningHours?.weekdayDescriptions;
    if (weekdays) {
      update.hours = weekdays.join(" / ");
    }
  }

  const jaName = api.displayName?.text ?? null;
  if (!row.name_ja && jaName && jaName !== row.name) {
    update.name_ja = jaName;
  }

  update.last_verified = TODAY;

  return update;
}

async function main() {
  if (!GOOGLE_API_KEY) { console.error("GOOGLE_PLACES_API_KEY が未設定。.env に追加するか環境変数で渡してください"); process.exit(1); }
  if (!SUPABASE_KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY が未設定"); process.exit(1); }

  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const countryArg = get("--country");
  const limit = parseInt(get("--limit") ?? "4000");
  const dryRun = args.includes("--dry-run");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Supabaseは1リクエスト最大1000件のため、ページネーションで取得
  const PAGE_SIZE = 1000;
  const places: PlaceRow[] = [];
  let offset = 0;
  while (places.length < limit) {
    const fetchSize = Math.min(PAGE_SIZE, limit - places.length);
    let query = supabase
      .from("places")
      .select("id,slug,name,name_ja,country_code,category,area,address,lat,lng,phone,website,hours,place_id")
      .is("lat", null)
      .order("id")
      .range(offset, offset + fetchSize - 1);

    if (countryArg) {
      query = query.eq("country_code", countryArg);
    }

    const { data, error } = await query;
    if (error) { console.error("取得エラー:", error); process.exit(1); }
    if (!data || data.length === 0) break;
    places.push(...data);
    offset += data.length;
    if (data.length < fetchSize) break;
  }

  console.log(`enrich-places-latlng 開始`);
  console.log(`  対象: ${places.length}件 | limit: ${limit} | country: ${countryArg ?? "all"} | dry-run: ${dryRun}`);
  console.log(`  API: Places Text Search (Pro SKU)\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < places.length; i++) {
    const row = places[i];

    const apiResult = await searchPlace(row.name, row.area, row.country_code);
    await sleep(DELAY_MS);

    if (!apiResult) {
      console.log(`  ✗ [${i + 1}/${places.length}] ${row.name} (${row.country_code}) — API検索失敗`);
      failed++;
      continue;
    }

    const updateData = buildUpdateData(row, apiResult);

    if (Object.keys(updateData).length <= 1) {
      // last_verified しかない = 実質更新なし
      console.log(`  - [${i + 1}/${places.length}] ${row.name} — 更新データなし`);
      failed++;
      continue;
    }

    if (!dryRun) {
      let upErr = null;
      for (let retry = 0; retry < 3; retry++) {
        const { error: err } = await supabase
          .from("places")
          .update(updateData)
          .eq("id", row.id);
        upErr = err;
        if (!err) break;
        console.log(`  ⟳ DB更新リトライ ${retry + 1}/3: ${row.name}`);
        await sleep(5000);
      }
      if (upErr) {
        console.log(`  ✗ DB更新エラー: ${row.name}: ${upErr.message}`);
        failed++;
        continue;
      }
    }

    const lat = updateData.lat ?? row.lat;
    const lng = updateData.lng ?? row.lng;
    console.log(`  ✓ [${i + 1}/${places.length}] ${row.name} (${row.country_code}) → lat:${lat}, lng:${lng}${updateData.place_id ? `, pid:${(updateData.place_id as string).slice(0, 20)}...` : ""}`);
    updated++;

    if (i % 100 === 99) {
      console.log(`\n  --- 進捗: ${i + 1}/${places.length} (成功:${updated} 失敗:${failed}) ---\n`);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新: ${updated} / 失敗: ${failed} / 全体: ${places.length}`);
  if (dryRun) console.log("（dry-run のため DB 変更なし）");
}

main().catch(console.error);
