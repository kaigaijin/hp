/**
 * generate-details.ts
 *
 * Google AI Studio APIキーを使ってdetailが空または短いスポットのdetailを一括生成する。
 * Gemini 2.0 Flash（無料: 15 RPM / 1,500 RPD）でWeb検索して事実ベースで生成。
 *
 * detailはSpotDetailTabs.tsxの概要タブに表示される長め説明文（100〜250文字）。
 * descriptionはGoogleスニペット用の短文（60〜120文字）。
 *
 * 使い方:
 *   npx tsx scripts/generate-details.ts <country> [category] [options]
 *
 * 例:
 *   npx tsx scripts/generate-details.ts sg              # SG全カテゴリ
 *   npx tsx scripts/generate-details.ts sg restaurant   # SGレストランのみ
 *   npx tsx scripts/generate-details.ts sg --dry-run    # 確認のみ
 *   npx tsx scripts/generate-details.ts sg --limit 50   # 最大50件
 *   npx tsx scripts/generate-details.ts sg --force      # detail有りも上書き
 *
 * .envに GEMINI_API_KEY を設定しておけばオプション不要:
 *   npx tsx scripts/generate-details.ts sg
 */

import fs from "fs";
import path from "path";

// .envを読み込む
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.0-flash";
const RPM = 15;
const DELAY_MS = Math.ceil(60000 / RPM) + 500; // 4,500ms間隔

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const COUNTRY_NAME: Record<string, string> = {
  sg: "シンガポール", th: "タイ", my: "マレーシア", hk: "香港",
  tw: "台湾", kr: "韓国", vn: "ベトナム", au: "オーストラリア",
  ae: "UAE（ドバイ）", de: "ドイツ", gb: "イギリス", id: "インドネシア",
};

type SpotEntry = {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string | null;
  address?: string | null;
  website?: string | null;
  tags?: string[];
  description: string;
  detail?: string | null;
  [key: string]: unknown;
};

function buildPrompt(spot: SpotEntry, category: string, country: string): string {
  const websiteHint = spot.website ? `公式サイト: ${spot.website}` : "";
  return `以下のスポットについて、公式サイトやWebで調べてdetail（詳細説明文）を生成してください。

【スポット情報】
店名: ${spot.name}
日本語名: ${spot.name_ja || "不明"}
国: ${COUNTRY_NAME[country] || country}
エリア: ${spot.area || "不明"}
住所: ${spot.address || "不明"}
カテゴリ: ${category}
タグ: ${(spot.tags || []).join("・") || "なし"}
既存のdescription（短文）: ${spot.description || "なし"}
${websiteHint}

【生成ルール】
- 公式サイトやGoogle検索で実際の情報を調べてから書く
- 100〜250文字（厳守）
- descriptionより詳細な情報を書く（具体的なメニュー・サービス内容・特徴・価格帯・受賞歴等）
- 場所（ビル名・モール名・フロア・エリア名）を含める
- 日本人が実際に利用する際に役立つ実用的な情報（営業日・予約の必要性・注意点等）を入れる
- 事実のみ。推測・主観・「人気」「おすすめ」は禁止
- detailの文字列だけを返す（説明文・引用符・改行・前置き不要）`;
}

async function callGeminiAPI(prompt: string, retries = 3): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 400,
          },
        }),
      });

      if (res.status === 429) {
        console.log(`    レート制限。60秒待機中...`);
        await sleep(60000);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        console.log(`    APIエラー ${res.status}: ${err.slice(0, 100)}`);
        return null;
      }

      const data = await res.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) return null;

      // 引用符・余分なテキストを除去
      const cleaned = text
        .replace(/^["「『]|["」』]$/g, "")
        .split("\n")[0]
        .trim();

      if (cleaned.length >= 80 && cleaned.length <= 300) {
        return cleaned;
      }

      // 文字数範囲外の場合は最初の適切な長さの文を探す
      const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length >= 80 && l.length <= 300);
      return lines[0] || null;

    } catch (e) {
      if (attempt < retries - 1) await sleep(5000);
    }
  }
  return null;
}

async function processCategory(
  country: string,
  category: string,
  dryRun: boolean,
  force: boolean,
  limit: number
): Promise<{ updated: number; skipped: number; failed: number }> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) return { updated: 0, skipped: 0, failed: 0 };

  const spots: SpotEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // detailがない、または50文字未満のものを対象（forceの場合は全件）
  const targets = spots.filter(s => {
    const len = (s.detail || "").length;
    if (force) return true;
    return len < 80;
  });

  if (targets.length === 0) {
    return { updated: 0, skipped: spots.length, failed: 0 };
  }

  const toProcess = limit > 0 ? targets.slice(0, limit) : targets;
  console.log(`  ${country}/${category}: ${toProcess.length}件を処理（全${spots.length}件中）`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const spot = toProcess[i];
    const prompt = buildPrompt(spot, category, country);
    const detail = await callGeminiAPI(prompt);

    if (detail) {
      if (!dryRun) {
        spot.detail = detail;
      }
      updated++;
      console.log(`    ✓ [${detail.length}文字] ${spot.name}: ${detail.slice(0, 60)}...`);
    } else {
      failed++;
      console.log(`    ✗ 失敗: ${spot.name}`);
    }

    if (i < toProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  if (!dryRun && updated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(spots, null, 2), "utf-8");
    console.log(`  → 保存完了`);
  }

  return { updated, skipped: spots.length - toProcess.length, failed };
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error("エラー: GEMINI_API_KEY が設定されていません。.envに追加するか環境変数で渡してください。");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const positional = args.filter(a => !a.startsWith("--"));
  const countryArg = positional[0] || "all";
  const categoryArg = positional[1];
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 0;

  console.log(`generate-details 開始（Gemini API / ${MODEL}）`);
  console.log(`  対象: ${countryArg}${categoryArg ? "/" + categoryArg : ""}`);
  console.log(`  dry-run: ${dryRun}, force: ${force}, limit: ${limit || "無制限"}`);
  console.log(`  レート制限: ${RPM} RPM → ${DELAY_MS}ms間隔`);
  console.log("");

  const allCountries = fs.readdirSync(DIRECTORY_PATH).filter(d =>
    fs.statSync(path.join(DIRECTORY_PATH, d)).isDirectory()
  );
  const countries = countryArg === "all" ? allCountries : [countryArg];

  let totalUpdated = 0;
  let totalFailed = 0;
  let remaining = limit > 0 ? limit : Infinity;

  for (const country of countries) {
    const countryPath = path.join(DIRECTORY_PATH, country);
    if (!fs.existsSync(countryPath)) continue;

    const allCategories = fs.readdirSync(countryPath)
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));
    const categories = categoryArg ? [categoryArg] : allCategories;

    for (const category of categories) {
      if (remaining <= 0) break;
      const catLimit = limit > 0 ? Math.min(remaining, limit) : 0;
      const result = await processCategory(country, category, dryRun, force, catLimit);
      totalUpdated += result.updated;
      totalFailed += result.failed;
      if (limit > 0) remaining -= result.updated;
    }
  }

  console.log("");
  console.log("=== 完了 ===");
  console.log(`更新: ${totalUpdated}件 / 失敗: ${totalFailed}件`);
  if (dryRun) console.log("（dry-runのため実際の変更なし）");
}

main().catch(console.error);
