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

// GET /api/review — 全プレイスを取得（フィルタ対応）
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "unreviewed"; // unreviewed | approved | rejected | all
  const country = searchParams.get("country");
  const category = searchParams.get("category");

  const supabase = getSupabaseServer();
  let query = supabase
    .from("places")
    .select("id, slug, name, name_ja, country_code, category, area, address, website, source_url, description, tags, hours, status, phone, human_reviewed, human_review_result, human_reviewed_at, needs_review")
    .neq("status", "deleted")
    .order("country_code")
    .order("category")
    .order("name");

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

  return NextResponse.json({ places: data ?? [] });
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
