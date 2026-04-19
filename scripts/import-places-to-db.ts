/**
 * import-places-to-db.ts
 *
 * content/directory/ 配下の全JSONファイルを Supabase の places テーブルにインポートする。
 * 冪等（何度実行しても同じ結果）: country_code + category + slug でUPSERT。
 *
 * 使い方:
 *   npx tsx scripts/import-places-to-db.ts
 *   npx tsx scripts/import-places-to-db.ts --country sg
 *   npx tsx scripts/import-places-to-db.ts --country sg --category cafe
 *   npx tsx scripts/import-places-to-db.ts --dry-run   # DBに投入せずレポートのみ
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// --- 設定 ---
const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const BATCH_SIZE = 100;

// 引数パース
const args = process.argv.slice(2);
const countryFilter = args.includes("--country")
  ? args[args.indexOf("--country") + 1]
  : null;
const categoryFilter = args.includes("--category")
  ? args[args.indexOf("--category") + 1]
  : null;
const dryRun = args.includes("--dry-run");

// Supabase クライアント（service_role で RLS をバイパス）
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://itvobfrmbrtlisyojlqr.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey && !dryRun) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY が設定されていません。.env に追加してください。"
  );
  process.exit(1);
}

const supabase = dryRun
  ? null
  : createClient(supabaseUrl, supabaseKey as string);

// --- 型定義 ---
interface RawPlace {
  slug?: string;
  name?: string;
  name_ja?: string;
  name_local?: string;
  area?: string;
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  phone_local?: string;
  email?: string;
  email_ja?: string;
  email_local?: string;
  email_note?: string;
  website?: string;
  source_url?: string;
  description?: string;
  detail?: string;
  detail_menu?: string;
  tags?: string[];
  subcategory?: string;
  hours?: string;
  closed_days?: string;
  place_id?: string;
  rating?: number;
  user_rating_count?: number;
  price_level?: number;
  photo_name?: string;
  price?: string;
  price_range?: string;
  menu?: string[];
  menu_highlights?: string[];
  japanese_staff?: boolean;
  languages?: string[];
  status?: string;
  last_verified?: string;
  source?: string;
  ai_reviewed?: boolean;
  place_reviewed?: boolean;
  priority?: number;
  verified?: boolean;
  needs_review?: boolean;
  review_note?: string;
  slug_display?: string;
  _delete?: boolean;
  // 無視するフィールド（旧フォーマット等）
  closed?: unknown;
  category?: unknown;
  country?: unknown;
}

interface PlaceRecord {
  country_code: string;
  category: string;
  slug: string;
  name: string;
  name_ja: string | null;
  name_local: string | null;
  area: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  phone_local: string | null;
  email: string | null;
  email_ja: string | null;
  email_local: string | null;
  email_note: string | null;
  website: string | null;
  source_url: string | null;
  description: string | null;
  detail: string | null;
  detail_menu: string | null;
  tags: string[];
  subcategory: string | null;
  hours: string | null;
  closed_days: string | null;
  place_id: string | null;
  rating: number | null;
  user_rating_count: number | null;
  price_level: number | null;
  photo_name: string | null;
  price: string | null;
  price_range: string | null;
  menu: string[] | null;
  menu_highlights: string[] | null;
  japanese_staff: boolean | null;
  languages: string[] | null;
  status: string;
  last_verified: string | null;
  source: string | null;
  ai_reviewed: boolean;
  place_reviewed: boolean;
  priority: number;
  verified: boolean;
  needs_review: boolean;
  review_note: string | null;
  slug_display: string | null;
}

// --- ヘルパー ---

function toNullableString(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "string") return v;
  return String(v);
}

function toNullableNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function toNullableBool(v: unknown): boolean | null {
  if (v === undefined || v === null) return null;
  return Boolean(v);
}

function toStringArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function toNullableStringArray(v: unknown): string[] | null {
  if (!v) return null;
  if (Array.isArray(v) && v.length === 0) return null;
  if (Array.isArray(v)) return v.map(String);
  return null;
}

/**
 * JSONのRawPlaceをDBレコードに変換する
 */
function toRecord(
  raw: RawPlace,
  countryCode: string,
  category: string
): PlaceRecord | null {
  // _delete フラグがある場合はスキップ
  if (raw._delete === true) return null;

  const slug = toNullableString(raw.slug);
  const name = toNullableString(raw.name);

  if (!slug || !name) return null;

  // place_id が空文字列の場合はNULL
  const placeId = toNullableString(raw.place_id);

  return {
    country_code: countryCode,
    category: category,
    slug: slug,
    name: name,
    name_ja: toNullableString(raw.name_ja),
    name_local: toNullableString(raw.name_local),
    area: toNullableString(raw.area),
    city: toNullableString(raw.city),
    address: toNullableString(raw.address),
    lat: toNullableNumber(raw.lat),
    lng: toNullableNumber(raw.lng),
    phone: toNullableString(raw.phone),
    phone_local: toNullableString(raw.phone_local),
    email: toNullableString(raw.email),
    email_ja: toNullableString(raw.email_ja),
    email_local: toNullableString(raw.email_local),
    email_note: toNullableString(raw.email_note),
    website: toNullableString(raw.website),
    source_url: toNullableString(raw.source_url),
    description: toNullableString(raw.description),
    detail: toNullableString(raw.detail),
    detail_menu: toNullableString(raw.detail_menu),
    tags: toStringArray(raw.tags),
    subcategory: toNullableString(raw.subcategory),
    hours: toNullableString(raw.hours),
    closed_days: toNullableString(raw.closed_days),
    place_id: placeId,
    rating: toNullableNumber(raw.rating),
    user_rating_count: toNullableNumber(raw.user_rating_count),
    price_level: toNullableNumber(raw.price_level),
    photo_name: toNullableString(raw.photo_name),
    price: toNullableString(raw.price),
    price_range: toNullableString(raw.price_range),
    menu: toNullableStringArray(raw.menu),
    menu_highlights: toNullableStringArray(raw.menu_highlights),
    japanese_staff: toNullableBool(raw.japanese_staff),
    languages: toNullableStringArray(raw.languages),
    status: toNullableString(raw.status) ?? "unverified",
    last_verified: toNullableString(raw.last_verified),
    source: toNullableString(raw.source),
    ai_reviewed: raw.ai_reviewed === true,
    place_reviewed: raw.place_reviewed === true,
    priority: raw.priority ?? 0,
    verified: raw.verified === true,
    needs_review: raw.needs_review === true,
    review_note: toNullableString(raw.review_note),
    slug_display: toNullableString(raw.slug_display),
  };
}

