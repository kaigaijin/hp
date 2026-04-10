/**
 * Search Console API — 表示回数が多いのにクリック0のクエリを抽出
 *
 * 使い方:
 *   npx tsx scripts/search-console.ts
 *
 * オプション:
 *   --days 7          過去N日間（デフォルト: 7）
 *   --min-impressions 5  最低表示回数（デフォルト: 5）
 *   --japanese-only   日本語クエリのみ（デフォルト: true）
 *   --all             全言語のクエリを表示
 *   --check-places     既存スポットとの照合を行う
 *
 * 初回実行時:
 *   ブラウザが開くのでGoogleアカウントでログイン → 許可
 *   トークンは secrets/search-console-token.json に保存される（次回以降は自動）
 */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as url from "url";

// ── 設定 ──

const SITE_URL = "sc-domain:kaigaijin.jp";
const DIRECTORY_ROOT = path.join(process.cwd(), "content", "directory");
const SECRETS_DIR = path.join(process.cwd(), "secrets");
const CLIENT_SECRET_PATH = path.join(
  SECRETS_DIR,
  "client_secret_kaigaijin.json"
);
const TOKEN_PATH = path.join(SECRETS_DIR, "search-console-token.json");
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

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
const CHECK_placeS = hasFlag("check-places");

// ── OAuth2 ──

interface OAuthClientConfig {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  auth_uri: string;
  token_uri: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date: number;
}

function loadClientConfig(): OAuthClientConfig {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    console.error(`OAuth設定ファイルが見つかりません: ${CLIENT_SECRET_PATH}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, "utf-8"));
  return raw.installed || raw.web;
}

function loadSavedToken(): TokenData | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    return token as TokenData;
  } catch {
    return null;
  }
}

function saveToken(token: TokenData): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

async function exchangeCode(
  config: OAuthClientConfig,
  code: string,
  redirectUri: string
): Promise<TokenData> {
  const params = new URLSearchParams({
    code,
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(config.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`トークン交換失敗: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    token_type: data.token_type,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

async function refreshAccessToken(
  config: OAuthClientConfig,
  token: TokenData
): Promise<TokenData> {
  const params = new URLSearchParams({
    refresh_token: token.refresh_token,
    client_id: config.client_id,
    client_secret: config.client_secret,
    grant_type: "refresh_token",
  });

  const res = await fetch(config.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`トークンリフレッシュ失敗: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    ...token,
    access_token: data.access_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

async function authorizeInteractive(
  config: OAuthClientConfig
): Promise<TokenData> {
  return new Promise((resolve, reject) => {
    // ローカルサーバーでコールバック受け取り
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = url.parse(req.url ?? "", true);
        const code = parsedUrl.query.code as string;

        if (!code) {
          res.writeHead(400);
          res.end("認証コードがありません");
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          "<h1>認証成功！</h1><p>このタブを閉じてターミナルに戻ってください。</p>"
        );

        server.close();

        const token = await exchangeCode(
          config,
          code,
          `http://localhost:${port}`
        );
        saveToken(token);
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });

    // 空きポートを使う
    const port = 3847;
    server.listen(port, () => {
      const authUrl =
        `${config.auth_uri}?` +
        new URLSearchParams({
          client_id: config.client_id,
          redirect_uri: `http://localhost:${port}`,
          response_type: "code",
          scope: SCOPES.join(" "),
          access_type: "offline",
          prompt: "consent",
        }).toString();

      console.log("\n🔐 ブラウザで認証してください:");
      console.log(authUrl);

      // macOSでブラウザを開く
      import("child_process").then((cp) => {
        cp.exec(`open "${authUrl}"`);
      });
    });

    // タイムアウト（3分）
    setTimeout(() => {
      server.close();
      reject(new Error("認証タイムアウト（180秒）"));
    }, 180000);
  });
}

