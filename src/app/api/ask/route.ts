import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

function sendNotification(body: string, nickname: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  const poster = nickname ?? "匿名";
  resend.emails.send({
    from: "Kaigaijin <noreply@kaigaijin.jp>",
    to: [to],
    subject: `[匿名質問箱] 新しい質問: ${body.slice(0, 40)}…`,
    text: `新しい質問が投稿されました。\n\n投稿者: ${poster}\n\n${body}\n\nURL: https://kaigaijin.jp/ask\n\n※即時公開されています。問題がある場合は削除してください。`,
  }).catch(() => {});
}

// 質問一覧取得
export async function GET() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, category, is_official, nickname, is_anonymous, answer_count, likes, created_at")
    .order("is_official", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 質問投稿
export async function POST(req: NextRequest) {
  const supabase = getClient();
  const body = await req.json();
  const { text, category, nickname, is_anonymous } = body;

  if (!text?.trim()) {
    return NextResponse.json({ error: "質問を入力してください" }, { status: 400 });
  }
  if (text.trim().length > 200) {
    return NextResponse.json({ error: "200文字以内で入力してください" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      body: text.trim(),
      category: category || "その他",
      is_official: false,
      nickname: is_anonymous ? null : (nickname || null),
      is_anonymous: is_anonymous ?? true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  sendNotification(text.trim(), is_anonymous ? null : (nickname || null));
  return NextResponse.json({ ok: true, id: data.id });
}
