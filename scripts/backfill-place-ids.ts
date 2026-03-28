// 既存スポットにGoogle Places APIのplace_idを付与するスクリプト
// 使い方: GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/backfill-place-ids.ts [country] [category]
// 例: GOOGLE_PLACES_API_KEY=xxx npx tsx scripts/backfill-place-ids.ts sg restaurant

import fs from "fs";
import path from "path";
import { GOOGLE_API_KEY, type SpotEntry } from "./places-config.js";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");

// レート制限（Places API: 600 QPM）
const DELAY_MS = 150;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ExistingSpot {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string;
  address?: string;
  place_id?: string;
  [key: string]: unknown;
}

// Find Place from Text API（New）でplace_idを検索
async function findPlaceId(
  name: string,
  address: string,
  country: string
): Promise<string | null> {
  const query = `${name} ${address}`;
  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  API Error (${res.status}): ${errText}`);
      return null;
    }

    const data = (await res.json()) as {
      places?: { id: string; displayName?: { text: string }; formattedAddress?: string }[];
    };
    if (data.places && data.places.length > 0) {
      return data.places[0].id;
    }
    return null;
  } catch (err) {
    console.error(`  Fetch error: ${err}`);
    return null;
  }
}

async function backfillCategory(country: string, category: string) {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`ファイルなし: ${filePath}`);
    return { total: 0, updated: 0, skipped: 0, notFound: 0 };
  }

  const spots: ExistingSpot[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const spot of spots) {
    if (spot.place_id) {
      skipped++;
      continue;
    }

    const placeId = await findPlaceId(
      spot.name_ja || spot.name,
      spot.address || "",
      country
    );

    if (placeId) {
      spot.place_id = placeId;
      updated++;
      console.log(`  ✓ ${spot.name} → ${placeId}`);
    } else {
      notFound++;
      console.log(`  ✗ ${spot.name}（見つからず）`);
    }

    await sleep(DELAY_MS);
  }

  // 更新があれば保存
  if (updated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(spots, null, 2) + "\n");
  }

  return { total: spots.length, updated, skipped, notFound };
}

async function main() {
  const args = process.argv.slice(2);
  const targetCountry = args[0];
  const targetCategory = args[1];

  if (!targetCountry) {
    console.error("使い方: npx tsx scripts/backfill-place-ids.ts <country> [category]");
    console.error("例: npx tsx scripts/backfill-place-ids.ts sg restaurant");
    process.exit(1);
  }

  const countryDir = path.join(DIRECTORY_PATH, targetCountry);
  if (!fs.existsSync(countryDir)) {
    console.error(`ディレクトリなし: ${countryDir}`);
    process.exit(1);
  }

  // 対象カテゴリを決定
  let categories: string[];
  if (targetCategory) {
    categories = [targetCategory];
  } else {
    categories = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  }

  console.log(`\n=== place_id付与: ${targetCountry} ===\n`);

  let totalStats = { total: 0, updated: 0, skipped: 0, notFound: 0 };

  for (const cat of categories) {
    console.log(`\n[${cat}]`);
    const stats = await backfillCategory(targetCountry, cat);
    console.log(
      `  合計: ${stats.total}件 / 更新: ${stats.updated} / スキップ: ${stats.skipped} / 未発見: ${stats.notFound}`
    );
    totalStats.total += stats.total;
    totalStats.updated += stats.updated;
    totalStats.skipped += stats.skipped;
    totalStats.notFound += stats.notFound;
  }

  console.log(`\n=== 完了 ===`);
  console.log(
    `合計: ${totalStats.total}件 / 更新: ${totalStats.updated} / スキップ: ${totalStats.skipped} / 未発見: ${totalStats.notFound}`
  );
}

main().catch(console.error);
