import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const ADMIN_EMAIL = process.env.INQUIRY_NOTIFICATION_EMAIL || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = "kaigaijin/hp"; // owner/repo

const VALID_INDUSTRIES = [
  "restaurant", "retail", "it", "education", "hospitality",
  "beauty", "medical", "finance", "office", "other",
];
const VALID_EMPLOYMENT_TYPES = ["fulltime", "parttime", "contract", "freelance"];

function generateSlug(company: string): string {
  const base = company
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "job";
  const ts = Date.now().toString(36);
  return `${base}-${ts}`;
}

// ローカル環境用: ファイル直接書き込み
function appendJobLocal(countryCode: string, industry: string, job: object): void {
  const jobsDir = path.join(process.cwd(), "content", "jobs", countryCode);
  const filePath = path.join(jobsDir, `${industry}.json`);
  fs.mkdirSync(jobsDir, { recursive: true });
  let existing: object[] = [];
  if (fs.existsSync(filePath)) {
    try { existing = JSON.parse(fs.readFileSync(filePath, "utf-8")); } catch { existing = []; }
  }
  existing.push(job);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");
}

// 本番環境用: GitHub API経由でコミット
async function appendJobViaGitHub(countryCode: string, industry: string, job: object): Promise<void> {
  const filePath = `content/jobs/${countryCode}/${industry}.json`;
  const apiBase = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // 既存ファイルを取得
  let existing: object[] = [];
  let sha: string | undefined;
  const getRes = await fetch(apiBase, { headers });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    existing = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub GET failed: ${getRes.status}`);
  }

  existing.push(job);
  const content = Buffer.from(JSON.stringify(existing, null, 2)).toString("base64");

  const putRes = await fetch(apiBase, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `求人追加: ${(job as { title: string }).title}`,
      content,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub PUT failed: ${putRes.status} ${errText}`);
  }
}

