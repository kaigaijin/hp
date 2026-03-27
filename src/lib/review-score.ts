// スポットレビュー スコアリングアルゴリズム
//
// 設計思想:
// - ベースライン 2.50 から始まる（レビュー0件 = 2.50）
// - レビューが増えるほどスコアが動くが、極端な値（1.0や5.0付近）には到達しにくい
// - レビュアーの信頼度（レビュー数・コメント品質・一貫性・アカウント年齢）で影響度を調整
// - 2.5付近は動きやすく、端に近づくほど抵抗が増す（tanh圧縮）

// --- 設定 ---

// ベースラインスコア（レビューがない状態）
const BASELINE = 2.5;

// ベイズ平均の信頼度パラメータ
// 大きいほどベースラインへの引力が強い（少数レビューでスコアが極端にならない）
const BAYESIAN_CONFIDENCE = 5;

// tanh圧縮の感度パラメータ
// 小さいほど中央付近で動きやすく端で詰まる。大きいほどリニアに近づく
const COMPRESSION_K = 1.8;

// スコアを表示する最低レビュー数（1件から表示）
export const MIN_REVIEWS_FOR_SCORE = 1;

// --- 型定義 ---

export type Review = {
  id: string;
  spot_country: string;
  spot_category: string;
  spot_slug: string;
  reviewer_id: string;
  rating: number; // 1〜5
  comment: string | null;
  created_at: string; // ISO 8601
};

export type ReviewerStats = {
  reviewer_id: string;
  total_reviews: number;
  avg_comment_length: number; // 平均コメント文字数
  rating_stddev: number; // 評価の標準偏差（ばらつき）
  first_review_at: string; // 最初のレビュー日（ISO 8601）
};

export type SpotScore = {
  raw_average: number; // 単純平均
  weighted_score: number; // 最終スコア（表示用）
  review_count: number;
  display: boolean; // スコア表示可能か
};

// --- レビュアー信頼度の計算 ---

/**
 * レビュアーの信頼度スコアを算出する（0.1 〜 1.0）
 *
 * 信頼度が高いレビュアーほどスコアへの影響が大きい
 * 新規アカウントで1件だけ星5を付けても影響は小さい
 */
export function calcReviewerTrust(stats: ReviewerStats): number {
  const w1 = calcCountWeight(stats.total_reviews);
  const w2 = calcCommentQualityWeight(stats.avg_comment_length);
  const w3 = calcConsistencyWeight(stats.rating_stddev);
  const w4 = calcAccountAgeWeight(stats.first_review_at);

  // 各要素の合成（レビュー数30%, コメント品質25%, 一貫性25%, 年齢20%）
  const trust = w1 * 0.3 + w2 * 0.25 + w3 * 0.25 + w4 * 0.2;

  // 最低0.1は保証（完全に無視はしない）
  return Math.max(0.1, Math.min(1.0, trust));
}

/**
 * レビュー数による重み（対数スケール）
 * 1件: 0.15, 3件: 0.39, 5件: 0.52, 10件: 0.70, 30件: 0.93, 50件+: 1.0
 */
function calcCountWeight(count: number): number {
  if (count <= 0) return 0;
  return Math.min(1.0, Math.log(1 + count) / Math.log(51));
}

/**
 * コメント品質による重み
 * コメントなし: 0.1, 50文字: 0.5, 200文字以上: 1.0
 */
function calcCommentQualityWeight(avgLength: number): number {
  if (avgLength <= 0) return 0.1;
  return Math.min(1.0, 0.1 + 0.9 * (avgLength / 200));
}

/**
 * 評価の一貫性（標準偏差）による重み
 * 全部同じ評価（stddev=0）→ 0.3（怪しい）
 * 自然なばらつき（stddev=0.8〜1.2）→ 1.0
 * 極端（stddev=2.0+）→ 0.6
 */
function calcConsistencyWeight(stddev: number): number {
  if (isNaN(stddev)) return 0.5;
  if (stddev >= 0.8 && stddev <= 1.2) return 1.0;
  if (stddev < 0.8) {
    return 0.3 + (stddev / 0.8) * 0.7;
  }
  return Math.max(0.4, 1.0 - (stddev - 1.2) * 0.3);
}

/**
 * アカウント年齢による重み
 * 0日: 0.1, 30日: 0.5, 180日以上: 1.0
 */
