-- place_reviews テーブルに is_anonymous カラムを追加
-- 匿名投稿はスコアへの影響度を下げてログイン投稿を促す設計

alter table place_reviews
  add column if not exists is_anonymous boolean not null default true;

-- 既存レビューは全て匿名扱い（reviewer_idがauth.usersのUUIDかどうか不明なため）
-- ログイン済みユーザーのレビューはアプリ側で is_anonymous=false を送信する
