/**
 * GA4 Analytics API — サイトのパフォーマンスを分析して改善点を抽出
 *
 * 使い方:
 *   npx tsx scripts/ga4-analytics.ts
 *
 * オプション:
 *   --days 30           過去N日間（デフォルト: 30）
 *   --report pages      分析レポートの種類（デフォルト: overview）
 *                       overview   : 全体サマリー
 *                       pages      : ページ別パフォーマンス
 *                       countries  : 国別トラフィック
 *                       devices    : デバイス別
 *                       acquisition: 流入元別
 *                       bounce     : 直帰率が高いページ
 *
 * 初回実行時:
 *   ブラウザが開くのでGoogleアカウントでログイン → 許可
 *   トークンは secrets/ga4-token.json に保存される（次回以降は自動）
 */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as url from "url";

// ── 設定 ──

const PROPERTY_ID = "529929175"; // GA4プロパティID（数値ID）
const SECRETS_DIR = path.join(process.cwd(), "secrets");
const CLIENT_SECRET_PATH = path.join(SECRETS_DIR, "client_secret_kaigaijin.json");
const TOKEN_PATH = path.join(SECRETS_DIR, "ga4-token.json");
const SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

// ── 引数パース ──

const args = process.argv.slice(2);
function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const DAYS = parseInt(getArg("days", "30"), 10);
const REPORT = getArg("report", "overview");

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
    return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")) as TokenData;
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

async function authorizeInteractive(config: OAuthClientConfig): Promise<TokenData> {
  return new Promise((resolve, reject) => {
    const port = 3848;
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
        res.end("<h1>認証成功！</h1><p>このタブを閉じてターミナルに戻ってください。</p>");
        server.close();

        const token = await exchangeCode(config, code, `http://localhost:${port}`);
        saveToken(token);
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });

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

      import("child_process").then((cp) => {
        cp.exec(`open "${authUrl}"`);
      });
    });

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

  if (token.expiry_date < Date.now() + 5 * 60 * 1000) {
    if (!token.refresh_token) {
      token = await authorizeInteractive(config);
    } else {
      token = await refreshAccessToken(config, token);
      saveToken(token);
    }
  }

  return token.access_token;
}

// ── GA4 Data API ──

// GA4のMeasurement ID（G-XXXXXXX）からプロパティIDの数値部分を取得する必要がある
// runReport APIは "properties/XXXXXXXXX" の数値IDが必要
async function getPropertyNumericId(accessToken: string): Promise<string> {
  // GA4 Admin APIでアカウント一覧を取得してプロパティIDを解決
  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    accountSummaries?: Array<{
      account: string;
      displayName: string;
      propertySummaries?: Array<{
        property: string;
        displayName: string;
        measurementId?: string;
      }>;
    }>;
  };

  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      if (prop.measurementId === PROPERTY_ID) {
        // "properties/123456789" → "123456789"
        return prop.property.replace("properties/", "");
      }
    }
  }

  throw new Error(`プロパティID ${PROPERTY_ID} が見つかりません`);
}

interface GA4Row {
  dimensionValues: Array<{ value: string }>;
  metricValues: Array<{ value: string }>;
}

async function runReport(
  accessToken: string,
  propertyId: string,
  dimensions: string[],
  metrics: string[],
  limit = 20,
  orderByMetric?: string
): Promise<GA4Row[]> {
  const endDate = "yesterday";
  const startDate = `${DAYS}daysAgo`;

  const body: Record<string, unknown> = {
    dateRanges: [{ startDate, endDate }],
    dimensions: dimensions.map((d) => ({ name: d })),
    metrics: metrics.map((m) => ({ name: m })),
    limit,
  };

  if (orderByMetric) {
    body.orderBys = [
      { metric: { metricName: orderByMetric }, desc: true },
    ];
  }

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { rows?: GA4Row[] };
  return data.rows ?? [];
}

// ── レポート出力 ──

function sep(len = 80) {
  console.log("─".repeat(len));
}

