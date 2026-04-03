/**
 * enrich-menu.ts
 *
 * TH飲食スポットの公式サイトからメニュー・価格情報を取得して
 * menu / price_range / detail フィールドを追加する。
 *
 * 対象: website が facebook/instagram 以外のスポット（menu未設定のもの）
 *
 * 使い方:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-menu.ts th restaurant [--limit N] [--dry-run]
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-menu.ts th cafe
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-menu.ts th izakaya-bar
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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DELAY_MS = 2000; // 2秒間隔
const FETCH_TIMEOUT_MS = 20000; // 20秒タイムアウト

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type MenuItem = {
  name: string;
  price: string;
  category: string;
};

type SpotEntry = {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string | null;
  address?: string | null;
  website?: string | null;
  description?: string;
  detail?: string | null;
  menu?: MenuItem[] | null;
  price_range?: string | null;
  tags?: string[];
  [key: string]: unknown;
};

type EnrichResult = {
  menu: MenuItem[];
  price_range: string;
  detail: string;
};

// Webページを取得してテキストに変換
async function fetchWebPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // HTMLタグを除去して基本テキストを抽出
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#[0-9]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 最大8000文字に制限
    return text.slice(0, 8000);
  } catch {
    return null;
  }
}

// Anthropic APIでメニュー情報を抽出
async function extractMenuInfo(
  spot: SpotEntry,
  pageText: string,
  category: string
): Promise<EnrichResult | null> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const prompt = `以下のレストラン/カフェ/バーの公式サイトコンテンツから、日本語で情報を抽出してください。

【スポット情報】
店名: ${spot.name}
日本語名: ${spot.name_ja || "不明"}
エリア: ${spot.area || "不明"}
カテゴリ: ${category}
説明: ${spot.description || "なし"}

【公式サイトコンテンツ（${spot.website}）】
${pageText}

【抽出してください】
以下のJSONフォーマットで返してください。取得できない場合は空配列/空文字列にしてください。

{
  "menu": [
    { "name": "メニュー名（日本語可）", "price": "THB XX", "category": "カテゴリ（ランチ/ディナー/ドリンク/セット等）" }
  ],
  "price_range": "THB XXX〜XXX/人",
  "detail": "300〜500文字の詳細説明（日本人向けの根拠+場所+メニューの特徴+価格帯+雰囲気。公式サイトで確認できた事実のみ。推測・主観禁止）"
}

【ルール】
- menuは代表的なものを5〜15件。価格が確認できるものだけ。価格不明は入れない
- price_rangeは1人あたりの目安（例: "THB 300〜600/人"）。算出できない場合は空文字
- detailはスポットの説明（description）とは別の詳細情報。既にdescriptionに書いてある内容は繰り返さない
- JSONのみ返す（前置き・説明・マークダウンコードブロック不要）`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  API error ${res.status}: ${err.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data.content[0]?.text || "";

    // JSONを抽出（コードブロックがある場合も対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]) as EnrichResult;
    return result;
  } catch (e) {
    console.error(`  抽出エラー: ${e}`);
    return null;
  }
}

async function processFile(country: string, category: string, opts: {
  limit?: number;
  dryRun?: boolean;
}) {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`ファイルが見つかりません: ${filePath}`);
    return;
  }

  const spots: SpotEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // 対象: websiteあり（facebook/instagram以外）、menuが未設定
  const targets = spots.filter(s =>
    s.website &&
    !s.website.includes("facebook") &&
    !s.website.includes("instagram") &&
    (!s.menu || s.menu.length === 0) &&
    !s.detail
  );

  const limit = opts.limit ?? targets.length;
  const toProcess = targets.slice(0, limit);

  console.log(`\n=== ${category}.json ===`);
  console.log(`全スポット: ${spots.length}件`);
  console.log(`対象（website有・menu未設定）: ${targets.length}件`);
  console.log(`処理予定: ${toProcess.length}件`);
  if (opts.dryRun) {
    console.log("[DRY RUN] 実際の処理はしません");
    return;
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const spot = toProcess[i];
    console.log(`\n[${i + 1}/${toProcess.length}] ${spot.name} (${spot.slug})`);
    console.log(`  URL: ${spot.website}`);

    // ウェブページを取得
    const pageText = await fetchWebPage(spot.website!);
    if (!pageText || pageText.length < 100) {
      console.log(`  → スキップ（ページ取得失敗または内容なし）`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }
    console.log(`  → ページ取得成功（${pageText.length}文字）`);

    // メニュー情報を抽出
    const result = await extractMenuInfo(spot, pageText, category);
    if (!result) {
      console.log(`  → スキップ（情報抽出失敗）`);
      failed++;
      await sleep(DELAY_MS);
      continue;
    }

    // 有効な情報があるか確認
    const hasMenu = result.menu && result.menu.length > 0;
    const hasPriceRange = result.price_range && result.price_range.length > 0;
    const hasDetail = result.detail && result.detail.length > 50;

    if (!hasMenu && !hasPriceRange && !hasDetail) {
      console.log(`  → スキップ（有効な情報なし）`);
      skipped++;
      await sleep(DELAY_MS);
      continue;
    }

    // スポットデータを更新
    const idx = spots.findIndex(s => s.slug === spot.slug);
    if (idx !== -1) {
      if (hasMenu) {
        spots[idx].menu = result.menu;
        console.log(`  → menu: ${result.menu.length}件`);
      }
      if (hasPriceRange) {
        spots[idx].price_range = result.price_range;
        console.log(`  → price_range: ${result.price_range}`);
      }
      if (hasDetail) {
        spots[idx].detail = result.detail;
        console.log(`  → detail: ${result.detail.slice(0, 50)}...`);
      }
      success++;
    }

    // 5件ごとに保存
    if ((i + 1) % 5 === 0 || i === toProcess.length - 1) {
      fs.writeFileSync(filePath, JSON.stringify(spots, null, 2), "utf-8");
      console.log(`  [保存] ${filePath} (${i + 1}件処理済み)`);
    }

    await sleep(DELAY_MS);
  }

  // 最終保存
  fs.writeFileSync(filePath, JSON.stringify(spots, null, 2), "utf-8");

  console.log(`\n=== ${category} 完了 ===`);
  console.log(`成功: ${success}件`);
  console.log(`スキップ（取得失敗）: ${skipped}件`);
  console.log(`スキップ（API失敗）: ${failed}件`);
}

// メイン処理
const args = process.argv.slice(2);
const country = args[0] || "th";
const category = args[1];
const dryRun = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : undefined;

if (!ANTHROPIC_API_KEY) {
  console.error("エラー: ANTHROPIC_API_KEY が設定されていません");
  console.error("使い方: ANTHROPIC_API_KEY=xxx npx tsx scripts/enrich-menu.ts th restaurant");
  process.exit(1);
}

const CATEGORIES = ["restaurant", "cafe", "izakaya-bar"];
const targetCategories = category ? [category] : CATEGORIES;

(async () => {
  for (const cat of targetCategories) {
    await processFile(country, cat, { limit, dryRun });
  }
  console.log("\n全処理完了");
})();
