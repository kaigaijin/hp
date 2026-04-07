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

function sendToEmployer(
  contactEmail: string,
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  message: string | null
) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !contactEmail) return;
  const resend = new Resend(key);
  resend.emails
    .send({
      from: "Kaigaijin <noreply@kaigaijin.jp>",
      to: [contactEmail],
      subject: `【Kaigaijin求人】「${jobTitle}」への応募がありました`,
      text: `${applicantName} 様より、「${jobTitle}」への応募がありました。\n\n■ 応募者情報\n名前: ${applicantName}\nメール: ${applicantEmail}\n\n■ メッセージ\n${message || "（メッセージなし）"}\n\n---\nこのメールはKaigaijinの求人応募フォームから自動送信されました。\n応募者へのご連絡は上記メールアドレスに直接返信してください。`,
    })
    .then((result) => {
      console.log("[Resend] 求人者への転送成功:", JSON.stringify(result));
    })
    .catch((err) => {
      console.error("[Resend] 求人者への転送失敗:", err);
    });
}

function sendAdminNotification(
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  message: string | null
) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  resend.emails
    .send({
      from: "Kaigaijin <noreply@kaigaijin.jp>",
      to: [to],
      subject: `[求人応募] 「${jobTitle}」— ${applicantName}`,
      text: `Kaigaijinの求人「${jobTitle}」に応募がありました。\n\n応募者: ${applicantName}\nメール: ${applicantEmail}\nメッセージ: ${message || "（なし）"}\n\n※ Supabase job_applications テーブルにも保存済みです。`,
    })
    .then((result) => {
      console.log("[Resend] 管理者通知送信成功:", JSON.stringify(result));
    })
    .catch((err) => {
      console.error("[Resend] 管理者通知送信失敗:", err);
    });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobSlug, jobTitle, country, industry, applicantName, applicantEmail, message } = body;

    // 必須バリデーション
    if (
      !jobSlug?.trim() ||
      !jobTitle?.trim() ||
      !country?.trim() ||
      !industry?.trim() ||
      !applicantName?.trim() ||
      !applicantEmail?.trim()
    ) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    if (
      applicantName.length > 100 ||
      applicantEmail.length > 254 ||
      (message && message.length > 2000)
    ) {
      return NextResponse.json(
        { error: "文字数制限を超えています" },
        { status: 400 }
      );
    }

    // job_applications テーブルに保存
    const res = await fetch(`${SUPABASE_URL}/rest/v1/job_applications`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        job_slug: jobSlug.trim(),
        job_title: jobTitle.trim(),
        country: country.trim(),
        industry: industry.trim(),
        applicant_name: applicantName.trim(),
        applicant_email: applicantEmail.trim(),
        message: message?.trim() || null,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Supabase] 保存失敗:", errText);
      return NextResponse.json(
        { error: "保存に失敗しました" },
        { status: 500 }
      );
    }

    // jobs テーブルから contact_email を取得して求人者に転送
    const jobRes = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?country=eq.${encodeURIComponent(country.trim())}&industry=eq.${encodeURIComponent(industry.trim())}&slug=eq.${encodeURIComponent(jobSlug.trim())}&select=contact_email`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (jobRes.ok) {
      const jobs = await jobRes.json();
      const contactEmail = jobs?.[0]?.contact_email;
      if (contactEmail) {
        sendToEmployer(
          contactEmail,
          jobTitle.trim(),
          applicantName.trim(),
          applicantEmail.trim(),
          message?.trim() || null
        );
      }
    }

    // 管理者通知（fire-and-forget）
    sendAdminNotification(
      jobTitle.trim(),
      applicantName.trim(),
      applicantEmail.trim(),
      message?.trim() || null
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 }
    );
  }
}
