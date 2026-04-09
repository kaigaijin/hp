import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function getToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  return h?.startsWith("Bearer ") ? h.slice(7) : null;
}

// GET: ログイン済みユーザーのお気に入り一覧
export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

  const { data, error } = await supabase
    .from("place_favorites")
    .select("id, country, category, slug, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });

  return NextResponse.json({ favorites: data });
}

// POST: お気に入りに追加
export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

  const { country, category, slug } = await req.json();
  if (!country || !category || !slug) {
    return NextResponse.json({ error: "country/category/slug が必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("place_favorites")
    .upsert({ user_id: user.id, country, category, slug }, { onConflict: "user_id,country,category,slug" });

  if (error) return NextResponse.json({ error: "追加に失敗しました" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE: お気に入りから削除
export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const supabase = getSupabase(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });

  const { country, category, slug } = await req.json();
  if (!country || !category || !slug) {
    return NextResponse.json({ error: "country/category/slug が必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("place_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("country", country)
    .eq("category", category)
    .eq("slug", slug);

  if (error) return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
