-- confessions（海外在住日本人の本音投稿）テーブル
-- 質問ごとに自由記述で回答を収集する匿名質問箱コンテンツ

create table if not exists confessions (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,           -- 質問の識別子（例: "racism", "regret"）
  body text not null,                  -- 回答本文
  country text,                        -- 在住国コード（任意）
  user_id uuid references auth.users(id) on delete set null,  -- ログイン済みの場合
  nickname text,                       -- ログイン済み: user_metadataから / 未ログイン: null
  is_anonymous boolean not null default true,
  likes int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS有効化
alter table confessions enable row level security;

-- 全員が読める
create policy "confessions_select" on confessions
  for select using (true);

-- 誰でも投稿できる（ログイン不要）
create policy "confessions_insert" on confessions
  for insert with check (true);

-- 自分の投稿だけ削除できる（ログイン済みのみ）
create policy "confessions_delete" on confessions
  for delete using (auth.uid() = user_id);

-- いいね数更新（誰でも可）
create policy "confessions_update_likes" on confessions
  for update using (true) with check (true);

-- インデックス
create index if not exists confessions_question_id_idx on confessions(question_id);
create index if not exists confessions_created_at_idx on confessions(created_at desc);

-- いいねをアトミックにインクリメントする関数
create or replace function increment_confession_likes(confession_id uuid)
returns void language sql security definer as $$
  update confessions set likes = likes + 1 where id = confession_id;
$$;
