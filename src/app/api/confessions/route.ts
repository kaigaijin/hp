import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { questions } from "@/lib/confessions";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

function sendNotification(questionId: string, text: string, country: string | null, nickname: string | null, isAnonymous: boolean) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  const question = questions.find((q) => q.id === questionId);
  const questionText = question?.text ?? questionId;
  const poster = isAnonymous ? "匿名" : (nickname ?? "匿名");
  const countryStr = country ? ` (${country})` : "";
  resend.emails.send({
    from: "Kaigaijin <noreply@kaigaijin.jp>",
    to: [to],
    subject: `[Confessions] ${questionText.slice(0, 30)}...`,
    text: `新しいConfessions投稿がありました。\n\n質問: ${questionText}\n投稿者: ${poster}${countryStr}\n\n${text}\n\nURL: https://kaigaijin.jp/confessions\n\n※即時公開されています。問題がある場合は削除してください。`,
  }).catch(() => {});
}

// 投稿一覧取得
export async function GET(req: NextRequest) {
  const supabase = getClient();
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("question_id");

  const query = supabase
    .from("confessions")
    .select("id, question_id, body, country, nickname, is_anonymous, likes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (questionId) query.eq("question_id", questionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 投稿
export async function POST(req: NextRequest) {
  const supabase = getClient();
  const body = await req.json();
  const { question_id, text, country, nickname, is_anonymous } = body;

  if (!question_id || !text?.trim()) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  if (text.trim().length > 1000) {
    return NextResponse.json({ error: "1000文字以内で入力してください" }, { status: 400 });
  }

  const { error } = await supabase.from("confessions").insert({
    question_id,
    body: text.trim(),
    country: country || null,
    nickname: is_anonymous ? null : (nickname || null),
    is_anonymous: is_anonymous ?? true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  sendNotification(question_id, text.trim(), country || null, nickname || null, is_anonymous ?? true);
  return NextResponse.json({ ok: true });
}

// いいね（SQL関数でアトミックにインクリメント）
export async function PATCH(req: NextRequest) {
  const supabase = getClient();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.rpc("increment_confession_likes", { confession_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
