-- place_reports テーブルに visitor_id カラムを追加
-- 「行った」ボタンの重複判定をlocalStorageではなくDB基準で行うため

alter table place_reports add column if not exists visitor_id text;

-- visitor_id でスポットごとの重複チェック用インデックス
create index if not exists idx_place_reports_visitor
  on place_reports (country, category, place_slug, visitor_id)
  where report_type = 'visited' and visitor_id is not null;
