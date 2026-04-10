import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  calcplaceScore,
  aggregateReviewerStats,
  type Review,
  type placeScore,
} from "@/lib/review-score";

const SUPABASE_URL =
  process.env.INQUIRY_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_KEY =
  process.env.INQUIRY_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

function sendReviewNotification(
  country: string,
  category: string,
  placeSlug: string,
  reviewerName: string,
  rating: number,
  comment: string | null
) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFICATION_EMAIL;
  if (!key || !to) return;
  const resend = new Resend(key);
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  resend.emails
    .send({
      from: "Kaigaijin <noreply@kaigaijin.jp>",
      to: [to],
      subject: `[レビュー] ${country}/${category}/${placeSlug} — ${stars}`,
      text: `新しいレビューが投稿されました。\n\n投稿者: ${reviewerName}\n評価: ${stars}（${rating}/5）\nコメント: ${comment ?? "なし"}\n\nURL: https://kaigaijin.jp/${country}/place/${category}/${placeSlug}\n\n※ Supabase place_reviews テーブルにも保存済みです。`,
    })
    .catch(() => {});
}

type ReviewRow = {
  id: string;
  place_country: string;
  place_category: string;
  place_slug: string;
  reviewer_id: string;
  reviewer_name: string;
  is_anonymous: boolean;
  rating: number;
  comment: string | null;
  created_at: string;
};

// GET: スポットのレビュー一覧 + スコアを取得
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get("country");
  const category = req.nextUrl.searchParams.get("category");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!country || !category || !slug) {
    return NextResponse.json(
      { error: "country, category, slug は必須です" },
      { status: 400 }
    );
  }

  // このスポットのレビューを取得
  const placeRes = await fetch(
    `${SUPABASE_URL}/rest/v1/place_reviews?place_country=eq.${encodeURIComponent(country)}&place_category=eq.${encodeURIComponent(category)}&place_slug=eq.${encodeURIComponent(slug)}&select=id,place_country,place_category,place_slug,reviewer_id,reviewer_name,is_anonymous,rating,comment,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!placeRes.ok) {
    return NextResponse.json({ score: null, reviews: [] });
  }

  const placeReviews: ReviewRow[] = await placeRes.json();

  if (placeReviews.length === 0) {
    return NextResponse.json({
      score: { raw_average: 0, weighted_score: 0, review_count: 0, display: false } as placeScore,
      reviews: [],
    });
  }

  // レビュアーの全レビューを取得（信頼度計算用）
  const reviewerIds = [...new Set(placeReviews.map((r) => r.reviewer_id))];
  const reviewerFilter = reviewerIds
    .map((id) => `"${id}"`)
    .join(",");

  const allRes = await fetch(
    `${SUPABASE_URL}/rest/v1/place_reviews?reviewer_id=in.(${reviewerFilter})&select=id,place_country,place_category,place_slug,reviewer_id,rating,comment,created_at`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  let reviewerStatsMap = new Map();

  if (allRes.ok) {
    const allReviews: Review[] = await allRes.json();
    reviewerStatsMap = aggregateReviewerStats(allReviews);
  }

  // スコア計算
  const reviews: Review[] = placeReviews.map((r) => ({
    id: r.id,
    place_country: r.place_country,
    place_category: r.place_category,
    place_slug: r.place_slug,
    reviewer_id: r.reviewer_id,
    is_anonymous: r.is_anonymous ?? true,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
  }));

  const score = calcplaceScore(reviews, reviewerStatsMap);

  return NextResponse.json({
    score,
    reviews: placeReviews.map((r) => {
      const stats = reviewerStatsMap.get(r.reviewer_id);
      return {
        id: r.id,
        reviewer_id: r.reviewer_id,
        reviewer_name: r.reviewer_name,
        is_anonymous: r.is_anonymous ?? true,
        reviewer_total_reviews: stats?.total_reviews ?? 1,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      };
    }),
  });
}

// POST: レビューを投稿
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      country,
      category,
      place_slug,
      reviewer_id,
      reviewer_name,
      is_anonymous,
      rating,
      comment,
    } = body;

    // バリデーション
    if (!country || !category || !place_slug || !reviewer_id || !reviewer_name) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "評価は1〜5の整数で指定してください" },
        { status: 400 }
      );
    }

    if (reviewer_name.length > 50) {
      return NextResponse.json(
        { error: "表示名は50文字以内で入力してください" },
        { status: 400 }
      );
    }

    if (comment && comment.length > 2000) {
      return NextResponse.json(
        { error: "コメントは2000文字以内で入力してください" },
        { status: 400 }
      );
    }

    // 同一reviewer_idで同一スポットへの重複投稿チェック
    const dupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/place_reviews?reviewer_id=eq.${encodeURIComponent(reviewer_id)}&place_country=eq.${encodeURIComponent(country)}&place_category=eq.${encodeURIComponent(category)}&place_slug=eq.${encodeURIComponent(place_slug)}&select=id&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (dupRes.ok) {
      const existing = await dupRes.json();
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "このスポットには既にレビューを投稿済みです" },
          { status: 409 }
        );
      }
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/place_reviews`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        place_country: country,
        place_category: category,
        place_slug,
        reviewer_id,
        reviewer_name: reviewer_name.trim(),
        is_anonymous: is_anonymous !== false, // 明示的に false でない限り匿名扱い
        rating: ratingNum,
        comment: comment?.trim() || null,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "保存に失敗しました" },
        { status: 500 }
      );
    }

    sendReviewNotification(country, category, place_slug, reviewer_name.trim(), ratingNum, comment?.trim() || null);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです" },
      { status: 400 }
    );
  }
}
