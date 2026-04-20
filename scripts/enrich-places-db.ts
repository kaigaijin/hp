/**
 * enrich-places-db.ts
 *
 * Supabase の places テーブルから直接取得し、description（<60文字）と
 * detail（null）を Gemini 2.0 Flash で公式サイト参照して同時生成・更新する。
 *
 * 使い方:
 *   npx tsx scripts/enrich-places-db.ts --country au
 *   npx tsx scripts/enrich-places-db.ts --country au --limit 200 --offset 0
 *   npx tsx scripts/enrich-places-db.ts --country au --dry-run
 *   npx tsx scripts/enrich-places-db.ts --country au --force   # description有りも上書き
 *
 * .env に GEMINI_API_KEY / SUPABASE_SERVICE_ROLE_KEY を設定しておくこと
 */

import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// .env / .env.local 読み込み
for (const name of [".env", ".env.local"]) {
  const envPath = path.resolve(__dirname, `../${name}`);
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^([^#\s][^=]*)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://itvobfrmbrtlisyojlqr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MODEL = "gemini-2.0-flash";
const RPM = 14; // 余裕を持って14
const DELAY_MS = Math.ceil(60000 / RPM) + 500; // ~4,800ms

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const COUNTRY_NAME: Record<string, string> = {
  sg: "シンガポール", th: "タイ", my: "マレーシア", hk: "香港",
  tw: "台湾", kr: "韓国", vn: "ベトナム", au: "オーストラリア",
  ae: "UAE（ドバイ）", de: "ドイツ", gb: "イギリス", id: "インドネシア",
  us: "アメリカ", ca: "カナダ", fr: "フランス", it: "イタリア",
  nl: "オランダ", nz: "ニュージーランド", cn: "中国", in: "インド",
  pt: "ポルトガル", ph: "フィリピン", es: "スペイン", ch: "スイス",
};

type PlaceRow = {
  id: number;
  slug: string;
  name: string;
  name_ja?: string | null;
  country_code: string;
  category: string;
  area?: string | null;
  address?: string | null;
  website?: string | null;
  tags?: string[] | null;
  description?: string | null;
  detail?: string | null;
};

function buildPrompt(place: PlaceRow): string {
  const country = COUNTRY_NAME[place.country_code] || place.country_code;
  const websiteHint = place.website ? `公式サイト: ${place.website}` : "";
  const tagsStr = (place.tags || []).join("・") || "なし";

  return `以下のスポットについて、公式サイトやWebで調べて description と detail を生成してください。

【スポット情報】
店名: ${place.name}
日本語名: ${place.name_ja || "不明"}
国: ${country}
エリア: ${place.area || "不明"}
住所: ${place.address || "不明"}
カテゴリ: ${place.category}
タグ: ${tagsStr}
${websiteHint}

【出力フォーマット（必ずこの形式で返す）】
DESCRIPTION: ここに60〜120文字のdescription
DETAIL: ここに100〜250文字のdetail

【description ルール（60〜120文字厳守）】
- 1文目: 日本人向けの根拠（日本語対応・日本人経営・日本食・日系等）を必ず含める
- 2文目: 場所（駅名・地区名・商業施設名）と具体的な特徴
- 事実のみ。推測・主観・「人気」「おすすめ」は禁止

【detail ルール（100〜250文字厳守）】
- descriptionより詳細な情報（具体的なメニュー・サービス・価格帯・受賞歴等）
- 場所（ビル名・モール名・フロア・エリア）を含める
- 日本人が実際に利用する際に役立つ実用情報（営業日・予約必要性・注意点等）
- 事実のみ。推測・主観禁止`;
}

async function callGemini(prompt: string, retries = 3): Promise<{ description: string | null; detail: string | null }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
        }),
      });

      if (res.status === 429) {
        console.log("    レート制限。60秒待機...");
        await sleep(60000);
        continue;
      }
      if (!res.ok) {
        console.log(`    APIエラー ${res.status}: ${(await res.text()).slice(0, 100)}`);
        return { description: null, detail: null };
      }

      const data = await res.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

      const descMatch = text.match(/DESCRIPTION:\s*(.+)/);
      const detailMatch = text.match(/DETAIL:\s*([\s\S]+)/);

      const rawDesc = descMatch?.[1]?.replace(/^["「『]|["」』]$/g, "").trim() ?? null;
      const rawDetail = detailMatch?.[1]?.split("\n")[0]?.replace(/^["「『]|["」』]$/g, "").trim() ?? null;

      const description = rawDesc && rawDesc.length >= 60 && rawDesc.length <= 120 ? rawDesc : null;
      const detail = rawDetail && rawDetail.length >= 80 && rawDetail.length <= 300 ? rawDetail : null;

      return { description, detail };
    } catch {
      if (attempt < retries - 1) await sleep(5000);
    }
  }
  return { description: null, detail: null };
}

