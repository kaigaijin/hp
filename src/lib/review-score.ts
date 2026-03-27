// 食べログ風 重み付きレビュースコアリング
//
// 特徴:
// - レビュアーの信頼度（レビュー数・文章量・一貫性・アカウント年齢）で重み付け
// - ベイズ平均で少数レビューの偏りを抑制
// - 最低レビュー数に達するまでスコア非表示
// - やらせレビュー（新規アカウント・極端評価）の影響を自動抑制

// --- 設定 ---

// スコアを表示する最低レビュー数
export const MIN_REVIEWS_FOR_SCORE = 5;

// ベイズ平均の事前分布（全スポットの平均に収束する重み）
// この数が大きいほど、少数レビューのスポットは全体平均に引き寄せられる
const BAYESIAN_CONFIDENCE = 10;

// 全体平均のデフォルト値（十分なデータが溜まったら実測値に更新する）
const GLOBAL_MEAN = 3.0;

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
  weighted_score: number; // 重み付きスコア（表示用）
  review_count: number;
  display: boolean; // スコア表示可能か
};

// --- レビュアー信頼度の計算 ---

/**
 * レビュアーの信頼度スコアを算出する（0.1 〜 1.0）
 *
 * 4つの要素で構成:
 * 1. レビュー数（多いほど信頼）→ 対数スケールで頭打ち
 * 2. コメント品質（長く丁寧なほど信頼）→ 50文字で0.5、200文字で1.0
 * 3. 評価の一貫性（全部5点みたいな人は信頼度低い）→ 標準偏差で判定
 * 4. アカウント年齢（古いほど信頼）→ 30日で0.5、180日で1.0
 */
export function calcReviewerTrust(stats: ReviewerStats): number {
  const w1 = calcCountWeight(stats.total_reviews);
  const w2 = calcCommentQualityWeight(stats.avg_comment_length);
  const w3 = calcConsistencyWeight(stats.rating_stddev);
  const w4 = calcAccountAgeWeight(stats.first_review_at);

  // 各要素の合成（重みの比率: レビュー数30%, コメント品質25%, 一貫性25%, 年齢20%）
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
  // log(1+count) / log(51) で 50件で約1.0に到達
  return Math.min(1.0, Math.log(1 + count) / Math.log(51));
}

/**
 * コメント品質による重み
 * コメントなし: 0.1, 50文字: 0.5, 200文字以上: 1.0
 */
function calcCommentQualityWeight(avgLength: number): number {
  if (avgLength <= 0) return 0.1;
  // 200文字で1.0に到達する曲線
  return Math.min(1.0, 0.1 + 0.9 * (avgLength / 200));
}

/**
 * 評価の一貫性（標準偏差）による重み
 * 全部同じ評価（stddev=0）の人は重み低い → やらせ対策
 * 適度にばらつきがある（stddev=0.8〜1.2）人が最も信頼度高い
 *
 * stddev 0.0: 0.3（全部同じ点数 → 怪しい）
 * stddev 0.5: 0.7
 * stddev 0.8〜1.2: 1.0（自然なばらつき）
 * stddev 2.0+: 0.6（極端すぎ）
 */
function calcConsistencyWeight(stddev: number): number {
  // レビュー1件（stddev計算不能）の場合はデフォルト
  if (isNaN(stddev)) return 0.5;

  // 正規分布的に0.8〜1.2が最も自然
  if (stddev >= 0.8 && stddev <= 1.2) return 1.0;
  if (stddev < 0.8) {
    // 低すぎ（全部同じ点数寄り）
    return 0.3 + (stddev / 0.8) * 0.7;
  }
  // 高すぎ（1と5を交互に付けるような人）
  return Math.max(0.4, 1.0 - (stddev - 1.2) * 0.3);
}

/**
 * アカウント年齢による重み
 * 0日: 0.1, 7日: 0.2, 30日: 0.5, 180日以上: 1.0
 */
function calcAccountAgeWeight(firstReviewAt: string): number {
  const ageMs = Date.now() - new Date(firstReviewAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 0.1;
  // 180日で1.0に到達
  return Math.min(1.0, 0.1 + 0.9 * (ageDays / 180));
}

// --- スポットスコアの計算 ---

/**
 * スポットの重み付きスコアを算出する
 *
 * アルゴリズム:
 * 1. 各レビューにレビュアーの信頼度で重みを付ける
 * 2. 重み付き平均を算出
 * 3. ベイズ平均で全体平均方向に補正（レビューが少ないほど補正が強い）
 *
 * @param reviews - このスポットの全レビュー
 * @param reviewerStatsMap - レビュアーIDをキーとしたレビュアー統計情報
 * @param globalMean - 全スポットの平均スコア（省略時はデフォルト3.0）
 */
export function calcSpotScore(
  reviews: Review[],
  reviewerStatsMap: Map<string, ReviewerStats>,
  globalMean: number = GLOBAL_MEAN
): SpotScore {
  const count = reviews.length;

  if (count === 0) {
    return {
      raw_average: 0,
      weighted_score: 0,
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
    const trust = stats ? calcReviewerTrust(stats) : 0.1; // 統計なし = 最低信頼度
    weightedSum += review.rating * trust;
    totalWeight += trust;
  }

  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : rawAvg;

  // ベイズ平均: (C × μ + Σ(wi × ri)) / (C + Σwi)
  // C = BAYESIAN_CONFIDENCE, μ = globalMean
  const bayesianScore =
    (BAYESIAN_CONFIDENCE * globalMean + weightedSum) /
    (BAYESIAN_CONFIDENCE + totalWeight);

  return {
    raw_average: round2(rawAvg),
    weighted_score: round2(bayesianScore),
    review_count: count,
    display: count >= MIN_REVIEWS_FOR_SCORE,
  };
}

// --- ランキング ---

/**
 * 複数スポットのスコアをランキング順にソート
 * displayがtrueのスポットのみランキング対象
 */
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
 * スコアに応じた表示ラベル（食べログの3.5超えたら信頼できる、のような基準）
 *
 * 4.5〜5.0: 最高評価
 * 4.0〜4.4: 高評価
 * 3.5〜3.9: おすすめ
 * 3.0〜3.4: 標準
 * 2.5〜2.9: やや低評価
 * 〜2.4:    低評価
 */
export function getScoreLabel(score: number): string {
  if (score >= 4.5) return "最高評価";
  if (score >= 4.0) return "高評価";
  if (score >= 3.5) return "おすすめ";
  if (score >= 3.0) return "標準";
  if (score >= 2.5) return "やや低評価";
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

/**
 * レビュー一覧からレビュアーごとの統計情報を集計する
 * Supabaseから全レビューを取得した後に使う
 */
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

    // 標準偏差
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance =
      ratings.reduce((sum, r) => sum + (r - mean) ** 2, 0) / ratings.length;
    const stddev = Math.sqrt(variance);

    // 最初のレビュー日
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

/**
 * 全スポットの加重平均を算出する（ベイズ平均のglobalMeanに使う）
 * 定期的に再計算してキャッシュするのが望ましい
 */
export function calcGlobalMean(allReviews: Review[]): number {
  if (allReviews.length === 0) return GLOBAL_MEAN;
  const sum = allReviews.reduce((s, r) => s + r.rating, 0);
  return round2(sum / allReviews.length);
}
