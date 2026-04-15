-- questions テーブル（匿名質問箱の質問）
-- ユーザーが自由に質問を投稿でき、運営の公式質問も混在する

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  body text not null,                        -- 質問本文
  category text not null default 'その他',   -- カテゴリ
  is_official boolean not null default false, -- 運営公式質問フラグ
  user_id uuid references auth.users(id) on delete set null,
  nickname text,                             -- 質問者のニックネーム（任意）
  is_anonymous boolean not null default true,
  answer_count int not null default 0,       -- 回答数キャッシュ
  likes int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table questions enable row level security;
create policy "questions_select" on questions for select using (true);
create policy "questions_insert" on questions for insert with check (true);
create policy "questions_delete" on questions for delete using (auth.uid() = user_id);
create policy "questions_update" on questions for update using (true) with check (true);

-- インデックス
create index if not exists questions_created_at_idx on questions(created_at desc);
create index if not exists questions_is_official_idx on questions(is_official);

-- answer_count をアトミックにインクリメントする関数
create or replace function increment_question_answer_count(question_id uuid)
returns void language sql security definer as $$
  update questions set answer_count = answer_count + 1 where id = question_id;
$$;

-- answers テーブル（質問への回答）
-- 旧 confessions テーブルと役割は同じだが question_id が uuid 参照になる
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  body text not null,
  country text,
  user_id uuid references auth.users(id) on delete set null,
  nickname text,
  is_anonymous boolean not null default true,
  likes int not null default 0,
  created_at timestamptz not null default now()
);

alter table answers enable row level security;
create policy "answers_select" on answers for select using (true);
create policy "answers_insert" on answers for insert with check (true);
create policy "answers_delete" on answers for delete using (auth.uid() = user_id);
create policy "answers_update_likes" on answers for update using (true) with check (true);

create index if not exists answers_question_id_idx on answers(question_id);
create index if not exists answers_created_at_idx on answers(created_at desc);

create or replace function increment_answer_likes(answer_id uuid)
returns void language sql security definer as $$
  update answers set likes = likes + 1 where id = answer_id;
$$;

-- 運営の公式質問17問をseed
insert into questions (body, category, is_official) values
  ('現地で人種差別や理不尽な扱いを受けたことがある？', '人間関係', true),
  ('日本人であることで得をしたと感じた体験は？', '人間関係', true),
  ('現地の人と本音で話せる友人がいる？どうやって作った？', '人間関係', true),
  ('現地の日本人コミュニティ、居心地いい？それとも息苦しい？', '人間関係', true),
  ('パートナーは日本人と非日本人、どちらが良かった（良い）？実体験から教えて。', 'パートナー・家族', true),
  ('海外に来てパートナーや家族との関係が変わった？', 'パートナー・家族', true),
  ('子どもに日本語・日本文化を継がせることへのプレッシャーを感じる？', 'パートナー・家族', true),
  ('海外に出て、日本が好きになった？嫌いになった？', '本音', true),
  ('移住を後悔したことがある？その理由は？', '本音', true),
  ('日本では絶対しなかったけど、海外では普通にやっていることは？', '本音', true),
  ('日本に帰りたいと思ったのはどんなとき？', '本音', true),
  ('現地のナイトライフ文化に参加してみた？ぶっちゃけどうだった？', '本音', true),
  ('日本の年金・健康保険、払い続けてる？損だと思う？', '制度・お金', true),
  ('海外で老後を過ごすことに不安がある？', '制度・お金', true),
  ('日本国籍を手放す選択肢を考えたことがある？', '制度・お金', true),
  ('現地採用と駐在員、待遇の差をリアルに感じる？', '仕事', true),
  ('海外の職場で一番カルチャーショックだったことは？', '仕事', true);