async function main() {
  if (!GEMINI_API_KEY) { console.error("GEMINI_API_KEY が未設定"); process.exit(1); }
  if (!SUPABASE_KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY が未設定"); process.exit(1); }

  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const countryArg = get("--country");
  const limitArg = parseInt(get("--limit") ?? "0");
  const offsetArg = parseInt(get("--offset") ?? "0");
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  if (!countryArg) { console.error("--country <code> が必要です"); process.exit(1); }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 対象プレイス取得
  let query = supabase
    .from("places")
    .select("id,slug,name,name_ja,country_code,category,area,address,website,tags,description,detail")
    .eq("country_code", countryArg)
    .neq("needs_review", true);

  if (!force) {
    // description が短い OR detail が null のものを対象
    query = query.or("description.is.null,detail.is.null");
  }

  query = query.order("id").range(offsetArg, offsetArg + (limitArg > 0 ? limitArg - 1 : 4999));

  const { data: places, error } = await query;
  if (error || !places) { console.error("取得エラー:", error); process.exit(1); }

  // description が短いものに絞る（force でなければ）
  const targets = force
    ? places
    : places.filter(p => !p.description || p.description.length < 60 || !p.detail);

  console.log(`enrich-places-db 開始`);
  console.log(`  country: ${countryArg} | 対象: ${targets.length}件 | dry-run: ${dryRun} | force: ${force}`);
  console.log(`  レート: ${RPM} RPM → ${DELAY_MS}ms間隔\n`);

  let updated = 0, failed = 0, skipped = 0;

  for (let i = 0; i < targets.length; i++) {
    const place = targets[i];
    const needDesc = !place.description || place.description.length < 60;
    const needDetail = !place.detail;

    if (!force && !needDesc && !needDetail) { skipped++; continue; }

    const prompt = buildPrompt(place);
    const { description, detail } = await callGemini(prompt);

    const updateData: Record<string, string> = {};
    if (needDesc && description) updateData.description = description;
    if (needDetail && detail) updateData.detail = detail;

    if (Object.keys(updateData).length === 0) {
      console.log(`  ✗ [${i + 1}/${targets.length}] 生成失敗: ${place.name}`);
      failed++;
    } else {
      if (!dryRun) {
        const { error: upErr } = await supabase
          .from("places")
          .update(updateData)
          .eq("id", place.id);
        if (upErr) {
          console.log(`  ✗ DB更新エラー: ${place.name}: ${upErr.message}`);
          failed++;
        } else {
          console.log(`  ✓ [${i + 1}/${targets.length}] ${place.name}`);
          if (updateData.description) console.log(`    desc(${updateData.description.length}): ${updateData.description}`);
          if (updateData.detail) console.log(`    detail(${updateData.detail.length}): ${updateData.detail.slice(0, 60)}...`);
          updated++;
        }
      } else {
        console.log(`  [dry] ${place.name}`);
        if (description) console.log(`    desc: ${description}`);
        if (detail) console.log(`    detail: ${detail.slice(0, 60)}...`);
        updated++;
      }
    }

    if (i < targets.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新: ${updated} / 失敗: ${failed} / スキップ: ${skipped}`);
  if (dryRun) console.log("（dry-run のため DB 変更なし）");
}

main().catch(console.error);