// --- メイン処理 ---

async function main() {
  console.log("=== Kaigaijin プレイスデータ Supabase インポート ===");
  if (dryRun) console.log("[DRY RUN] DBには投入しません");
  if (countryFilter) console.log(`フィルタ: 国=${countryFilter}`);
  if (categoryFilter) console.log(`フィルタ: カテゴリ=${categoryFilter}`);
  console.log("");

  let totalProcessed = 0;
  let totalUpserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const errorLog: string[] = [];

  // content/directory/ 配下の全国ディレクトリを走査
  const countries = fs
    .readdirSync(DIRECTORY_PATH)
    .filter((d) =>
      fs.statSync(path.join(DIRECTORY_PATH, d)).isDirectory()
    )
    .filter((d) => !countryFilter || d === countryFilter)
    .sort();

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_PATH, country);
    const jsonFiles = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .filter((f) => !categoryFilter || f === `${categoryFilter}.json`)
      .sort();

    for (const jsonFile of jsonFiles) {
      const category = jsonFile.replace(".json", "");
      const filePath = path.join(countryDir, jsonFile);

      let rawData: RawPlace[];
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        rawData = JSON.parse(content);
      } catch (e) {
        console.error(`❌ JSON読み込みエラー: ${country}/${jsonFile}: ${e}`);
        errorLog.push(`JSON読み込みエラー: ${country}/${jsonFile}`);
        totalErrors++;
        continue;
      }

      if (!Array.isArray(rawData)) {
        console.error(
          `❌ 配列でないJSON: ${country}/${jsonFile} (スキップ)`
        );
        errorLog.push(`配列でないJSON: ${country}/${jsonFile}`);
        totalErrors++;
        continue;
      }

      // レコード変換
      const records: PlaceRecord[] = [];
      let fileSkipped = 0;

      for (const raw of rawData) {
        totalProcessed++;
        const record = toRecord(raw, country, category);
        if (!record) {
          fileSkipped++;
          totalSkipped++;
          continue;
        }
        records.push(record);
      }

      if (records.length === 0) {
        console.log(
          `  ${country}/${category}: 0件 (スキップ${fileSkipped > 0 ? ` /_delete:${fileSkipped}` : ""})`
        );
        continue;
      }

      if (dryRun) {
        console.log(
          `  [DRY] ${country}/${category}: ${records.length}件 (スキップ${fileSkipped})`
        );
        totalUpserted += records.length;
        continue;
      }

      // バッチUPSERT
      let fileUpserted = 0;
      let fileErrors = 0;

      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error } = await supabase!
          .from("places")
          .upsert(batch, {
            onConflict: "country_code,category,slug",
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(
            `  ❌ UPSERT エラー ${country}/${category} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
          );
          errorLog.push(
            `UPSERT エラー ${country}/${category} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
          );
          fileErrors += batch.length;
          totalErrors += batch.length;

          // 1件ずつ再試行してエラーレコードを特定
          for (const record of batch) {
            const { error: singleErr } = await supabase!
              .from("places")
              .upsert([record], {
                onConflict: "country_code,category,slug",
                ignoreDuplicates: false,
              });
            if (singleErr) {
              const msg = `スキップ: ${country}/${category}/${record.slug}: ${singleErr.message}`;
              errorLog.push(msg);
              fileErrors++;
              totalErrors++;
            } else {
              fileUpserted++;
              totalUpserted++;
            }
          }
        } else {
          fileUpserted += batch.length;
          totalUpserted += batch.length;
        }
      }

      console.log(
        `  ✅ ${country}/${category}: ${fileUpserted}件 投入完了${fileSkipped > 0 ? ` (スキップ${fileSkipped})` : ""}${fileErrors > 0 ? ` (エラー${fileErrors})` : ""}`
      );
    }
  }

  // サマリー
  console.log("");
  console.log("=== インポート完了 ===");
  console.log(`処理対象: ${totalProcessed}件`);
  console.log(`投入成功: ${totalUpserted}件`);
  console.log(`スキップ(_delete等): ${totalSkipped}件`);
  console.log(`エラー: ${totalErrors}件`);

  if (errorLog.length > 0) {
    console.log("");
    console.log("=== エラーログ ===");
    errorLog.forEach((e) => console.log(`  - ${e}`));
  }

  // DB件数確認
  if (!dryRun && supabase) {
    console.log("");
    console.log("=== DB件数確認 ===");
    const { count, error } = await supabase
      .from("places")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(`件数取得エラー: ${error.message}`);
    } else {
      console.log(`places テーブル総件数: ${count}件`);
    }
  }
}

main().catch((e) => {
  console.error("予期しないエラー:", e);
  process.exit(1);
});
