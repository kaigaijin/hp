/**
 * generate-descriptions.ts
 *
 * Google AI Studio APIキーを使ってdescriptionが空または短いスポットのdescriptionを一括生成する。
 * Gemini 1.5 Flash-Lite（無料: 15 RPM / 1,000 RPD）でWeb検索して事実ベースで生成。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts <country> [category] [options]
 *
 * 例:
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts sg              # SG全カテゴリ
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts sg restaurant   # SGレストランのみ
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts all             # 全国全カテゴリ
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts sg --dry-run    # 確認のみ
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts sg --force      # 120文字超も対象
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-descriptions.ts sg --limit 50   # 最大50件
 *
 * .envに GEMINI_API_KEY を設定しておけばオプション不要:
 *   npx tsx scripts/generate-descriptions.ts sg
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
const MODEL = "gemini-2.0-flash"; // 15 RPM / 1,500 RPD（無料）
const RPM = 15;
const DELAY_MS = Math.ceil(60000 / RPM) + 500; // 4,500ms間隔（15 RPM対応）

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const COUNTRY_NAME: Record<string, string> = {
  sg: "シンガポール", th: "タイ", my: "マレーシア", hk: "香港",
  tw: "台湾", kr: "韓国", vn: "ベトナム", au: "オーストラリア",
  ae: "UAE（ドバイ）", de: "ドイツ", gb: "イギリス", id: "インドネシア",
};

type placeEntry = {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string | null;
  address?: string | null;
  website?: string | null;
  tags?: string[];
  description: string;
  [key: string]: unknown;
};

function buildPrompt(place: placeEntry, category: string, country: string): string {
  const websiteHint = place.website ? `公式サイト: ${place.website}` : "";
  return `以下のスポットについて、公式サイトやWebで調べてdescriptionを生成してください。

【スポット情報】
店名: ${place.name}
日本語名: ${place.name_ja || "不明"}
国: ${COUNTRY_NAME[country] || country}
エリア: ${place.area || "不明"}
住所: ${place.address || "不明"}
カテゴリ: ${category}
タグ: ${(place.tags || []).join("・") || "なし"}
${websiteHint}

【生成ルール】
- 公式サイトやGoogle検索で実際の情報を調べてから書く
- 60〜120文字（厳守）
- 1文目: 日本人向けの根拠を必ず入れる（日本語対応・日本人経営・日本食・日系ブランド等）
- 2文目以降: 場所（駅名・地区名・商業施設名）と具体的な特徴（メニュー・実績・サービス内容等）
- 事実のみ。推測・主観・「人気」「おすすめ」は禁止
- descriptionの文字列だけを返す（説明文・引用符・改行・前置き不要）`;
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
          tools: [{ google_search: {} }], // Web検索ツールを有効化
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        }),
      });

      if (res.status === 429) {
        // レート制限: 60秒待ってリトライ
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

      if (cleaned.length >= 60 && cleaned.length <= 120) {
        return cleaned;
      }

      // 文字数範囲外の場合は最初の適切な長さの文を探す
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length >= 60 && l.length <= 120);
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

  const places: placeEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const targets = places.filter(s => {
    const len = (s.description || "").length;
    if (force) return len < 60 || len > 120;
    return len < 60;
  });

  if (targets.length === 0) {
    return { updated: 0, skipped: places.length, failed: 0 };
  }

  const toProcess = limit > 0 ? targets.slice(0, limit) : targets;
  console.log(`  ${country}/${category}: ${toProcess.length}件を処理（全${places.length}件中）`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const place = toProcess[i];
    const prompt = buildPrompt(place, category, country);
    const desc = await callGeminiAPI(prompt);

    if (desc) {
      if (!dryRun) {
        place.description = desc;
      }
      updated++;
      console.log(`    ✓ [${desc.length}文字] ${place.name}: ${desc}`);
    } else {
      failed++;
      console.log(`    ✗ 失敗: ${place.name}`);
    }

    // 最後の1件以外は待機
    if (i < toProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  if (!dryRun && updated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(places, null, 2), "utf-8");
    console.log(`  → 保存完了`);
  }

  return { updated, skipped: places.length - toProcess.length, failed };
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

  console.log(`generate-descriptions 開始（Gemini API / ${MODEL}）`);
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
