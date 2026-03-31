/**
 * Search Console API — 表示回数が多いのにクリック0のクエリを抽出
 *
 * 使い方:
 *   GOOGLE_SERVICE_ACCOUNT_KEY=path/to/key.json npx tsx scripts/search-console.ts
 *
 * オプション:
 *   --days 7          過去N日間（デフォルト: 7）
 *   --min-impressions 5  最低表示回数（デフォルト: 5）
 *   --japanese-only   日本語クエリのみ（デフォルト: true）
 *   --all             全言語のクエリを表示
 *   --check-spots     既存スポットとの照合を行う
 *
 * セットアップ:
 *   1. Google Cloud Console → Search Console API を有効化
 *   2. サービスアカウント作成 → JSONキーをダウンロード
 *   3. Search Console → 設定 → ユーザーと権限 → サービスアカウントのメールを追加（閲覧者）
 */

import { GoogleAuth } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";

// ── 設定 ──

const SITE_URL = "sc-domain:kaigaijin.jp"; // ドメインプロパティ
const DIRECTORY_ROOT = path.join(process.cwd(), "content", "directory");

// ── 引数パース ──

const args = process.argv.slice(2);
function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const DAYS = parseInt(getArg("days", "7"), 10);
const MIN_IMPRESSIONS = parseInt(getArg("min-impressions", "5"), 10);
const JAPANESE_ONLY = !hasFlag("all");
const CHECK_SPOTS = hasFlag("check-spots");

// ── 認証 ──

const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!keyPath) {
  console.error(
    "環境変数 GOOGLE_SERVICE_ACCOUNT_KEY にサービスアカウントのJSONキーパスを設定してください"
  );
  console.error(
    "例: GOOGLE_SERVICE_ACCOUNT_KEY=./secrets/sa-key.json npx tsx scripts/search-console.ts"
  );
  process.exit(1);
}

const auth = new GoogleAuth({
  keyFile: keyPath,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});

// ── 日本語判定 ──

function containsJapanese(text: string): boolean {
  // ひらがな・カタカナ・漢字（CJK統合漢字）を含むか
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

// ── 日付ヘルパー ──

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Search Console API ──

interface QueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function fetchSearchAnalytics(): Promise<QueryRow[]> {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // 昨日まで
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS);

  const body = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ["query"],
    rowLimit: 1000,
    startRow: 0,
  };

  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${(token as { token: string }).token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Search Console API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { rows?: QueryRow[] };
  return data.rows ?? [];
}

// ── スポット照合 ──

interface SpotMatch {
  country: string;
  category: string;
  slug: string;
  name: string;
  name_ja: string | null;
  description: string;
}

function loadAllSpots(): Map<string, SpotMatch[]> {
  // クエリのキーワードで検索するためのインデックス
  const index = new Map<string, SpotMatch[]>();

  if (!fs.existsSync(DIRECTORY_ROOT)) return index;

  const countries = fs
    .readdirSync(DIRECTORY_ROOT)
    .filter((f) =>
      fs.statSync(path.join(DIRECTORY_ROOT, f)).isDirectory()
    );

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_ROOT, country);
    const files = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const category = file.replace(".json", "");
      try {
        const raw = fs.readFileSync(path.join(countryDir, file), "utf-8");
        const spots = JSON.parse(raw) as Array<{
          slug: string;
          name: string;
          name_ja?: string | null;
          description: string;
        }>;
        for (const spot of spots) {
          const entry: SpotMatch = {
            country,
            category,
            slug: spot.slug,
            name: spot.name,
            name_ja: spot.name_ja ?? null,
            description: spot.description,
          };

          // name と name_ja の各単語をキーにインデックス
          const keywords = new Set<string>();
          for (const text of [spot.name, spot.name_ja ?? ""]) {
            for (const word of text.toLowerCase().split(/[\s\-\/&]+/)) {
              if (word.length >= 2) keywords.add(word);
            }
          }
          for (const kw of keywords) {
            if (!index.has(kw)) index.set(kw, []);
            index.get(kw)!.push(entry);
          }
        }
      } catch {
        // JSONパースエラーはスキップ
      }
    }
  }

  return index;
}

