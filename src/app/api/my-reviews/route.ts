import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.INQUIRY_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_KEY =
  process.env.INQUIRY_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

type ReviewRow = {
  id: string;
  place_country: string;
  place_category: string;
  place_slug: string;
  reviewer_name: string;
  is_anonymous: boolean;
  rating: number;
  comment: string | null;
  created_at: string;
};

// GET: ログイン済みユーザーの投稿レビュー一覧
// Authorization: Bearer <access_token> が必要
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // ユーザーのアクセストークンで Supabase クライアントを生成（RLSが不要な場合でも本人確認に使う）
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  // アクセストークンからユーザー情報を取得
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  // このユーザーのレビューを取得
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/place_reviews?reviewer_id=eq.${encodeURIComponent(user.id)}&select=id,place_country,place_category,place_slug,reviewer_name,is_anonymous,rating,comment,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }

  const reviews: ReviewRow[] = await res.json();

  return NextResponse.json({
    reviews,
    total: reviews.length,
  });
}
