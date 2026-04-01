/**
 * migrate-spot-fields.ts
 *
 * 既存スポットJSONに新フィールドを追加するマイグレーション。
 * フィールドが存在しない場合のみ null で初期化する（上書きしない）。
 *
 * 追加フィールド:
 *   - phone_local      現地形式の電話番号（null）
 *   - email            メールアドレス（null、表示しない・連絡用）
 *   - rating           Googleレーティング（null、表示しない）
 *   - user_rating_count 口コミ数（null、表示しない）
 *   - price_level      価格帯（null、表示しない）
 *   - photo_name       Googleフォト参照キー（null、表示しない）
 *
 * 使い方:
 *   npx tsx scripts/migrate-spot-fields.ts [--dry-run]
 */

import fs from "fs";
import path from "path";

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const dryRun = process.argv.includes("--dry-run");

// 追加する新フィールドとデフォルト値
const NEW_FIELDS: Record<string, null> = {
  phone_local: null,
  email: null,
  rating: null,
  user_rating_count: null,
  price_level: null,
  photo_name: null,
};

function migrateSpot(spot: Record<string, unknown>): { spot: Record<string, unknown>; changed: boolean } {
  let changed = false;
  for (const [key, defaultVal] of Object.entries(NEW_FIELDS)) {
    if (!(key in spot)) {
      spot[key] = defaultVal;
      changed = true;
    }
  }
  return { spot, changed };
}

let totalFiles = 0;
let totalSpots = 0;
let totalChanged = 0;

const countries = fs.readdirSync(DIRECTORY_PATH).filter((d) =>
  fs.statSync(path.join(DIRECTORY_PATH, d)).isDirectory()
);

for (const country of countries.sort()) {
  const countryDir = path.join(DIRECTORY_PATH, country);
  const files = fs.readdirSync(countryDir).filter((f) => f.endsWith(".json")).sort();

  let countryChanged = 0;

  for (const file of files) {
    const filePath = path.join(countryDir, file);
    const spots: Record<string, unknown>[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let fileChanged = false;

    const migrated = spots.map((spot) => {
      const { spot: s, changed } = migrateSpot(spot);
      if (changed) {
        fileChanged = true;
        totalChanged++;
      }
      totalSpots++;
      return s;
    });

    if (fileChanged) {
      countryChanged++;
      if (!dryRun) {
        fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2) + "\n");
      }
    }
    totalFiles++;
  }

  if (countryChanged > 0) {
    console.log(`${country.toUpperCase()}: ${countryChanged}ファイル更新`);
  }
}

console.log(`\n=== ${dryRun ? "dry-run 完了" : "マイグレーション完了"} ===`);
console.log(`対象: ${totalFiles}ファイル / ${totalSpots}件`);
console.log(`更新: ${totalChanged}件${dryRun ? "（dry-run、実際には書き込み未実施）" : ""}`);
