/**
 * SEOギャップ分析 — Search Consoleデータから改善アクションを自動抽出
 *
 * 使い方:
 *   npx tsx scripts/seo-gap.ts
 *
 * オプション:
 *   --days 28            過去N日間（デフォルト: 28）
 *   --report all         レポート種別（デフォルト: all）
 *                        all         : 全レポートを出力
 *                        quick-wins  : CTR改善で即効果が出るクエリ
 *                        rising      : 表示回数が急増しているクエリ（チャンス）
 *                        titles      : タイトル改善候補ページ
 *                        missing     : スポット未掲載のクエリ
 *                        query-pages : クエリがどのページで表示されているか確認
 *   --query "クエリ名"   query-pagesレポートで特定クエリのみ絞り込み
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
const DONE_PATH = path.join(process.cwd(), "scripts", "seo-gap-done.json");

// ── 対応済みクエリの読み込み・記録 ──

interface DoneEntry {
  query: string;
  action: string;
  done_at: string;
}

function loadDone(): DoneEntry[] {
  if (!fs.existsSync(DONE_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(DONE_PATH, "utf-8")) as DoneEntry[]; }
  catch { return []; }
}

function isDone(query: string, done: DoneEntry[]): boolean {
  return done.some(d => d.query === query);
}

// 対応済みとして記録する（スクリプト外から手動呼び出し用）
export function markDone(query: string, action: string) {
  const done = loadDone();
  if (isDone(query, done)) return;
  done.push({ query, action, done_at: new Date().toISOString().split("T")[0] });
  fs.writeFileSync(DONE_PATH, JSON.stringify(done, null, 2));
  console.log(`✅ 対応済みに記録: ${query}`);
}
const SECRETS_DIR = path.join(process.cwd(), "secrets");
const CLIENT_SECRET_PATH = path.join(SECRETS_DIR, "client_secret_kaigaijin.json");
const TOKEN_PATH = path.join(SECRETS_DIR, "search-console-token.json");
const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

// ── 引数パース ──

const args = process.argv.slice(2);
function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const DAYS = parseInt(getArg("days", "28"), 10);
const REPORT = getArg("report", "all");

// ── OAuth2（search-console.tsと共通の構造） ──

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
  try { return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8")) as TokenData; }
  catch { return null; }
}
function saveToken(t: TokenData) { fs.writeFileSync(TOKEN_PATH, JSON.stringify(t, null, 2)); }

async function exchangeCode(config: OAuthClientConfig, code: string, redirectUri: string): Promise<TokenData> {
  const res = await fetch(config.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: config.client_id, client_secret: config.client_secret, redirect_uri: redirectUri, grant_type: "authorization_code" }).toString(),
  });
  if (!res.ok) throw new Error(`トークン交換失敗: ${res.status} ${await res.text()}`);
  const d = await res.json() as { access_token: string; refresh_token?: string; token_type: string; expires_in: number };
  return { access_token: d.access_token, refresh_token: d.refresh_token ?? "", token_type: d.token_type, expiry_date: Date.now() + d.expires_in * 1000 };
}
async function refreshAccessToken(config: OAuthClientConfig, token: TokenData): Promise<TokenData> {
  const res = await fetch(config.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: token.refresh_token, client_id: config.client_id, client_secret: config.client_secret, grant_type: "refresh_token" }).toString(),
  });
  if (!res.ok) throw new Error(`リフレッシュ失敗: ${res.status} ${await res.text()}`);
  const d = await res.json() as { access_token: string; expires_in: number };
  return { ...token, access_token: d.access_token, expiry_date: Date.now() + d.expires_in * 1000 };
}
async function authorizeInteractive(config: OAuthClientConfig): Promise<TokenData> {
  return new Promise((resolve, reject) => {
    const port = 3847;
    const server = http.createServer(async (req, res) => {
      try {
        const code = url.parse(req.url ?? "", true).query.code as string;
        if (!code) { res.writeHead(400); res.end("コードなし"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>認証成功！</h1><p>このタブを閉じてください。</p>");
        server.close();
        const token = await exchangeCode(config, code, `http://localhost:${port}`);
        saveToken(token); resolve(token);
      } catch (e) { reject(e); }
    });
    server.listen(port, () => {
      const authUrl = `${config.auth_uri}?` + new URLSearchParams({ client_id: config.client_id, redirect_uri: `http://localhost:${port}`, response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: "consent" });
      console.log("\n🔐 ブラウザで認証してください:\n" + authUrl);
      import("child_process").then(cp => cp.exec(`open "${authUrl}"`));
    });
    setTimeout(() => { server.close(); reject(new Error("認証タイムアウト")); }, 180000);
  });
}
async function getAccessToken(): Promise<string> {
  const config = loadClientConfig();
  let token = loadSavedToken();
  if (!token) { token = await authorizeInteractive(config); }
  if (token.expiry_date < Date.now() + 5 * 60 * 1000) {
    token = token.refresh_token ? await refreshAccessToken(config, token) : await authorizeInteractive(config);
    saveToken(token);
  }
  return token.access_token;
}

// ── Search Console API ──

function formatDate(d: Date) { return d.toISOString().split("T")[0]; }

interface QueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function fetchByDimension(
  accessToken: string,
  dimensions: string[],
  days: number,
  limit = 1000,
  compareDays?: number
): Promise<QueryRow[]> {
  const end = new Date(); end.setDate(end.getDate() - 1);
  const start = new Date(); start.setDate(start.getDate() - days);

  const body: Record<string, unknown> = {
    startDate: formatDate(start),
    endDate: formatDate(end),
    dimensions,
    rowLimit: limit,
  };
  if (compareDays) {
    const cEnd = new Date(); cEnd.setDate(cEnd.getDate() - days - 1);
    const cStart = new Date(); cStart.setDate(cStart.getDate() - days - compareDays);
    body.compareDateRange = { startDate: formatDate(cStart), endDate: formatDate(cEnd) };
  }

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`Search Console API ${res.status}: ${await res.text()}`);
  const data = await res.json() as { rows?: QueryRow[] };
  return data.rows ?? [];
}

function isJapanese(text: string) { return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text); }
function sep(n = 80) { console.log("─".repeat(n)); }

// ── レポート1: クイックウィン（順位6〜20位・表示多い・CTR低い） ──
// 検索結果には出ているが選ばれていない = タイトル/ディスクリプション改善で即効果

async function reportQuickWins(accessToken: string, done: DoneEntry[]) {
  console.log("\n🎯 クイックウィン（タイトル改善で即クリック増）");
  console.log("   条件: 順位6〜20位 / 表示5回以上 / CTR5%未満 / 日本語\n");

  const rows = await fetchByDimension(accessToken, ["query"], DAYS);
  const targets = rows
    .filter(r => isJapanese(r.keys[0]) && r.impressions >= 5 && r.position >= 6 && r.position <= 20 && r.ctr < 0.05 && !isDone(r.keys[0], done))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  if (targets.length === 0) { console.log("   該当なし\n"); return; }

  sep();
  console.log(`${"クエリ".padEnd(38)}  ${"表示".padStart(5)}  ${"順位".padStart(6)}  ${"CTR".padStart(6)}  アクション`);
  sep();
  for (const r of targets) {
    const q = r.keys[0].slice(0, 37);
    const pos = r.position.toFixed(1);
    const ctr = (r.ctr * 100).toFixed(1) + "%";
    const action = r.position <= 10 ? "📝 タイトル改善" : "📄 コンテンツ強化";
    console.log(`${q.padEnd(38)}  ${String(r.impressions).padStart(5)}  ${pos.padStart(6)}  ${ctr.padStart(6)}  ${action}`);
  }
  sep();
  console.log(`\n  → ${targets.length}クエリ。タイトルに検索ワードを含めるだけで改善する可能性大\n`);
}

// ── レポート2: ライジング（先週より表示が急増しているクエリ） ──

async function reportRising(accessToken: string, done: DoneEntry[]) {
  console.log("\n📈 ライジングクエリ（直近7日で表示急増 = SEOチャンス）");
  console.log("   条件: 直近7日の表示が前週比150%以上 / 表示3回以上\n");

  const [recent, prev] = await Promise.all([
    fetchByDimension(accessToken, ["query"], 7),
    fetchByDimension(accessToken, ["query"], 14),
  ]);

  const prevMap = new Map(prev.map(r => [r.keys[0], r]));
  const rising = recent
    .filter(r => {
      if (isDone(r.keys[0], done)) return false;
      const p = prevMap.get(r.keys[0]);
      if (!p || p.impressions === 0) return r.impressions >= 3;
      return r.impressions >= 3 && r.impressions / p.impressions >= 1.5;
    })
    .map(r => {
      const p = prevMap.get(r.keys[0]);
      const ratio = p && p.impressions > 0 ? r.impressions / p.impressions : null;
      return { ...r, prevImpressions: p?.impressions ?? 0, ratio };
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  if (rising.length === 0) { console.log("   該当なし\n"); return; }

  sep(72);
  console.log(`${"クエリ".padEnd(38)}  ${"今週".padStart(5)}  ${"先週".padStart(5)}  ${"倍率".padStart(5)}`);
  sep(72);
  for (const r of rising) {
    const q = r.keys[0].slice(0, 37);
    const ratio = r.ratio != null ? `${r.ratio.toFixed(1)}x` : "NEW";
    console.log(`${q.padEnd(38)}  ${String(r.impressions).padStart(5)}  ${String(r.prevImpressions).padStart(5)}  ${ratio.padStart(5)}`);
  }
  sep(72);
  console.log(`\n  → これらのキーワードで記事・スポットを強化すると伸びやすい\n`);
}

// ── レポート3: ページ別CTR（タイトル改善候補ページ） ──

async function reportPageTitles(accessToken: string) {
  console.log("\n📄 ページ別CTR（CTRが低いページ = タイトル改善候補）");
  console.log("   条件: 表示20回以上 / CTR3%未満\n");

  const rows = await fetchByDimension(accessToken, ["page"], DAYS);
  const targets = rows
    .filter(r => r.impressions >= 20 && r.ctr < 0.03)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  if (targets.length === 0) { console.log("   該当なし\n"); return; }

  sep(90);
  console.log(`${"ページ".padEnd(50)}  ${"表示".padStart(6)}  ${"クリック".padStart(8)}  ${"CTR".padStart(6)}  ${"順位".padStart(6)}`);
  sep(90);
  for (const r of targets) {
    const page = r.keys[0].replace("https://kaigaijin.jp", "").slice(0, 49);
    const ctr = (r.ctr * 100).toFixed(1) + "%";
    const pos = r.position.toFixed(1);
    console.log(`${page.padEnd(50)}  ${String(r.impressions).padStart(6)}  ${String(r.clicks).padStart(8)}  ${ctr.padStart(6)}  ${pos.padStart(6)}`);
  }
  sep(90);
  console.log(`\n  → titleタグ・metadescriptionに検索キーワードを入れることで改善可能\n`);
}

// ── レポート4: 未掲載クエリ（スポットがないのに検索されている） ──

async function reportMissingSpots(accessToken: string, done: DoneEntry[]) {
  console.log("\n❌ スポット系未対応クエリ（検索需要があるのにページがない）");
  console.log("   条件: 表示3回以上 / 施設・場所を示すキーワードを含む / 日本語\n");

  const rows = await fetchByDimension(accessToken, ["query"], DAYS);

  // 施設・場所系キーワードのパターン
  const spotPatterns = [
    /クリニック|病院|歯科|医院|薬局/,
    /レストラン|居酒屋|ランチ|ディナー|カフェ|寿司|ラーメン|焼肉/,
    /美容室|ヘアサロン|ネイル|エステ|マッサージ/,
    /不動産|賃貸|物件|マンション/,
    /スーパー|食材|日本食|デパート/,
    /学校|インター|塾|幼稚園/,
    /会計士|税理士|弁護士|保険/,
  ];

  const missing = rows
    .filter(r => {
      if (!isJapanese(r.keys[0])) return false;
      if (r.impressions < 3) return false;
      if (isDone(r.keys[0], done)) return false;
      return spotPatterns.some(p => p.test(r.keys[0]));
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  if (missing.length === 0) { console.log("   該当なし\n"); return; }

  sep(72);
  console.log(`${"クエリ".padEnd(40)}  ${"表示".padStart(5)}  ${"クリック".padStart(8)}  ${"順位".padStart(6)}`);
  sep(72);
  for (const r of missing) {
    const q = r.keys[0].slice(0, 39);
    const pos = r.position.toFixed(1);
    console.log(`${q.padEnd(40)}  ${String(r.impressions).padStart(5)}  ${String(r.clicks).padStart(8)}  ${pos.padStart(6)}`);
  }
  sep(72);
  console.log(`\n  → これらの施設をスポットに追加するとインデックスされやすくなる\n`);
}

// ── レポート5: クエリ×ページ紐付け（どのページで表示されているか） ──
// --report query-pages で全未対応クエリのヒットページを一覧表示
// --query "クエリ名" で特定クエリのみ絞り込み

async function reportQueryPages(accessToken: string, done: DoneEntry[]) {
  const targetQuery = getArg("query", "");
  console.log("\n🔍 クエリ×ページ紐付け（どのページで表示されているか）");
  if (targetQuery) {
    console.log(`   対象クエリ: "${targetQuery}"\n`);
  } else {
    console.log("   条件: 表示3回以上 / 日本語 / 未対応クエリ\n");
    console.log("   💡 特定クエリを絞り込む場合: --query \"クエリ名\"\n");
  }

  // query+page の組み合わせで取得
  const rows = await fetchByDimension(accessToken, ["query", "page"], DAYS, 5000);

  // クエリ→ページのマップを構築
  const queryPageMap = new Map<string, { page: string; impressions: number; clicks: number; position: number }[]>();
  for (const r of rows) {
    const q = r.keys[0];
    const page = r.keys[1].replace("https://kaigaijin.jp", "");
    if (!queryPageMap.has(q)) queryPageMap.set(q, []);
    queryPageMap.get(q)!.push({ page, impressions: r.impressions, clicks: r.clicks, position: r.position });
  }

  // 対象クエリを絞り込む
  let targets: string[];
  if (targetQuery) {
    targets = [targetQuery];
  } else {
    // query単体のデータも取得して未対応クエリを抽出
    const queryRows = await fetchByDimension(accessToken, ["query"], DAYS);
    targets = queryRows
      .filter(r => isJapanese(r.keys[0]) && r.impressions >= 3 && !isDone(r.keys[0], done))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 30)
      .map(r => r.keys[0]);
  }

  if (targets.length === 0) { console.log("   該当なし\n"); return; }

  for (const q of targets) {
    const pages = queryPageMap.get(q);
    if (!pages || pages.length === 0) {
      console.log(`\n【${q}】 → データなし`);
      continue;
    }
    const sorted = [...pages].sort((a, b) => b.impressions - a.impressions);
    console.log(`\n【${q}】`);
    sep(90);
    console.log(`  ${"ページ".padEnd(55)}  ${"表示".padStart(4)}  ${"クリック".padStart(6)}  ${"順位".padStart(5)}`);
    sep(90);
    for (const p of sorted.slice(0, 5)) {
      const pos = p.position.toFixed(1);
      console.log(`  ${p.page.slice(0, 54).padEnd(55)}  ${String(p.impressions).padStart(4)}  ${String(p.clicks).padStart(6)}  ${pos.padStart(5)}`);
    }
    sep(90);
  }
  console.log();
}

// ── サマリー ──

async function reportSummary(accessToken: string) {
  const rows = await fetchByDimension(accessToken, ["query"], DAYS);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(1) : "0";
  const avgPos = rows.length > 0 ? (rows.reduce((s, r) => s + r.position, 0) / rows.length).toFixed(1) : "-";

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  SEOギャップ分析 — 過去${DAYS}日間（kaigaijin.jp）`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  総表示回数   : ${totalImpressions.toLocaleString()}`);
  console.log(`  総クリック数 : ${totalClicks.toLocaleString()}`);
  console.log(`  平均CTR      : ${avgCtr}%`);
  console.log(`  平均順位     : ${avgPos}位`);
  console.log(`  クエリ数     : ${rows.length.toLocaleString()}`);
  console.log(`${"=".repeat(60)}\n`);
}

// ── メイン ──

async function main() {
  const accessToken = await getAccessToken();
  const done = loadDone();

  if (done.length > 0) {
    console.log(`\n📋 対応済みスキップ: ${done.length}件（seo-gap-done.json）`);
  }

  await reportSummary(accessToken);

  if (REPORT === "all" || REPORT === "quick-wins")   await reportQuickWins(accessToken, done);
  if (REPORT === "all" || REPORT === "rising")       await reportRising(accessToken, done);
  if (REPORT === "all" || REPORT === "titles")       await reportPageTitles(accessToken);
  if (REPORT === "all" || REPORT === "missing")      await reportMissingSpots(accessToken, done);
  if (REPORT === "query-pages")                      await reportQueryPages(accessToken, done);

  console.log("✅ 分析完了\n");
  console.log("💡 対応したクエリは seo-gap-done.json に追記してください");
  console.log('   例: { "query": "クエリ名", "action": "対応内容", "done_at": "YYYY-MM-DD" }\n');
}

main().catch(err => { console.error("エラー:", err.message); process.exit(1); });
