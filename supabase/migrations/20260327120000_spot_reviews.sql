-- スポットレビューテーブル（食べログ風重み付きスコアリング用）
-- Supabase: luna hp (itvobfrmbrtlisyojlqr)

-- レビューテーブル
create table if not exists spot_reviews (
  id uuid default gen_random_uuid() primary key,
  spot_country text not null,
  spot_category text not null,
  spot_slug text not null,
  reviewer_id text not null, -- ブラウザフィンガープリント or 将来的にユーザーID
  reviewer_name text not null, -- 表示名
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now() not null
);

-- インデックス
create index if not exists idx_spot_reviews_spot
  on spot_reviews (spot_country, spot_category, spot_slug);
create index if not exists idx_spot_reviews_reviewer
  on spot_reviews (reviewer_id);

-- 同一レビュアーが同一スポットに複数回投稿可能（訪問ごとに評価が変わる）
-- ただしスコア計算時は最新のレビューのみ使用する設計も選択可能

-- RLS（Row Level Security）
alter table spot_reviews enable row level security;

-- 読み取り: 全員可
create policy "spot_reviews_select" on spot_reviews
  for select using (true);

-- 書き込み: anon key で可（認証なし投稿を許可）
create policy "spot_reviews_insert" on spot_reviews
  for insert with check (true);

-- レビュアー統計ビュー（スコア計算の高速化用）
-- calcReviewerTrust() に必要なデータをまとめて取得できる
create or replace view reviewer_stats as
select
  reviewer_id,
  count(*)::int as total_reviews,
  avg(coalesce(length(comment), 0))::float as avg_comment_length,
  stddev_pop(rating)::float as rating_stddev,
  min(created_at)::text as first_review_at
from spot_reviews
group by reviewer_id;

-- スポット別スコアサマリービュー
-- APIレスポンスの高速化用（毎回全レビューを取得せずに済む）
create or replace view spot_review_summary as
select
  spot_country,
  spot_category,
  spot_slug,
  count(*)::int as review_count,
  avg(rating)::float as raw_average,
  json_agg(
    json_build_object(
      'id', id,
      'reviewer_id', reviewer_id,
      'reviewer_name', reviewer_name,
      'rating', rating,
      'comment', comment,
      'created_at', created_at
    ) order by created_at desc
  ) as reviews
from spot_reviews
group by spot_country, spot_category, spot_slug;