function findMatchingSpots(
  query: string,
  index: Map<string, SpotMatch[]>
): SpotMatch[] {
  const words = query.toLowerCase().split(/[\s\-\/&]+/).filter((w) => w.length >= 2);
  const candidates = new Map<string, { spot: SpotMatch; score: number }>();

  for (const word of words) {
    const matches = index.get(word) ?? [];
    for (const spot of matches) {
      const key = `${spot.country}/${spot.category}/${spot.slug}`;
      const existing = candidates.get(key);
      if (existing) {
        existing.score++;
      } else {
        candidates.set(key, { spot, score: 1 });
      }
    }
  }

  // スコア2以上（2単語以上一致）を返す
  return Array.from(candidates.values())
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map((c) => c.spot);
}

// ── メイン ──

async function main() {
  console.log(`\n📊 Search Console 分析（過去${DAYS}日間）`);
  console.log(`   最低表示回数: ${MIN_IMPRESSIONS}`);
  console.log(`   日本語フィルタ: ${JAPANESE_ONLY ? "ON" : "OFF"}`);
  console.log(`   スポット照合: ${CHECK_SPOTS ? "ON" : "OFF"}\n`);

  // データ取得
  const rows = await fetchSearchAnalytics();
  console.log(`   全クエリ数: ${rows.length}\n`);

  // フィルタ: 表示回数 >= MIN_IMPRESSIONS & クリック0
  let zeroClickRows = rows.filter(
    (r) => r.clicks === 0 && r.impressions >= MIN_IMPRESSIONS
  );

  // 日本語フィルタ
  if (JAPANESE_ONLY) {
    zeroClickRows = zeroClickRows.filter((r) => containsJapanese(r.keys[0]));
  }

  // 表示回数降順
  zeroClickRows.sort((a, b) => b.impressions - a.impressions);

  if (zeroClickRows.length === 0) {
    console.log("✅ 該当するクエリはありません（全てクリックされてるか、表示回数が少ない）");
    return;
  }

  // スポットインデックス読み込み
  const spotIndex = CHECK_SPOTS ? loadAllSpots() : new Map();

  // 出力
  console.log(
    `🔍 表示${MIN_IMPRESSIONS}回以上・クリック0のクエリ（${zeroClickRows.length}件）\n`
  );
  console.log("─".repeat(80));
  console.log(
    `${"クエリ".padEnd(40)}  ${"表示".padStart(6)}  ${"平均順位".padStart(8)}  ステータス`
  );
  console.log("─".repeat(80));

  for (const row of zeroClickRows) {
    const query = row.keys[0];
    const position = row.position.toFixed(1);
    let status = "";

    if (CHECK_SPOTS) {
      const matches = findMatchingSpots(query, spotIndex);
      if (matches.length > 0) {
        const m = matches[0];
        const descLen = m.description.length;
        status =
          descLen < 30
            ? `⚠️  存在（${m.country}/${m.category}）description短い（${descLen}文字）`
            : `✅ 存在（${m.country}/${m.category}/${m.slug}）`;
      } else {
        status = "❌ 未掲載";
      }
    }

    console.log(
      `${query.padEnd(40)}  ${String(row.impressions).padStart(6)}  ${position.padStart(8)}  ${status}`
    );
  }

  console.log("─".repeat(80));

  // サマリー
  if (CHECK_SPOTS) {
    const missing = zeroClickRows.filter(
      (r) => findMatchingSpots(r.keys[0], spotIndex).length === 0
    );
    const weak = zeroClickRows.filter((r) => {
      const matches = findMatchingSpots(r.keys[0], spotIndex);
      return matches.length > 0 && matches[0].description.length < 30;
    });

    console.log(`\n📋 サマリー:`);
    console.log(`   未掲載: ${missing.length}件 → スポット追加が必要`);
    console.log(`   description不足: ${weak.length}件 → 情報充実が必要`);
    console.log(
      `   合計インプレッション損失: ${zeroClickRows.reduce((s, r) => s + r.impressions, 0)}回\n`
    );
  }
}

main().catch((err) => {
  console.error("エラー:", err.message);
  process.exit(1);
});
