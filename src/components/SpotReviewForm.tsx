"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  Send,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import SpotScoreDisplay, { StarRating } from "@/components/SpotScore";
import { useAuth } from "@/components/AuthProvider";
import type { SpotScore } from "@/lib/review-score";

// reviewer_id をブラウザごとに生成・永続化（未ログインユーザー用）
function getLocalReviewerId(): string {
  if (typeof window === "undefined") return "";
  const key = "kaigaijin_reviewer_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

type ReviewDisplay = {
  id: string;
  reviewer_id?: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export default function SpotReviewForm({
  country,
  category,
  spotSlug,
  spotName,
}: {
  country: string;
  category: string;
  spotSlug: string;
  spotName: string;
}) {
  const { user, displayName } = useAuth();
  const [score, setScore] = useState<SpotScore | null>(null);
  const [reviews, setReviews] = useState<ReviewDisplay[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // フォーム
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/spot-reviews?country=${country}&category=${category}&slug=${spotSlug}`
      );
      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setReviews(data.reviews ?? []);
      }
    } catch {}
  }, [country, category, spotSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 投稿済み判定（user変更時にも再判定）
  useEffect(() => {
    if (reviews.length === 0) {
      setAlreadyReviewed(false);
      return;
    }
    const myId = user ? user.id : getLocalReviewerId();
    if (!myId) {
      setAlreadyReviewed(false);
      return;
    }
    setAlreadyReviewed(reviews.some((r) => r.reviewer_id === myId));
  }, [reviews, user]);

  // 表示名（ログイン中: ニックネーム、未ログイン: 匿名）
  const reviewerName = user ? (displayName ?? "匿名") : "匿名";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("評価を選択してください");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/spot-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          category,
          spot_slug: spotSlug,
          reviewer_id: user ? user.id : getLocalReviewerId(),
          reviewer_name: reviewerName,
          rating,
          comment: comment.trim() || null,
        }),
      });
      if (res.ok) {
        setComment("");
        setRating(0);
        setShowForm(false);
        setSubmitted(true);
        setAlreadyReviewed(true);
        setTimeout(() => setSubmitted(false), 3000);
      } else if (res.status === 409) {
        setError("このスポットには既にレビューを投稿済みです");
        setAlreadyReviewed(true);
        setShowForm(false);
      } else {
        const data = await res.json();
        setError(data.error || "送信に失敗しました");
      }
    } catch {
      setError("送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
      {/* スコア表示 */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-amber-400" fill="currentColor" />
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">
              レビュー
            </span>
          </div>
        </div>

        <SpotScoreDisplay score={score} />

        {/* レビューを書くボタン / 投稿済み表示 */}
        {!showForm && !submitted && (
          alreadyReviewed ? (
            <p className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-stone-400 dark:text-stone-500 text-sm rounded-lg border border-stone-200 dark:border-stone-700">
              <CheckCircle size={14} />
              レビュー投稿済み
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800"
            >
              <Star size={14} />
              レビューを書く
            </button>
          )
        )}

        {submitted && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
            <CheckCircle size={12} />
            レビューを投稿しました!
          </p>
        )}
      </div>

      {/* レビュー投稿フォーム */}
      {showForm && (
        <div className="px-5 pb-4 border-t border-stone-100 dark:border-stone-700 pt-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* 星評価 */}
            <div>
              <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">
                評価
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(n)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={
                        n <= (hoverRating || rating)
                          ? "text-amber-400"
                          : "text-stone-200 dark:text-stone-600"
                      }
                      fill={
                        n <= (hoverRating || rating) ? "currentColor" : "currentColor"
                      }
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    {rating}.0
                  </span>
                )}
              </div>
            </div>

            {/* 投稿者名表示 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 dark:text-stone-500">投稿者:</span>
              <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                {reviewerName}
              </span>
              {!user && (
                <span className="text-xs text-stone-400">
                  （ログインするとニックネームで投稿）
                </span>
              )}
            </div>

            {/* コメント */}
            <div>
              <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">
                コメント（任意）
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="お店の感想、おすすめポイントなど"
                maxLength={2000}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y placeholder:text-stone-400"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                投稿する
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setRating(0);
                  setComment("");
                  setError("");
                }}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                やめる
              </button>
            </div>
          </form>
        </div>
      )}

      {/* レビュー一覧 */}
      {reviews.length > 0 && (
        <div className="px-5 pb-4 border-t border-stone-100 dark:border-stone-700 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare size={12} className="text-stone-400" />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              みんなのレビュー
            </span>
          </div>
          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <div key={review.id} className="pb-3 border-b border-stone-50 dark:border-stone-700/50 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                    {review.reviewer_name}
                  </span>
                  <StarRating score={review.rating} size={10} />
                  <span className="text-xs text-stone-400">
                    {new Date(review.created_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
          {reviews.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="flex items-center gap-1 text-xs text-ocean-600 dark:text-ocean-400 hover:underline mt-2"
            >
              {showAllReviews ? (
                <>
                  <ChevronUp size={12} />
                  閉じる
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  他{reviews.length - 3}件のレビューを見る
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