async function reportOverview(accessToken: string, propertyId: string) {
  console.log("\n📊 全体サマリー\n");

  const rows = await runReport(
    accessToken,
    propertyId,
    ["date"],
    ["sessions", "activeUsers", "screenPageViews", "bounceRate", "averageSessionDuration"],
    1000
  );

  let totalSessions = 0;
  let totalUsers = 0;
  let totalPV = 0;
  let totalBounceRate = 0;
  let totalDuration = 0;

  for (const row of rows) {
    totalSessions += parseInt(row.metricValues[0].value, 10);
    totalUsers += parseInt(row.metricValues[1].value, 10);
    totalPV += parseInt(row.metricValues[2].value, 10);
    totalBounceRate += parseFloat(row.metricValues[3].value);
    totalDuration += parseFloat(row.metricValues[4].value);
  }

  const count = rows.length || 1;
  console.log(`  期間         : 過去${DAYS}日間`);
  console.log(`  セッション   : ${totalSessions.toLocaleString()}`);
  console.log(`  アクティブUU : ${totalUsers.toLocaleString()}`);
  console.log(`  PV           : ${totalPV.toLocaleString()}`);
  console.log(`  直帰率       : ${(totalBounceRate / count * 100).toFixed(1)}%`);
  console.log(`  平均滞在時間 : ${Math.round(totalDuration / count)}秒`);
}

async function reportPages(accessToken: string, propertyId: string) {
  console.log("\n📄 ページ別パフォーマンス（上位20ページ）\n");

  const rows = await runReport(
    accessToken,
    propertyId,
    ["pagePath"],
    ["screenPageViews", "activeUsers", "bounceRate", "averageSessionDuration"],
    20,
    "screenPageViews"
  );

  sep();
  console.log(
    `${"ページ".padEnd(45)}  ${"PV".padStart(6)}  ${"UU".padStart(6)}  ${"直帰率".padStart(7)}  ${"滞在秒".padStart(6)}`
  );
  sep();

  for (const row of rows) {
    const page = row.dimensionValues[0].value.slice(0, 44);
    const pv = parseInt(row.metricValues[0].value, 10).toLocaleString();
    const uu = parseInt(row.metricValues[1].value, 10).toLocaleString();
    const bounce = (parseFloat(row.metricValues[2].value) * 100).toFixed(0) + "%";
    const dur = Math.round(parseFloat(row.metricValues[3].value)) + "s";
    console.log(
      `${page.padEnd(45)}  ${pv.padStart(6)}  ${uu.padStart(6)}  ${bounce.padStart(7)}  ${dur.padStart(6)}`
    );
  }
  sep();
}

async function reportCountries(accessToken: string, propertyId: string) {
  console.log("\n🌍 国別トラフィック（上位15カ国）\n");

  const rows = await runReport(
    accessToken,
    propertyId,
    ["country"],
    ["sessions", "activeUsers"],
    15,
    "sessions"
  );

  sep(50);
  console.log(`${"国".padEnd(25)}  ${"セッション".padStart(10)}  ${"UU".padStart(8)}`);
  sep(50);

  for (const row of rows) {
    const country = row.dimensionValues[0].value.slice(0, 24);
    const sessions = parseInt(row.metricValues[0].value, 10).toLocaleString();
    const uu = parseInt(row.metricValues[1].value, 10).toLocaleString();
    console.log(`${country.padEnd(25)}  ${sessions.padStart(10)}  ${uu.padStart(8)}`);
  }
  sep(50);
}

async function reportDevices(accessToken: string, propertyId: string) {
  console.log("\n📱 デバイス別\n");

  const rows = await runReport(
    accessToken,
    propertyId,
    ["deviceCategory"],
    ["sessions", "activeUsers", "bounceRate"],
    10,
    "sessions"
  );

  sep(55);
  console.log(
    `${"デバイス".padEnd(15)}  ${"セッション".padStart(10)}  ${"UU".padStart(8)}  ${"直帰率".padStart(7)}`
  );
  sep(55);

  for (const row of rows) {
    const device = row.dimensionValues[0].value;
    const sessions = parseInt(row.metricValues[0].value, 10).toLocaleString();
    const uu = parseInt(row.metricValues[1].value, 10).toLocaleString();
    const bounce = (parseFloat(row.metricValues[2].value) * 100).toFixed(0) + "%";
    console.log(
      `${device.padEnd(15)}  ${sessions.padStart(10)}  ${uu.padStart(8)}  ${bounce.padStart(7)}`
    );
  }
  sep(55);
}