async function getAccessToken(): Promise<string> {
  const config = loadClientConfig();
  let token = loadSavedToken();

  if (!token) {
    console.log("初回認証が必要です...");
    token = await authorizeInteractive(config);
    console.log("✅ 認証完了！トークンを保存しました\n");
  }

  // トークンの有効期限チェック（5分のバッファ）
  if (token.expiry_date < Date.now() + 5 * 60 * 1000) {
    if (!token.refresh_token) {
      // リフレッシュトークンがない場合は再認証
      token = await authorizeInteractive(config);
    } else {
      token = await refreshAccessToken(config, token);
      saveToken(token);
    }
  }

  return token.access_token;
}

// ── 日本語判定 ──

function containsJapanese(text: string): boolean {
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
  const accessToken = await getAccessToken();

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - DAYS);

  const body = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    dimensions: ["query"],
    rowLimit: 1000,
    startRow: 0,
  };

  const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

interface placeMatch {
  country: string;
  category: string;
  slug: string;
  name: string;
  name_ja: string | null;
  description: string;
}

function loadAllplaces(): Map<string, placeMatch[]> {
  const index = new Map<string, placeMatch[]>();

  if (!fs.existsSync(DIRECTORY_ROOT)) return index;

  const countries = fs
    .readdirSync(DIRECTORY_ROOT)
    .filter((f) => fs.statSync(path.join(DIRECTORY_ROOT, f)).isDirectory());

  for (const country of countries) {
    const countryDir = path.join(DIRECTORY_ROOT, country);
    const files = fs
      .readdirSync(countryDir)
      .filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const category = file.replace(".json", "");
      try {
        const raw = fs.readFileSync(path.join(countryDir, file), "utf-8");
        const places = JSON.parse(raw) as Array<{
          slug: string;
          name: string;
          name_ja?: string | null;
          description: string;
        }>;
        for (const place of places) {
          const entry: placeMatch = {
            country,
            category,
            slug: place.slug,
            name: place.name,
            name_ja: place.name_ja ?? null,
            description: place.description,
          };

          const keywords = new Set<string>();
          for (const text of [place.name, place.name_ja ?? ""]) {
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

function findMatchingplaces(
  query: string,
  index: Map<string, placeMatch[]>
): placeMatch[] {
  const words = query
    .toLowerCase()
    .split(/[\s\-\/&]+/)
    .filter((w) => w.length >= 2);
  const candidates = new Map<string, { place: placeMatch; score: number }>();

  for (const word of words) {
    const matches = index.get(word) ?? [];
    for (const place of matches) {
      const key = `${place.country}/${place.category}/${place.slug}`;
      const existing = candidates.get(key);
      if (existing) {
        existing.score++;
      } else {
        candidates.set(key, { place, score: 1 });
      }
    }
  }

  return Array.from(candidates.values())
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map((c) => c.place);
}

// ── メイン ──

async function main() {
  console.log(`\n📊 Search Console 分析（過去${DAYS}日間）`);
  console.log(`   最低表示回数: ${MIN_IMPRESSIONS}`);
  console.log(`   日本語フィルタ: ${JAPANESE_ONLY ? "ON" : "OFF"}`);
  console.log(`   スポット照合: ${CHECK_placeS ? "ON" : "OFF"}\n`);

  const rows = await fetchSearchAnalytics();
  console.log(`   全クエリ数: ${rows.length}\n`);

  let zeroClickRows = rows.filter(
    (r) => r.clicks === 0 && r.impressions >= MIN_IMPRESSIONS
  );

  if (JAPANESE_ONLY) {
    zeroClickRows = zeroClickRows.filter((r) => containsJapanese(r.keys[0]));
  }

  zeroClickRows.sort((a, b) => b.impressions - a.impressions);

  if (zeroClickRows.length === 0) {
    console.log(
      "✅ 該当するクエリはありません（全てクリックされてるか、表示回数が少ない）"
    );
    return;
  }

  const placeIndex = CHECK_placeS ? loadAllplaces() : new Map();

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

    if (CHECK_placeS) {
      const matches = findMatchingplaces(query, placeIndex);
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

  if (CHECK_placeS) {
    const missing = zeroClickRows.filter(
      (r) => findMatchingplaces(r.keys[0], placeIndex).length === 0
    );
    const weak = zeroClickRows.filter((r) => {
      const matches = findMatchingplaces(r.keys[0], placeIndex);
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
