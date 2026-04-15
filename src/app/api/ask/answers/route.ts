import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key);
}

function sendNotification(questionBody: string, answerBody: string, nickname: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  const poster = nickname ?? "匿名";
  resend.emails.send({
    from: "Kaigaijin <noreply@kaigaijin.jp>",
    to: [to],
    subject: `[匿名質問箱] 新しい回答: ${questionBody.slice(0, 30)}…`,
    text: `新しい回答が投稿されました。\n\n質問: ${questionBody}\n投稿者: ${poster}\n\n${answerBody}\n\n※即時公開されています。問題がある場合は削除してください。`,
  }).catch(() => {});
}

// 回答一覧取得（question_id指定）
export async function GET(req: NextRequest) {
  const supabase = getClient();
  const questionId = req.nextUrl.searchParams.get("question_id");
  if (!questionId) return NextResponse.json({ error: "question_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("answers")
    .select("id, question_id, body, country, nickname, is_anonymous, likes, created_at")
    .eq("question_id", questionId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// 回答投稿
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

  const { error } = await supabase.from("answers").insert({
    question_id,
    body: text.trim(),
    country: country || null,
    nickname: is_anonymous ? null : (nickname || null),
    is_anonymous: is_anonymous ?? true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 回答数インクリメント
  await supabase.rpc("increment_question_answer_count", { question_id });

  // 質問本文を取得して通知
  const { data: q } = await supabase
    .from("questions")
    .select("body")
    .eq("id", question_id)
    .single();
  sendNotification(q?.body ?? "", text.trim(), is_anonymous ? null : (nickname || null));

  return NextResponse.json({ ok: true });
}

// いいね
export async function PATCH(req: NextRequest) {
  const supabase = getClient();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.rpc("increment_answer_likes", { answer_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