// メール送信
function sendEmails(params: {
  applicantEmail: string;
  contactEmail: string;
  company: string;
  title: string;
  jobUrl: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const resend = new Resend(key);
  const { applicantEmail, contactEmail, company, title, jobUrl } = params;

  if (ADMIN_EMAIL) {
    resend.emails.send({
      from: "Kaigaijin <noreply@kaigaijin.jp>",
      to: [ADMIN_EMAIL],
      subject: `[求人掲載] ${company} — ${title}`,
      text: [
        "新しい求人が掲載されました。",
        "",
        `企業名: ${company}`,
        `求人タイトル: ${title}`,
        `応募先メール: ${contactEmail}`,
        `掲載者メール: ${applicantEmail}`,
        "",
        `掲載URL: ${jobUrl}`,
      ].join("\n"),
    }).catch((err) => console.error("[jobs/submit] 管理者メール送信失敗:", err));
  }

  resend.emails.send({
    from: "Kaigaijin <noreply@kaigaijin.jp>",
    to: [applicantEmail],
    subject: `【掲載完了】${title} — Kaigaijin`,
    text: [
      `${company} ご担当者様`,
      "",
      "求人情報をKaigaijinに掲載しました。",
      "",
      `求人タイトル: ${title}`,
      `掲載URL: ${jobUrl}`,
      "",
      "掲載内容の修正・削除をご希望の場合は、このメールに返信してください。",
      "",
      "— Kaigaijin 運営",
    ].join("\n"),
  }).catch((err) => console.error("[jobs/submit] 掲載者メール送信失敗:", err));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      country, company, company_website, title, industry, job_type,
      employment_type, location, nearest_station, salary_min, salary_max,
      salary_currency, salary_type, language_requirement,
      description, requirements, benefits, contact_email, applicant_email,
    } = body;

    if (!country?.trim()) return NextResponse.json({ error: "国コードが不足しています" }, { status: 400 });
    if (!company?.trim()) return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: "求人タイトルは必須です" }, { status: 400 });
    if (!industry?.trim() || !VALID_INDUSTRIES.includes(industry)) return NextResponse.json({ error: "業種の選択が必要です" }, { status: 400 });
    if (!job_type?.trim()) return NextResponse.json({ error: "職種は必須です" }, { status: 400 });
    if (!employment_type || !VALID_EMPLOYMENT_TYPES.includes(employment_type)) return NextResponse.json({ error: "雇用形態の選択が必要です" }, { status: 400 });
    if (!location?.trim()) return NextResponse.json({ error: "勤務地は必須です" }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: "求人詳細は必須です" }, { status: 400 });
    if (!applicant_email?.trim()) return NextResponse.json({ error: "担当者メールアドレスは必須です" }, { status: 400 });
    if (!contact_email?.trim()) return NextResponse.json({ error: "応募先メールアドレスは必須です" }, { status: 400 });
    if (company.length > 100) return NextResponse.json({ error: "企業名は100文字以内で入力してください" }, { status: 400 });
    if (title.length > 200) return NextResponse.json({ error: "求人タイトルは200文字以内で入力してください" }, { status: 400 });
    if (description.length > 10000) return NextResponse.json({ error: "求人詳細は10,000文字以内で入力してください" }, { status: 400 });

    const countryCode = country.trim();
    const industrySlug = industry.trim();
    const slug = generateSlug(company.trim());
    const today = new Date().toISOString().slice(0, 10);

    const jobEntry = {
      slug,
      company: company.trim(),
      company_ja: null,
      title: title.trim(),
      industry: industrySlug,
      job_type: job_type.trim(),
      employment_type,
      location: location.trim(),
      nearest_station: nearest_station?.trim() || null,
      salary_min: salary_min ? Number(salary_min) : null,
      salary_max: salary_max ? Number(salary_max) : null,
      salary_currency: salary_currency?.trim() || "USD",
      salary_type: salary_type?.trim() || "monthly",
      language_requirement: language_requirement?.trim() || null,
      description: description.trim(),
      detail: null,
      requirements: requirements?.trim() || null,
      benefits: benefits?.trim() || null,
      contact_email: contact_email.trim(),
      contact_url: null,
      company_website: company_website?.trim() || null,
      tags: [],
      status: "active",
      source: "user_submitted",
      posted_at: today,
      expires_at: null,
      last_verified: today,
      priority: 0,
    };

    // 環境に応じてJSONに追記
    const isVercel = !!process.env.VERCEL;
    try {
      if (isVercel && GITHUB_TOKEN) {
        await appendJobViaGitHub(countryCode, industrySlug, jobEntry);
      } else {
        appendJobLocal(countryCode, industrySlug, jobEntry);
      }
    } catch (err) {
      console.error("[jobs/submit] 求人ファイル追記失敗:", err);
      return NextResponse.json(
        { error: "掲載処理に失敗しました。しばらく経ってからお試しください" },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") || "https://kaigaijin.jp";
    const jobUrl = `${origin}/${countryCode}/jobs/${industrySlug}/${slug}`;

    // Supabaseに記録
    if (SUPABASE_URL && SUPABASE_KEY) {
      fetch(`${SUPABASE_URL}/rest/v1/job_submissions`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          country: countryCode,
          industry: industrySlug,
          company: company.trim(),
          title: title.trim(),
          payload: jobEntry,
          contact_email: applicant_email.trim(),
          status: "published",
        }),
      }).catch((err) => console.error("[jobs/submit] Supabase記録失敗:", err));
    }

    // メール送信
    sendEmails({
      applicantEmail: applicant_email.trim(),
      contactEmail: contact_email.trim(),
      company: company.trim(),
      title: title.trim(),
      jobUrl,
    });

    return NextResponse.json({ success: true, jobUrl }, { status: 201 });
  } catch (err) {
    console.error("[jobs/submit] unexpected error:", err);
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
}
