-- user_place_history: ログインユーザーのプレイス閲覧履歴（Phase 3パーソナライズ用）
create table if not exists user_place_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  country_code    text not null,
  category_slug   text not null,
  place_slug      text not null,
  tags            text[] not null default '{}',
  area            text not null default '',
  visited_at      timestamptz not null default now(),

  -- 同一ユーザー×同一プレイスは1レコード（upsert時に visited_at を更新）
  unique (user_id, country_code, category_slug, place_slug)
);

-- RLS: 本人のみ読み書き可能
alter table user_place_history enable row level security;

create policy "本人のみ参照可能"
  on user_place_history for select
  using (auth.uid() = user_id);

create policy "本人のみ挿入・更新可能"
  on user_place_history for insert
  with check (auth.uid() = user_id);

create policy "本人のみ更新可能"
  on user_place_history for update
  using (auth.uid() = user_id);

-- インデックス: ユーザーの閲覧履歴を高速取得
create index if not exists user_place_history_user_id_idx
  on user_place_history (user_id, visited_at desc);