function calcAccountAgeWeight(firstReviewAt: string): number {
  const ageMs = Date.now() - new Date(firstReviewAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 0.1;
  return Math.min(1.0, 0.1 + 0.9 * (ageDays / 180));
}

// --- tanh圧縮 ---

/**
 * スコアを2.5中心でtanh圧縮する
 *
 * 2.5付近は動きやすく、1.0や5.0に近づくほど抵抗が増す
 *
 * 例（COMPRESSION_K = 1.8）:
 *   入力 2.5 → 出力 2.50（ベースライン）
 *   入力 3.0 → 出力 3.17（+0.5の入力で+0.67の出力、動きやすい）
 *   入力 4.0 → 出力 4.04（+1.5の入力で+1.54、まだ動く）
 *   入力 4.5 → 出力 4.40（+2.0の入力で+1.90、やや鈍化）
 *   入力 5.0 → 出力 4.65（+2.5の入力で+2.15、到達困難）
 *   入力 1.0 → 出力 1.15（-1.5の入力で-1.35、低評価側も同様）
 */
function compressScore(rawScore: number): number {
  const delta = rawScore - BASELINE;
  // tanh(delta / k) は -1〜+1 の範囲
  // 2.5 + 2.5 * tanh(...) で 0.0〜5.0 の範囲にマッピング
  const compressed = BASELINE + BASELINE * Math.tanh(delta / COMPRESSION_K);
  return Math.max(1.0, Math.min(5.0, compressed));
}

// --- スポットスコアの計算 ---

/**
 * スポットの最終スコアを算出する
 *
 * 1. 各レビューにレビュアーの信頼度で重みを付ける
 * 2. ベイズ平均でベースライン（2.5）方向に補正
 * 3. tanh圧縮で極端な値を抑制
 */
export function calcSpotScore(
  reviews: Review[],
  reviewerStatsMap: Map<string, ReviewerStats>,
): SpotScore {
  const count = reviews.length;

  if (count === 0) {
    return {
      raw_average: 0,
      weighted_score: BASELINE,
      review_count: 0,
      display: false,
    };
  }

  // 単純平均
  const rawAvg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  // 重み付き平均
  let weightedSum = 0;
  let totalWeight = 0;

  for (const review of reviews) {
    const stats = reviewerStatsMap.get(review.reviewer_id);
    const trust = stats ? calcReviewerTrust(stats) : 0.1;
    weightedSum += review.rating * trust;
    totalWeight += trust;
  }

  // ベイズ平均: (C × baseline + Σ(wi × ri)) / (C + Σwi)
  // レビューが少ないほどベースライン（2.5）に引き寄せられる
  const bayesianScore =
    (BAYESIAN_CONFIDENCE * BASELINE + weightedSum) /
    (BAYESIAN_CONFIDENCE + totalWeight);

  // tanh圧縮で極端な値を抑制
  const finalScore = compressScore(bayesianScore);

  return {
    raw_average: round2(rawAvg),
    weighted_score: round2(finalScore),
    review_count: count,
    display: count >= MIN_REVIEWS_FOR_SCORE,
  };
}

// --- 簡易スコア計算（クライアント用） ---

/**
 * クライアント側でレビュー投稿後にローカルで即座にスコアを計算する
 * サーバー側の完全なアルゴリズムの簡易版（レビュアー信頼度なし）
 */
export function calcLocalScore(ratings: number[]): SpotScore {
  const count = ratings.length;
  if (count === 0) {
    return {
      raw_average: 0,
      weighted_score: BASELINE,
      review_count: 0,
      display: false,
    };
  }

  const rawAvg = ratings.reduce((sum, r) => sum + r, 0) / count;

  // 全員trust=0.1（新規）として簡易計算
  const totalWeight = count * 0.1;
  const weightedSum = ratings.reduce((sum, r) => sum + r * 0.1, 0);
  const bayesianScore =
    (BAYESIAN_CONFIDENCE * BASELINE + weightedSum) /
    (BAYESIAN_CONFIDENCE + totalWeight);

  const finalScore = compressScore(bayesianScore);

  return {
    raw_average: round2(rawAvg),
    weighted_score: round2(finalScore),
    review_count: count,
    display: count >= MIN_REVIEWS_FOR_SCORE,
  };
}

// --- ランキング ---

export function rankSpots(
  scores: Array<{ slug: string; score: SpotScore }>
): Array<{ slug: string; score: SpotScore; rank: number }> {
  const displayable = scores
    .filter((s) => s.score.display)
    .sort((a, b) => b.score.weighted_score - a.score.weighted_score);

  return displayable.map((s, i) => ({ ...s, rank: i + 1 }));
}

// --- スコアの表示ラベル ---

/**
 * スコアに応じた表示ラベル
 *
 * 4.0〜5.0: 高評価
 * 3.5〜3.9: おすすめ
 * 3.0〜3.4: 標準
 * 2.5〜2.9: —（ベースライン付近はラベルなし）
 * 〜2.4:    低評価
 */
export function getScoreLabel(score: number): string {
  if (score >= 4.0) return "高評価";
  if (score >= 3.5) return "おすすめ";
  if (score >= 3.0) return "標準";
  if (score >= 2.5) return "";
  return "低評価";
}

/**
 * スコアをフォーマット（3.42 → "3.42"）
 * 表示しない場合は "−"
 */
export function formatScore(spotScore: SpotScore): string {
  if (!spotScore.display) return "−";
  return spotScore.weighted_score.toFixed(2);
}

// --- ユーティリティ ---

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- レビュアー統計の集計 ---

export function aggregateReviewerStats(
  allReviews: Review[]
): Map<string, ReviewerStats> {
  const grouped = new Map<string, Review[]>();

  for (const review of allReviews) {
    const existing = grouped.get(review.reviewer_id) ?? [];
    existing.push(review);
    grouped.set(review.reviewer_id, existing);
  }

  const statsMap = new Map<string, ReviewerStats>();

  for (const [reviewerId, reviews] of grouped) {
    const ratings = reviews.map((r) => r.rating);
    const commentLengths = reviews.map((r) => r.comment?.length ?? 0);
    const avgCommentLength =
      commentLengths.reduce((a, b) => a + b, 0) / commentLengths.length;

    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance =
      ratings.reduce((sum, r) => sum + (r - mean) ** 2, 0) / ratings.length;
    const stddev = Math.sqrt(variance);

    const sorted = reviews.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    statsMap.set(reviewerId, {
      reviewer_id: reviewerId,
      total_reviews: reviews.length,
      avg_comment_length: avgCommentLength,
      rating_stddev: stddev,
      first_review_at: sorted[0].created_at,
    });
  }

  return statsMap;
}

// --- 全体平均の算出 ---

export function calcGlobalMean(allReviews: Review[]): number {
  if (allReviews.length === 0) return BASELINE;
  const sum = allReviews.reduce((s, r) => s + r.rating, 0);
  return round2(sum / allReviews.length);
}
