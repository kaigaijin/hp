import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

const REVIEW_PASSWORD = process.env.REVIEW_PASSWORD || "zh2026";

function unauthorized() {
  return NextResponse.json({ error: "認証エラー" }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("x-review-password");
  return auth === REVIEW_PASSWORD;
}

// GET /api/review — 全プレイスを取得（フィルタ対応、1000件制限回避）
// ?mode=count で件数のみ返す（stats用）
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const filter = searchParams.get("filter") || "unreviewed";
  const country = searchParams.get("country");
  const category = searchParams.get("category");

  const supabase = getSupabaseServer();

  // countモード: 全ステータスの件数を一括返却
  if (mode === "count") {
    const [totalRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from("places").select("id", { count: "exact", head: true }).neq("status", "deleted"),
      supabase.from("places").select("id", { count: "exact", head: true }).neq("status", "deleted").eq("human_review_result", "approved"),
      supabase.from("places").select("id", { count: "exact", head: true }).neq("status", "deleted").eq("human_review_result", "rejected"),
    ]);
    const total = totalRes.count ?? 0;
    const approved = approvedRes.count ?? 0;
    const rejected = rejectedRes.count ?? 0;
    return NextResponse.json({ total, approved, rejected, unreviewed: total - approved - rejected });
  }

  // 通常モード: ページネーションで全件取得
  const PAGE_SIZE = 1000;
  const allData: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("places")
      .select("id, slug, name, name_ja, country_code, category, area, address, website, source_url, description, tags, hours, status, phone, human_reviewed, human_review_result, human_reviewed_at, needs_review")
      .neq("status", "deleted")
      .order("country_code")
      .order("category")
      .order("name")
      .range(from, from + PAGE_SIZE - 1);

    if (filter === "unreviewed") {
      query = query.eq("human_reviewed", false);
    } else if (filter === "approved") {
      query = query.eq("human_review_result", "approved");
    } else if (filter === "rejected") {
      query = query.eq("human_review_result", "rejected");
    }

    if (country) {
      query = query.eq("country_code", country);
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return NextResponse.json({ places: allData });
}

// POST /api/review — プレイスを承認/却下
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const { id, action } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ error: "id と action が必要です" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action は approve または reject のみ" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    if (action === "reject") {
      const { error } = await supabase
        .from("places")
        .update({
          human_reviewed: true,
          human_review_result: "rejected",
          human_reviewed_at: new Date().toISOString(),
          status: "deleted",
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "rejected" });
    }

    // approve
    const { error } = await supabase
      .from("places")
      .update({
        human_reviewed: true,
        human_review_result: "approved",
        human_reviewed_at: new Date().toISOString(),
        needs_review: false,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "approved" });
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
}
