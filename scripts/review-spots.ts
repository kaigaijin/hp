/**
 * review-spots.ts
 *
 * Claude APIを使ってスポットの以下を一括処理する:
 *   1. 日本人向けか判定（最優先）
 *      - 日本人/日本語スタッフあり           → japanese_staff: true
 *      - Japanese-style・日本式サービスのみ  → japanese_staff: false
 *      - 判断不能（情報不足）                 → needs_review: true（削除しない）
 *      - 明らかに対象外                        → 削除
 *   2. email取得
 *   3. メニュー・価格帯取得
 *   4. description再生成（SEO用・60〜120文字）
 *   5. detail生成（日本人が利用判断できる詳細情報・500〜1000文字）
 *
 * 使い方:
 *   ANTHROPIC_API_KEY=xxx npx tsx scripts/review-spots.ts <country> [category] [options]
 *
 * 例:
 *   npx tsx scripts/review-spots.ts sg                    # SG全カテゴリ
 *   npx tsx scripts/review-spots.ts sg restaurant         # SGレストランのみ
 *   npx tsx scripts/review-spots.ts sg --dry-run          # 判定結果を出力するだけ（ファイル変更なし）
 *   npx tsx scripts/review-spots.ts sg --limit 10         # 最大10件
 *   npx tsx scripts/review-spots.ts sg --force            # 既にreview済みも再実行
 *   npx tsx scripts/review-spots.ts sg --model opus       # claude-opus-4-5 を使用（デフォルト: sonnet）
 *
 * .envに ANTHROPIC_API_KEY を設定しておけば環境変数不要
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// .env読み込み
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([^#][^=]*)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const DIRECTORY_PATH = path.resolve(__dirname, "../content/directory");
const TODAY = new Date().toISOString().slice(0, 10);

// モデル設定
const MODEL_MAP: Record<string, string> = {
  sonnet: "claude-sonnet-4-5",
  opus:   "claude-opus-4-5",
  haiku:  "claude-haiku-4-5-20251001",
};

const COUNTRY_NAME: Record<string, string> = {
  sg: "シンガポール", th: "タイ", my: "マレーシア", hk: "香港",
  tw: "台湾", kr: "韓国", vn: "ベトナム", au: "オーストラリア",
  ae: "UAE（ドバイ）", de: "ドイツ", gb: "イギリス", id: "インドネシア",
  cn: "中国", ph: "フィリピン", us: "アメリカ", ca: "カナダ", fr: "フランス",
};

type SpotEntry = {
  slug: string;
  name: string;
  name_ja?: string | null;
  area?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  description: string;
  detail?: string | null;
  tags?: string[];
  hours?: string | null;
  email?: string | null;
  status?: string;
  last_verified?: string;
  source?: string;
  ai_reviewed?: boolean;
  japanese_staff?: boolean | null;
  needs_review?: boolean;
  price_range?: string | null;
  menu_highlights?: string[] | null;
  [key: string]: unknown;
};

type ReviewResult = {
  verdict: "japanese_friendly" | "not_japanese" | "needs_review";
  japanese_staff: boolean | null; // true=スタッフ対応あり, false=スタイルのみ, null=判断不能
  reason: string;              // 判定根拠（ログ用）
  email: string | null;
  price_range: string | null;  // 例: "SGD 15-30/人"
  menu_highlights: string[] | null; // 代表メニュー（最大5件）
  description: string;         // 60〜120文字
  detail: string;              // 500〜1000文字
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 公式サイトのHTMLを取得（失敗しても処理継続）
async function fetchWebsite(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; kaigaijin-bot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // スクリプト・スタイルを除去してテキスト量を削減
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{3,}/g, "  ")
      .slice(0, 6000); // 6000文字に制限（トークン節約）
  } catch {
    return null;
  }
}

// Claude APIに渡すプロンプトを構築
function buildPrompt(
  spot: SpotEntry,
  category: string,
  country: string,
  siteContent: string | null
): string {
  const countryName = COUNTRY_NAME[country] || country;
  const siteSection = siteContent
    ? `\n【公式サイト取得内容（抜粋）】\n${siteContent}`
    : "\n【公式サイト】取得不可";

  return `あなたは海外在住日本人向けメディア「Kaigaijin」のスポットレビュアーです。
以下の${countryName}のスポットについて、公式サイト内容と既存情報をもとに分析してください。

【スポット基本情報】
店名（英語）: ${spot.name}
店名（日本語）: ${spot.name_ja || "不明"}
国: ${countryName}
エリア: ${spot.area || "不明"}
住所: ${spot.address || "不明"}
カテゴリ: ${category}
既存タグ: ${(spot.tags || []).join("・") || "なし"}
既存description: ${spot.description || "なし"}
公式サイトURL: ${spot.website || "なし"}
${siteSection}

---

## タスク1: 日本人向け判定（最重要）

以下の基準で判定してください。

【日本人向けと判定する条件（いずれか1つ以上）】
- 日本人・日本語対応スタッフが在籍している
- 日本語メニューや日本語サービスが提供されている
- 日本食・日本式サービス（日本式ヘアカット、日本式マッサージ等）を明示的に提供している
- 日系チェーン・日本人オーナーが経営している
- 日本語Googleレビューが多い証拠がある（既存descriptionやtagsに記載あり）
- 日本のブランド・フランチャイズの現地店舗

【japanese_staffフラグの判定】
- true: 日本人スタッフ在籍 or 日本語対応可能なスタッフがいる
- false: 日本人スタッフ不在だが、Japanese-style・日本食・日本式サービスで日本人に有用
- null: 公式サイト等から確認できない（needs_review: trueの場合に設定）

【verdict】
- "japanese_friendly": 日本人向けと確認できた
- "not_japanese": 以下に該当する → 完全削除対象
  - ローカル店（日本との接点がない）
  - 「Japanese-style」と名乗るだけで内実が全く異なる（例：韓国系が「日式」と書いているだけ）
  - 日本人が利用する理由が全く見当たらない
- "needs_review": 公式サイト・既存情報から日本人向けか判断できない（削除しない・保留）

## タスク2: 追加情報の抽出

公式サイト内容から以下を抽出してください（確認できない場合はnull）:
- email: 問い合わせ用メールアドレス（予約・問い合わせ先として記載されているもの）
- price_range: 価格帯（例: "SGD 15-30/人", "THB 200-500/品"）。確認できない場合はnull
- menu_highlights: 代表的なメニュー・サービス名（最大5件、配列形式）。確認できない場合はnull

## タスク3: description生成（verdictが"japanese_friendly"または"needs_review"の場合のみ）

【ルール】
- 60〜120文字（厳守）
- 1文目: 日本人向けの根拠を必ず含める（日本語対応・日本人経営・日本食・日系ブランド等）
- 2文目以降: 場所（駅名・地区名・ビル名）と具体的な特徴（メニュー・サービス・実績）
- 事実のみ。「人気」「おすすめ」「雰囲気が良い」等の主観・推測は禁止
- 公式サイトや既存情報で確認できない内容は書かない
- テンプレート文ではなく、このスポット固有の情報で書く

## タスク4: detail生成（verdictが"japanese_friendly"または"needs_review"の場合のみ）

日本人が「行くかどうか判断できる」情報を500〜1000文字で記述してください。

【必ず含める（情報が取得できた場合）】
- 店舗の概要・業態（何をやっている店か）
- どんな人に向いているか（駐在員家族向け・ビジネスランチ向け等）
- スタッフの言語対応（日本語可否・対応品質の具体的情報）
- 代表的なメニュー・サービスと価格帯
- 雰囲気・内装・客層
- アクセス（MRT駅・ビル名・フロア）
- 営業時間・定休日・予約の必要性
- 注意点・Tips（現金のみ・服装規定・要予約等）

【ルール】
- 取得できなかった情報はその項目を省略する（「不明」と書かない）
- テンプレート文・箇条書きは使わない。読みやすい自然な日本語の文章で書く
- このスポット固有の情報のみ。他のスポットに使い回せるような汎用文は書かない
- 事実のみ。推測・主観・「人気」「おすすめ」は禁止

---

## 出力形式

以下のJSON形式で返してください。JSON以外の文字は一切出力しないこと。

\`\`\`json
{
  "verdict": "japanese_friendly" | "not_japanese" | "needs_review",
  "japanese_staff": true | false | null,
  "reason": "判定根拠を1〜2文で",
  "email": "xxx@xxx.com" | null,
  "price_range": "SGD 15-30/人" | null,
  "menu_highlights": ["メニュー1", "メニュー2"] | null,
  "description": "60〜120文字のdescription",
  "detail": "500〜1000文字のdetail"
}
\`\`\`

verdictが"not_japanese"の場合、descriptionとdetailは空文字列("")を返してください。`;
}

// Claude APIを呼び出してJSONレスポンスを取得
async function callClaude(
  client: Anthropic,
  model: string,
  prompt: string,
  spotName: string,
  retries = 3
): Promise<ReviewResult | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const msg = await client.messages.create({
        model,
        max_tokens: 2000,
        temperature: 0.2, // 判定の一貫性を重視して低め
        messages: [{ role: "user", content: prompt }],
      });

      const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";

      // コードブロック内のJSONを抽出
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        console.log(`    [attempt ${attempt + 1}] JSONが見つかりません: ${raw.slice(0, 100)}`);
        if (attempt < retries - 1) await sleep(3000);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[1]) as ReviewResult;

      // 必須フィールド検証
      if (!["japanese_friendly", "not_japanese", "needs_review"].includes(parsed.verdict)) {
        console.log(`    [attempt ${attempt + 1}] 不正なverdict: ${parsed.verdict}`);
        if (attempt < retries - 1) await sleep(3000);
        continue;
      }

      // description文字数チェック（japanese_friendlyの場合）
      if (parsed.verdict !== "not_japanese") {
        const dlen = (parsed.description || "").length;
        if (dlen < 40) {
          console.log(`    [attempt ${attempt + 1}] descriptionが短すぎます: ${dlen}文字`);
          if (attempt < retries - 1) await sleep(3000);
          continue;
        }
        const detlen = (parsed.detail || "").length;
        if (detlen < 100) {
          console.log(`    [attempt ${attempt + 1}] detailが短すぎます: ${detlen}文字`);
          if (attempt < retries - 1) await sleep(3000);
          continue;
        }
      }

      return parsed;

    } catch (e) {
      const err = e as Error;
      // レート制限
      if (err.message?.includes("rate_limit") || err.message?.includes("529")) {
        console.log(`    レート制限。60秒待機中...`);
        await sleep(60000);
        continue;
      }
      console.log(`    APIエラー [attempt ${attempt + 1}]: ${err.message?.slice(0, 80)}`);
      if (attempt < retries - 1) await sleep(5000);
    }
  }
  return null;
}

// カテゴリ単位で処理
async function processCategory(
  client: Anthropic,
  model: string,
  country: string,
  category: string,
  opts: { dryRun: boolean; force: boolean; limit: number }
): Promise<{ reviewed: number; removed: number; needsReview: number; failed: number }> {
  const filePath = path.join(DIRECTORY_PATH, country, `${category}.json`);
  if (!fs.existsSync(filePath)) return { reviewed: 0, removed: 0, needsReview: 0, failed: 0 };

  const spots: SpotEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // 対象: needs_review フラグがある or ai_reviewed未済 or force指定
  const targets = spots.filter((s) => {
    if (opts.force) return true;
    if (s.needs_review) return true; // 保留中は再レビュー
    return !s.ai_reviewed || !s.description || (s.description.length < 40);
  });

  if (targets.length === 0) {
    console.log(`  ${country}/${category}: スキップ（全${spots.length}件、対象なし）`);
    return { reviewed: 0, removed: 0, needsReview: 0, failed: 0 };
  }

  const toProcess = opts.limit > 0 ? targets.slice(0, opts.limit) : targets;
  console.log(`\n  ${country}/${category}: ${toProcess.length}件を処理（全${spots.length}件中）`);

  let reviewed = 0;
  let removed = 0;
  let needsReview = 0;
  let failed = 0;
  const removedSlugs = new Set<string>();

  for (let i = 0; i < toProcess.length; i++) {
    const spot = toProcess[i];
    process.stdout.write(`    [${i + 1}/${toProcess.length}] ${spot.name} ... `);

    // 公式サイトを取得（ある場合）
    let siteContent: string | null = null;
    if (spot.website) {
      siteContent = await fetchWebsite(spot.website);
    }

    const prompt = buildPrompt(spot, category, country, siteContent);
    const result = await callClaude(client, model, prompt, spot.name);

    if (!result) {
      console.log(`失敗`);
      failed++;
      // リトライ失敗→needs_reviewとして保留
      if (!opts.dryRun) {
        spot.needs_review = true;
        spot.ai_reviewed = true;
        spot.last_verified = TODAY;
      }
      continue;
    }

    // 結果をログ出力
    const verdictLabel =
      result.verdict === "japanese_friendly" ? `✓ japanese_friendly (staff:${result.japanese_staff})` :
      result.verdict === "not_japanese" ? `✗ not_japanese` :
      `? needs_review`;
    console.log(`${verdictLabel}`);
    console.log(`      理由: ${result.reason}`);
    if (result.verdict !== "not_japanese") {
      console.log(`      desc[${result.description.length}]: ${result.description}`);
      console.log(`      detail[${result.detail.length}文字]`);
    }

    if (opts.dryRun) {
      if (result.verdict === "not_japanese") removed++;
      else if (result.verdict === "needs_review") needsReview++;
      else reviewed++;
      continue;
    }

    // --- ファイル更新 ---
    if (result.verdict === "not_japanese") {
      removedSlugs.add(spot.slug);
      removed++;
    } else {
      // フィールド更新
      spot.japanese_staff = result.japanese_staff;
      spot.needs_review = result.verdict === "needs_review" ? true : undefined;
      spot.description = result.description;
      spot.detail = result.detail;
      if (result.email) spot.email = result.email;
      if (result.price_range) spot.price_range = result.price_range;
      if (result.menu_highlights) spot.menu_highlights = result.menu_highlights;
      spot.ai_reviewed = true;
      spot.last_verified = TODAY;

      if (result.verdict === "needs_review") needsReview++;
      else reviewed++;
    }

    // API間隔（Sonnet: ~60 RPM を余裕持って制御）
    if (i < toProcess.length - 1) {
      await sleep(1200); // ~50 RPM
    }
  }

  // 削除対象を除いて保存
  if (!opts.dryRun) {
    const remaining = spots.filter((s) => !removedSlugs.has(s.slug));
    fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2) + "\n", "utf-8");
    console.log(`  → 保存: ${remaining.length}件（削除: ${removedSlugs.size}件）`);
  }

  return { reviewed, removed, needsReview, failed };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("エラー: ANTHROPIC_API_KEY が設定されていません。.env に追加するか環境変数で渡してください。");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith("--") && !(/^\d+$/.test(a) && args[args.indexOf(a) - 1]?.startsWith("--")));
  const countryArg = positional[0];
  const categoryArg = positional[1];

  if (!countryArg) {
    console.log("使い方: npx tsx scripts/review-spots.ts <country|all> [category] [--dry-run] [--force] [--limit N] [--model sonnet|opus|haiku]");
    console.log("例: npx tsx scripts/review-spots.ts sg restaurant --limit 5 --dry-run");
    process.exit(1);
  }

  const dryRun = args.includes("--dry-run");
  const force  = args.includes("--force");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? "0", 10) : 0;
  const modelIdx = args.indexOf("--model");
  const modelKey = modelIdx >= 0 ? (args[modelIdx + 1] ?? "sonnet") : "sonnet";
  const model = MODEL_MAP[modelKey] ?? MODEL_MAP.sonnet;

  const client = new Anthropic({ apiKey });

  console.log("=== review-spots 開始 ===");
  console.log(`  対象: ${countryArg}${categoryArg ? "/" + categoryArg : ""}`);
  console.log(`  モデル: ${model}`);
  console.log(`  dry-run: ${dryRun}, force: ${force}, limit: ${limit || "無制限"}`);
  console.log("");

  const allCountries = fs.readdirSync(DIRECTORY_PATH).filter((d) =>
    fs.statSync(path.join(DIRECTORY_PATH, d)).isDirectory()
  );
  const countries = countryArg === "all" ? allCountries : [countryArg];

  let totalReviewed = 0;
  let totalRemoved = 0;
  let totalNeedsReview = 0;
  let totalFailed = 0;
  let remaining = limit > 0 ? limit : Infinity;

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_PATH, country);
    if (!fs.existsSync(countryDir)) {
      console.error(`  国ディレクトリが見つかりません: ${countryDir}`);
      continue;
    }

    const allCategories = fs.readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
    const categories = categoryArg ? [categoryArg] : allCategories;

    console.log(`\n=== ${country.toUpperCase()} ===`);

    for (const category of categories) {
      if (remaining <= 0) break;
      const catLimit = limit > 0 ? Math.min(remaining, limit) : 0;

      const result = await processCategory(client, model, country, category, {
        dryRun,
        force,
        limit: catLimit,
      });

      totalReviewed   += result.reviewed;
      totalRemoved    += result.removed;
      totalNeedsReview += result.needsReview;
      totalFailed     += result.failed;
      if (limit > 0) remaining -= (result.reviewed + result.removed + result.needsReview + result.failed);
    }
  }

  console.log("\n=== 完了 ===");
  console.log(`  日本人向け確認: ${totalReviewed}件`);
  console.log(`  削除（対象外）: ${totalRemoved}件`);
  console.log(`  保留（要確認）: ${totalNeedsReview}件`);
  console.log(`  失敗:           ${totalFailed}件`);
  if (dryRun) console.log("  ※ dry-runのため実際の変更なし");
}

main().catch(console.error);
