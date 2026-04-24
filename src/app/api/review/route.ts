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

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const from = (page - 1) * pageSize;

  let countQuery = supabase
    .from("places")
    .select("id", { count: "exact", head: true })
    .neq("status", "deleted");

  let query = supabase
    .from("places")
    .select("id, slug, name, name_ja, country_code, category, area, address, website, source_url, description, tags, hours, status, phone, human_reviewed, human_review_result, human_reviewed_at, needs_review")
    .neq("status", "deleted")
    .order("country_code")
    .order("category")
    .order("name")
    .range(from, from + pageSize - 1);

  if (filter === "unreviewed") {
    query = query.eq("human_reviewed", false);
    countQuery = countQuery.eq("human_reviewed", false);
  } else if (filter === "approved") {
    query = query.eq("human_review_result", "approved");
    countQuery = countQuery.eq("human_review_result", "approved");
  } else if (filter === "rejected") {
    query = query.eq("human_review_result", "rejected");
    countQuery = countQuery.eq("human_review_result", "rejected");
  }

  if (country) {
    query = query.eq("country_code", country);
    countQuery = countQuery.eq("country_code", country);
  }
  if (category) {
    query = query.eq("category", category);
    countQuery = countQuery.eq("category", category);
  }

  const [{ data, error }, { count }] = await Promise.all([query, countQuery]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalCount = count ?? 0;
  return NextResponse.json({
    places: data ?? [],
    pagination: { page, pageSize, total: totalCount, totalPages: Math.ceil(totalCount / pageSize) },
  });
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
