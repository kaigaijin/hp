-- ai_reviewed カラムを削除し、人間レビュー用カラムを追加する

-- ai_reviewed 関連のインデックスを削除
DROP INDEX IF EXISTS places_ai_reviewed_idx;

-- ai_reviewed カラムを削除
ALTER TABLE places DROP COLUMN IF EXISTS ai_reviewed;

-- 人間レビュー用カラムを追加
ALTER TABLE places ADD COLUMN IF NOT EXISTS human_reviewed BOOLEAN DEFAULT false;
ALTER TABLE places ADD COLUMN IF NOT EXISTS human_review_result TEXT; -- 'approved' | 'rejected'
ALTER TABLE places ADD COLUMN IF NOT EXISTS human_reviewed_at TIMESTAMPTZ;

-- インデックス
CREATE INDEX IF NOT EXISTS places_human_reviewed_idx ON places(human_reviewed);
CREATE INDEX IF NOT EXISTS places_human_review_result_idx ON places(human_review_result);