async function reportAcquisition(accessToken: string, propertyId: string) {
  console.log("\n🔗 流入元別（セッションの参照元/メディア）\n");

  const rows = await runReport(
    accessToken,
    propertyId,
    ["sessionDefaultChannelGroup"],
    ["sessions", "activeUsers", "bounceRate"],
    15,
    "sessions"
  );

  sep(60);
  console.log(
    `${"チャネル".padEnd(25)}  ${"セッション".padStart(10)}  ${"UU".padStart(8)}  ${"直帰率".padStart(7)}`
  );
  sep(60);

  for (const row of rows) {
    const channel = row.dimensionValues[0].value.slice(0, 24);
    const sessions = parseInt(row.metricValues[0].value, 10).toLocaleString();
    const uu = parseInt(row.metricValues[1].value, 10).toLocaleString();
    const bounce = (parseFloat(row.metricValues[2].value) * 100).toFixed(0) + "%";
    console.log(
      `${channel.padEnd(25)}  ${sessions.padStart(10)}  ${uu.padStart(8)}  ${bounce.padStart(7)}`
    );
  }
  sep(60);
}

async function reportBounce(accessToken: string, propertyId: string) {
  console.log("\n⚠️  直帰率が高いページ（PV10以上・直帰率60%超）\n");

  const rows = await runReport(
    accessToken,
    propertyId,
    ["pagePath"],
    ["screenPageViews", "bounceRate", "averageSessionDuration"],
    50,
    "screenPageViews"
  );

  const highBounce = rows
    .filter((r) => {
      const pv = parseInt(r.metricValues[0].value, 10);
      const bounce = parseFloat(r.metricValues[1].value);
      return pv >= 10 && bounce >= 0.6;
    })
    .sort(
      (a, b) =>
        parseFloat(b.metricValues[1].value) - parseFloat(a.metricValues[1].value)
    );

  if (highBounce.length === 0) {
    console.log("  直帰率60%超のページはありません（PV10以上）");
    return;
  }

  sep();
  console.log(
    `${"ページ".padEnd(45)}  ${"PV".padStart(6)}  ${"直帰率".padStart(7)}  ${"滞在秒".padStart(6)}`
  );
  sep();

  for (const row of highBounce) {
    const page = row.dimensionValues[0].value.slice(0, 44);
    const pv = parseInt(row.metricValues[0].value, 10).toLocaleString();
    const bounce = (parseFloat(row.metricValues[1].value) * 100).toFixed(0) + "%";
    const dur = Math.round(parseFloat(row.metricValues[2].value)) + "s";
    console.log(
      `${page.padEnd(45)}  ${pv.padStart(6)}  ${bounce.padStart(7)}  ${dur.padStart(6)}`
    );
  }
  sep();
  console.log(`\n  → 改善候補: ${highBounce.length}ページ`);
}

// ── メイン ──

async function main() {
  console.log(`\n📈 Kaigaijin GA4 Analytics（過去${DAYS}日間）`);
  console.log(`   レポート: ${REPORT}\n`);

  const accessToken = await getAccessToken();

  const propertyId = PROPERTY_ID;
  console.log(`✅ プロパティID: ${propertyId}\n`);

  switch (REPORT) {
    case "overview":
      await reportOverview(accessToken, propertyId);
      await reportAcquisition(accessToken, propertyId);
      await reportDevices(accessToken, propertyId);
      break;
    case "pages":
      await reportPages(accessToken, propertyId);
      break;
    case "countries":
      await reportCountries(accessToken, propertyId);
      break;
    case "devices":
      await reportDevices(accessToken, propertyId);
      break;
    case "acquisition":
      await reportAcquisition(accessToken, propertyId);
      break;
    case "bounce":
      await reportBounce(accessToken, propertyId);
      break;
    default:
      console.error(`不明なレポート: ${REPORT}`);
      console.error("利用可能: overview, pages, countries, devices, acquisition, bounce");
      process.exit(1);
  }

  console.log("\n✅ 完了\n");
}

main().catch((err) => {
  console.error("エラー:", err.message);
  process.exit(1);
});
