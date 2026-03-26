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

const VALID_REPORT_TYPES = ["visited", "closed", "correction"] as const;

function sendNotification(
  spotName: string,
  reportType: string,
  comment: string | null
) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  resend.emails
    .send({
      from: "Kaigaijin <noreply@kaigaijin.com>",
      to: [to],
      subject: `[スポット報告] ${spotName} - ${reportType}`,
      text: `スポット情報の報告がありました。\n\nスポット: ${spotName}\n報告タイプ: ${reportType}\nコメント: ${comment ?? "なし"}\n\n※確認後、スポットデータを更新してください。`,
    })
    .catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { country, category, spot_slug, spot_name, report_type, comment } =
      body;

    if (!country || !category || !spot_slug || !spot_name || !report_type) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    if (
      !VALID_REPORT_TYPES.includes(
        report_type as (typeof VALID_REPORT_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "不正な報告タイプです" },
        { status: 400 }
      );
    }

    if (comment && comment.length > 1000) {
      return NextResponse.json(
        { error: "コメントは1000文字以内で入力してください" },
        { status: 400 }
      );
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/spot_reports`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        country,
        category,
        spot_slug,
        spot_name,
        report_type,
        comment: comment?.trim() || null,
        status: "pending",
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "保存に失敗しました" },
        { status: 500 }
      );
    }

    sendNotification(spot_name, report_type, comment?.trim() || null);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 }
    );
  }
}
