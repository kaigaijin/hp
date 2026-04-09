-- お気に入りテーブル
create table place_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country text not null,
  category text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(user_id, country, category, slug)
);

-- RLS
alter table place_favorites enable row level security;

-- 本人のみ読み書き可能
create policy "自分のお気に入りを読む" on place_favorites
  for select using (auth.uid() = user_id);

create policy "お気に入りに追加" on place_favorites
  for insert with check (auth.uid() = user_id);

create policy "お気に入りから削除" on place_favorites
  for delete using (auth.uid() = user_id);

-- インデックス（一覧取得・存在確認用）
create index place_favorites_user_id_idx on place_favorites(user_id);
create index place_favorites_spot_idx on place_favorites(country, category, slug);
