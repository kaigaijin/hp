/**
 * AIが推測で当てた漢字name_jaを安全なカタカナ音写に修正するスクリプト
 *
 * 対象: ai_reviewed: true のスポットで、name_jaに漢字が含まれるもの
 * 処理: name_ja を null にリセット（英語名がそのまま表示される）
 *
 * 理由:
 * - AIが英語名から漢字を推測すると間違いが多い（例: Shoukouwa → 翔くわ、実際は小康和）
 * - 同じブランドで異なる漢字が割り当てられるケースも発見（Kampachi → 甘八/勘八/寒八）
 * - カタカナ音写は常に正しいが、自動変換の精度が保証できないため null にする
 * - 英語名がそのまま表示される方が、間違った漢字より安全
 *
 * 実行: npx tsx scripts/fix-guessed-kanji.ts [--dry-run] [--country sg]
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const countryArg = args.find((a) => a.startsWith("--country"))
  ? args[args.indexOf("--country") + 1]
  : null;

const directoryPath = path.join(process.cwd(), "content/directory");

// 漢字を含むかチェック（CJK統合漢字 + CJK統合漢字拡張A/B）
function containsKanji(str: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(str);
}

// カタカナのみかチェック
function isOnlyKatakana(str: string): boolean {
  // カタカナ、長音記号、中点、スペース、数字、英字のみ
  return /^[\u30a0-\u30ff\u30fc・\s\d\w\-&.,'()]+$/.test(str);
}

// ひらがなのみかチェック
function isOnlyHiragana(str: string): boolean {
  return /^[\u3040-\u309f\s]+$/.test(str);
}

type Spot = {
  slug: string;
  name: string;
  name_ja: string | null;
  ai_reviewed?: boolean;
  [key: string]: unknown;
};

let totalFixed = 0;
let totalSkipped = 0;
let totalFiles = 0;

const countries = countryArg
  ? [countryArg]
  : fs.readdirSync(directoryPath).filter((d) =>
      fs.statSync(path.join(directoryPath, d)).isDirectory()
    );

for (const country of countries) {
  const countryDir = path.join(directoryPath, country);
  if (!fs.existsSync(countryDir)) continue;

  const jsonFiles = fs.readdirSync(countryDir).filter((f) => f.endsWith(".json"));

  for (const file of jsonFiles) {
    const filePath = path.join(countryDir, file);
    const data: Spot[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let modified = false;
    let fileFixed = 0;

    for (const spot of data) {
      if (!spot.name_ja) continue;
      if (!spot.ai_reviewed) continue;

      // カタカナのみ or ひらがなのみ → 安全、スキップ
      if (isOnlyKatakana(spot.name_ja) || isOnlyHiragana(spot.name_ja)) {
        totalSkipped++;
        continue;
      }

      // 英語名(name)自体に日本語文字が含まれる → 店自身が日本語名を公式使用 → 保持
      if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(spot.name)) {
        totalSkipped++;
        continue;
      }

      // 漢字が1文字だけ（例: 「ほぼ屋」の「屋」）→ 接尾辞的な使い方で正しい可能性が高い → 保持
      const kanjiCount = (spot.name_ja.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
      const totalLen = spot.name_ja.replace(/[\s\-・]/g, "").length;
      if (kanjiCount <= 1 && totalLen >= 3) {
        totalSkipped++;
        continue;
      }

      // name_jaの漢字部分が英語名の音写として妥当かチェック
      // 漢字を含む → AIが推測した可能性がある → null にリセット
      if (containsKanji(spot.name_ja)) {
        if (dryRun) {
          console.log(`[${country}/${file}] ${spot.slug}: "${spot.name_ja}" → null (was: ${spot.name})`);
        }
        spot.name_ja = null;
        modified = true;
        fileFixed++;
        totalFixed++;
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    }

    if (fileFixed > 0) {
      totalFiles++;
      console.log(`${country}/${file}: ${fileFixed}件修正`);
    }
  }
}

console.log(`\n=== 結果 ===`);
console.log(`修正: ${totalFixed}件`);
console.log(`スキップ（カタカナ/ひらがなのみ）: ${totalSkipped}件`);
console.log(`対象ファイル: ${totalFiles}件`);
if (dryRun) console.log("(dry-run: 実際のファイル変更なし)");
