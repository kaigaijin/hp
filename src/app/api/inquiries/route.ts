import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const SUPABASE_URL =
  process.env.INQUIRY_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_KEY =
  process.env.INQUIRY_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const TYPE_LABELS: Record<string, string> = {
  advertise: "広告掲載",
  feedback: "記事へのご意見",
  press: "取材・メディア",
  other: "その他",
};

function sendNotification(
  type: string,
  name: string,
  email: string,
  company: string,
  message: string
) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  const label = TYPE_LABELS[type] || type;
  resend.emails
    .send({
      from: "Kaigaijin <noreply@kaigaijin.jp>",
      to: [to],
      subject: `[${label}] ${company || name} — Kaigaijin`,
      text: `Kaigaijinにお問い合わせがありました。\n\n種別: ${label}\n氏名: ${name}\n会社名: ${company || "未入力"}\nメール: ${email}\n\n--- メッセージ ---\n${message}\n\n※ Supabase inquiries テーブルにも保存済みです。`,
    })
    .then((result) => {
      console.log("[Resend] 送信成功:", JSON.stringify(result));
    })
    .catch((err) => {
      console.error("[Resend] 送信失敗:", err);
    });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, company, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      return NextResponse.json(
        { error: "文字数制限を超えています" },
        { status: 400 }
      );
    }

    const inquiryType = type?.trim() || "other";

    // Supabaseに保存
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        project: "kaigaijin",
        type: inquiryType,
        name: name.trim(),
        email: email.trim(),
        company: company?.trim() || null,
        message: message.trim(),
        status: "new",
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "保存に失敗しました" },
        { status: 500 }
      );
    }

    sendNotification(
      inquiryType,
      name.trim(),
      email.trim(),
      company?.trim() || "",
      message.trim()
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 }
    );
  }
}
