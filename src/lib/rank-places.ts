/**
 * プレイスのパーソナライズランキング
 *
 * Phase 2: Cookie（匿名プロファイル）でスコアリング
 * Phase 3: Supabaseのユーザー閲覧履歴とマージしてスコアリング
 *
 * スコア計算:
 *   - カテゴリ一致: +3点/閲覧
 *   - タグ一致:     +2点/閲覧
 *   - エリア一致:   +1点/閲覧
 * 合計スコアが同じ場合はシードベースの疑似ランダムで並び替え（毎日変わる）
 */

export type PlaceProfile = {
  categories: Record<string, number>; // { restaurant: 3, cafe: 1 }
  tags: Record<string, number>;       // { "日本食": 5, "ランチ": 2 }
  areas: Record<string, number>;      // { "Silom": 2, "Asok": 1 }
};

export type RankablePlace = {
  slug: string;
  categorySlug: string;
  tags: string[];
  area: string;
  [key: string]: unknown;
};

/** Cookieの生JSON文字列をパース。壊れていたら空プロファイルを返す */
export function parseProfile(raw: string | undefined): PlaceProfile {
  if (!raw) return { categories: {}, tags: {}, areas: {} };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      categories: parsed.categories ?? {},
      tags: parsed.tags ?? {},
      areas: parsed.areas ?? {},
    };
  } catch {
    return { categories: {}, tags: {}, areas: {} };
  }
}

/** プロファイルをCookieに保存する文字列に変換 */
export function serializeProfile(profile: PlaceProfile): string {
  return encodeURIComponent(JSON.stringify(profile));
}

/** 閲覧したプレイスの情報でプロファイルを更新 */
export function updateProfile(
  profile: PlaceProfile,
  categorySlug: string,
  tags: string[],
  area: string,
): PlaceProfile {
  const next: PlaceProfile = {
    categories: { ...profile.categories },
    tags: { ...profile.tags },
    areas: { ...profile.areas },
  };

  next.categories[categorySlug] = (next.categories[categorySlug] ?? 0) + 1;
  for (const tag of tags) {
    next.tags[tag] = (next.tags[tag] ?? 0) + 1;
  }
  if (area) {
    next.areas[area] = (next.areas[area] ?? 0) + 1;
  }

  // 各カウントを最大100に制限（古い行動が支配しすぎないように）
  for (const k of Object.keys(next.categories)) {
    next.categories[k] = Math.min(next.categories[k], 100);
  }
  for (const k of Object.keys(next.tags)) {
    next.tags[k] = Math.min(next.tags[k], 100);
  }
  for (const k of Object.keys(next.areas)) {
    next.areas[k] = Math.min(next.areas[k], 100);
  }

  return next;
}

/** 1つのプレイスのパーソナライズスコアを計算 */
function scorePlace(place: RankablePlace, profile: PlaceProfile): number {
  let score = 0;

  // カテゴリ一致: +3点/閲覧カウント
  score += (profile.categories[place.categorySlug] ?? 0) * 3;

  // タグ一致: +2点/閲覧カウント
  for (const tag of place.tags) {
    score += (profile.tags[tag] ?? 0) * 2;
  }

  // エリア一致: +1点/閲覧カウント
  score += (profile.areas[place.area] ?? 0) * 1;

  return score;
}

/** 日付ベースのシード疑似ランダム（毎日シャッフル順が変わる） */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/**
 * プレイス一覧をパーソナライズスコア順に並び替える
 * スコアが同じ場合は日次シードで疑似ランダム
 *
 * フィルターバブル防止:
 *   上位33%はスコア順、残り67%はランダム混入
 *   （寿司ばかり見ても寿司しか出ない状態を防ぐ）
 */
export function rankPlaces<T extends RankablePlace>(
  places: T[],
  profile: PlaceProfile,
): T[] {
  const seed = getDailySeed();
  const rand = seededRandom(seed);

  // 各プレイスに乱数を付与（スコアタイ時の安定ソート用）
  const withScore = places.map((p) => ({
    place: p,
    score: scorePlace(p, profile),
    r: rand(),
  }));

  // スコア降順 → 乱数降順
  withScore.sort((a, b) => b.score - a.score || b.r - a.r);

  // フィルターバブル防止: 上位1/3のみパーソナライズ、残りはランダム混入
  const personalizedCount = Math.ceil(places.length / 3);
  const personalized = withScore.slice(0, personalizedCount);
  const rest = withScore.slice(personalizedCount).sort((a, b) => b.r - a.r);

  return [...personalized, ...rest].map((x) => x.place);
}
