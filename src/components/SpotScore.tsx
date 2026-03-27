"use client";

import { Star } from "lucide-react";
import type { SpotScore as SpotScoreType } from "@/lib/review-score";
import { getScoreLabel } from "@/lib/review-score";

// 星の表示（塗りつぶし・半分・空）
function StarRating({ score, size = 14 }: { score: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = Math.min(1, Math.max(0, score - (i - 1)));
    stars.push(
      <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
        {/* 空の星（背景） */}
        <Star
          size={size}
          className="absolute inset-0 text-stone-200 dark:text-stone-600"
          fill="currentColor"
          strokeWidth={0}
        />
        {/* 塗りつぶし（クリップで割合制御） */}
        {fill > 0 && (
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fill * 100}%` }}
          >
            <Star
              size={size}
              className="text-amber-400"
              fill="currentColor"
              strokeWidth={0}
            />
          </span>
        )}
      </span>
    );
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
}

export { StarRating };

export default function SpotScore({
  score,
  compact = false,
}: {
  score: SpotScoreType | null;
  compact?: boolean;
}) {
  // デフォルト: 2.5星（レビューが溜まるまで中間値を表示）
  const DEFAULT_SCORE = 2.5;

  // データなし or レビュー0件 → デフォルト2.5星
  if (!score || score.review_count === 0) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5">
          <StarRating score={DEFAULT_SCORE} size={12} />
          <span className="text-xs text-stone-400">—</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <StarRating score={DEFAULT_SCORE} size={16} />
        <span className="text-xs text-stone-400">レビューはまだありません</span>
      </div>
    );
  }

  // レビュー数不足（1件以上あるが表示基準未達）
  if (!score.display) {
    return (
      <div className="flex items-center gap-2">
        <StarRating score={DEFAULT_SCORE} size={compact ? 12 : 14} />
        <span className="text-xs text-stone-400">
          評価準備中（{score.review_count}件）
        </span>
      </div>
    );
  }

  // スコア表示
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
          {score.weighted_score.toFixed(2)}
        </span>
        <StarRating score={score.weighted_score} size={12} />
        <span className="text-xs text-stone-400">
          ({score.review_count})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
          {score.weighted_score.toFixed(2)}
        </span>
      </div>
      <div>
        <StarRating score={score.weighted_score} size={16} />
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            {getScoreLabel(score.weighted_score)}
          </span>
          <span className="text-xs text-stone-400">
            {score.review_count}件のレビュー
          </span>
        </div>
      </div>
    </div>
  );
}
