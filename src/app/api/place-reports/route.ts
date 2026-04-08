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
  comment: string | null,
  country: string,
  category: string,
  spotSlug: string
) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  resend.emails
    .send({
      from: "Kaigaijin <noreply@kaigaijin.jp>",
      to: [to],
      subject: `[スポット報告] ${spotName} - ${reportType}`,
      text: `スポット情報の報告がありました。\n\nスポット: ${spotName}\n報告タイプ: ${reportType}\nコメント: ${comment ?? "なし"}\n\nURL: https://kaigaijin.jp/${country}/place/${category}/${spotSlug}\n\n※確認後、スポットデータを更新してください。`,
    })
    .catch(() => {});
}

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  const category = req.nextUrl.searchParams.get("category");
  const slug = req.nextUrl.searchParams.get("slug");
  const visitorId = req.nextUrl.searchParams.get("visitor_id");

  if (!country || !category || !slug) {
    return NextResponse.json({ visited: 0 }, { status: 400 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/place_reports?country=eq.${encodeURIComponent(country)}&category=eq.${encodeURIComponent(category)}&spot_slug=eq.${encodeURIComponent(slug)}&report_type=eq.visited&select=id,visitor_id,comment,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ visited: 0, comments: [], already_visited: false });
  }

  const data: { id: string; visitor_id: string | null; comment: string | null; created_at: string }[] = await res.json();
  const comments = data
    .filter((r) => r.comment)
    .map((r) => ({
      comment: r.comment!,
      created_at: r.created_at,
    }));
  const alreadyVisited = visitorId
    ? data.some((r) => r.visitor_id === visitorId)
    : false;
  return NextResponse.json({ visited: data.length, comments, already_visited: alreadyVisited });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { country, category, spot_slug, spot_name, report_type, comment, visitor_id } =
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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/place_reports`, {
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
        visitor_id: visitor_id || null,
        status: "pending",
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "保存に失敗しました" },
        { status: 500 }
      );
    }

    sendNotification(spot_name, report_type, comment?.trim() || null, country, category, spot_slug);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 }
    );
  }
}
