import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 有効な業種スラッグ（jobs.tsはfs依存のためここで直接定義）
const VALID_INDUSTRIES = [
  "restaurant", "retail", "it", "education", "hospitality",
  "beauty", "medical", "finance", "office", "other",
];
// 有効な雇用形態
const VALID_EMPLOYMENT_TYPES = ["fulltime", "parttime", "contract", "freelance"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      country,
      company,
      company_website,
      title,
      industry,
      job_type,
      employment_type,
      location,
      nearest_station,
      salary_min,
      salary_max,
      salary_currency,
      salary_type,
      language_requirement,
      description,
      requirements,
      benefits,
      contact_email,
      contact_url,
      applicant_email,
    } = body;

    // 必須項目チェック
    if (!country?.trim()) {
      return NextResponse.json({ error: "国コードが不足しています" }, { status: 400 });
    }
    if (!company?.trim()) {
      return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "求人タイトルは必須です" }, { status: 400 });
    }
    if (!industry?.trim() || !VALID_INDUSTRIES.includes(industry)) {
      return NextResponse.json({ error: "業種の選択が必要です" }, { status: 400 });
    }
    if (!job_type?.trim()) {
      return NextResponse.json({ error: "職種は必須です" }, { status: 400 });
    }
    if (!employment_type || !VALID_EMPLOYMENT_TYPES.includes(employment_type)) {
      return NextResponse.json({ error: "雇用形態の選択が必要です" }, { status: 400 });
    }
    if (!location?.trim()) {
      return NextResponse.json({ error: "勤務地は必須です" }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json({ error: "求人詳細は必須です" }, { status: 400 });
    }
    if (!applicant_email?.trim()) {
      return NextResponse.json({ error: "担当者メールアドレスは必須です" }, { status: 400 });
    }
    if (!contact_email?.trim()) {
      return NextResponse.json({ error: "応募先メールアドレスは必須です" }, { status: 400 });
    }

    // 文字数チェック
    if (company.length > 100) {
      return NextResponse.json({ error: "企業名は100文字以内で入力してください" }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: "求人タイトルは200文字以内で入力してください" }, { status: 400 });
    }
    if (description.length > 10000) {
      return NextResponse.json({ error: "求人詳細は10,000文字以内で入力してください" }, { status: 400 });
    }
    if (applicant_email.length > 254) {
      return NextResponse.json({ error: "メールアドレスが長すぎます" }, { status: 400 });
    }

    // payloadとして保存する項目
    const payload = {
      company_website: company_website?.trim() || null,
      job_type: job_type.trim(),
      employment_type,
      location: location.trim(),
      nearest_station: nearest_station?.trim() || null,
      salary_min: salary_min ? Number(salary_min) : null,
      salary_max: salary_max ? Number(salary_max) : null,
      salary_currency: salary_currency?.trim() || null,
      salary_type: salary_type?.trim() || null,
      language_requirement: language_requirement?.trim() || null,
      description: description.trim(),
      requirements: requirements?.trim() || null,
      benefits: benefits?.trim() || null,
      contact_email: contact_email?.trim() || null,
      contact_url: contact_url?.trim() || null,
    };

    // Supabaseに保存
    const res = await fetch(`${SUPABASE_URL}/rest/v1/job_submissions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        country: country.trim(),
        industry: industry.trim(),
        company: company.trim(),
        title: title.trim(),
        payload,
        contact_email: applicant_email.trim(),
        status: "pending",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[jobs/submit] Supabase error:", errText);
      return NextResponse.json(
        { error: "データの保存に失敗しました。しばらく経ってからお試しください" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[jobs/submit] unexpected error:", err);
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 }
    );
  }
}
