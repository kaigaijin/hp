"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { StarRating } from "@/components/SpotScore";
import { supabase } from "@/lib/supabase";
import { Star, MessageSquare, TrendingUp, LogIn, Zap } from "lucide-react";
import Link from "next/link";

type MyReview = {
  id: string;
  spot_country: string;
  spot_category: string;
  spot_slug: string;
  reviewer_name: string;
  is_anonymous: boolean;
  rating: number;
  comment: string | null;
  created_at: string;
};

// レビュー数 → 影響係数（review-score.ts の calcCountWeight と同じ式）
function calcInfluence(count: number): number {
  if (count <= 0) return Math.min(1.0, Math.log(2) / Math.log(51)); // 1件相当
  return Math.min(1.0, Math.log(1 + count) / Math.log(51));
}

// 影響係数を「×N倍」表示（匿名の0.1基準）
function influenceMultiplier(count: number): string {
  const x = calcInfluence(count) / 0.1;
  if (x >= 9.95) return "×10";
  return `×${x.toFixed(1)}`;
}

// レビュー数からバッジラベルを返す
function getBadge(count: number): { label: string; className: string } | null {
  if (count >= 30)
    return {
      label: "★ベテラン",
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    };
  if (count >= 10)
    return {
      label: "★常連",
      className:
        "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400",
    };
  if (count >= 5)
    return {
      label: "★レビュアー",
      className:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    };
  return null;
}

// 次のステップ情報（残り件数 + 到達後の係数）
type NextStep = { remaining: number; multiplierAt: string; progressPct: number };
function nextStepInfo(count: number): NextStep | null {
  const steps = [5, 10, 30];
  const prev = [0, 5, 10];
  for (let i = 0; i < steps.length; i++) {
    if (count < steps[i]) {
      const pct = ((count - prev[i]) / (steps[i] - prev[i])) * 100;
      return {
        remaining: steps[i] - count,
        multiplierAt: influenceMultiplier(steps[i]),
        progressPct: Math.max(0, Math.min(100, pct)),
      };
    }
  }
  return null;
}

// 国コード → 国名
const COUNTRY_NAMES: Record<string, string> = {
  sg: "シンガポール",
  th: "タイ",
  my: "マレーシア",
  kr: "韓国",
  tw: "台湾",
  hk: "香港",
  au: "オーストラリア",
  ae: "UAE",
  vn: "ベトナム",
};

export default function MyReviewsPage() {
  const { user, loading, displayName } = useAuth();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function fetchReviews() {
      setFetching(true);
      setError("");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError("セッションが切れています。再ログインしてください。");
          return;
        }
        const res = await fetch("/api/my-reviews", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews ?? []);
        } else {
          setError("取得に失敗しました");
        }
      } catch {
        setError("取得に失敗しました");
      } finally {
        setFetching(false);
      }
    }

    fetchReviews();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-warm-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <LogIn size={32} className="text-stone-300" />
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          マイレビューを見るにはログインが必要です
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500">
          右上のログインボタンからログインしてください
        </p>
      </div>
    );
  }

  const total = reviews.length;
  const badge = getBadge(total);
  const next = nextStepInfo(total);
  const currentMultiplier = influenceMultiplier(Math.max(1, total));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-1">
          マイレビュー
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {displayName} さんの投稿レビュー
        </p>
      </div>

      {/* 実績カード */}
      <div className="mb-6 p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
        {/* 件数 + バッジ */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400" fill="currentColor" />
            <span className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {total}
            </span>
            <span className="text-sm text-stone-500 dark:text-stone-400">件</span>
          </div>
          {badge && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* 現在の影響係数 */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2.5 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
          <Zap size={14} className="text-amber-500 shrink-0" fill="currentColor" />
          <div>
            <span className="text-xs text-stone-500 dark:text-stone-400">現在のスコア影響係数 </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {total === 0 ? "×1.5" : currentMultiplier}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500 ml-1">
              （匿名投稿の{total === 0 ? "1.5" : currentMultiplier.replace("×", "")}倍）
            </span>
          </div>
        </div>

        {/* 次のステップへの進捗 */}
        {next ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-stone-400" />
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  あと<strong className="text-stone-700 dark:text-stone-300 mx-0.5">{next.remaining}件</strong>投稿すると係数が
                  <strong className="text-amber-600 dark:text-amber-400 ml-0.5">{next.multiplierAt}</strong>に上がる
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${next.progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Star size={11} fill="currentColor" />
            最大係数に到達しました。すべてのレビューが最高影響力で反映されています
          </p>
        )}
      </div>

      {/* レビュー一覧 */}
      {fetching ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 rounded-full border-2 border-warm-500 border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare size={32} className="text-stone-200 dark:text-stone-700 mx-auto mb-3" />
          <p className="text-sm text-stone-400 dark:text-stone-500">
            まだレビューがありません
          </p>
          <p className="text-xs text-stone-300 dark:text-stone-600 mt-1">
            スポット詳細ページからレビューを投稿できます
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link
                  href={`/${review.spot_country}/place/${review.spot_category}/${review.spot_slug}`}
                  className="text-sm font-medium text-warm-600 dark:text-warm-400 hover:underline"
                >
                  {COUNTRY_NAMES[review.spot_country] ?? review.spot_country} /{" "}
                  {review.spot_slug}
                </Link>
                <StarRating score={review.rating} size={12} />
              </div>
              {review.comment && (
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-2">
                  {review.comment}
                </p>
              )}
              <p className="text-xs text-stone-400 dark:text-stone-500">
                {new Date(review.created_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
