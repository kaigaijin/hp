-- 月次スナップショットテーブル + pg_cron自動実行
-- プレイスデータの国×カテゴリ別件数推移を記録し、インテリジェンス基盤の基礎データとする

-- pg_cron拡張を有効化
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- スナップショットテーブル
CREATE TABLE place_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  country_code TEXT NOT NULL,
  category TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  verified_count INTEGER NOT NULL DEFAULT 0,
  has_website_count INTEGER NOT NULL DEFAULT 0,
  has_place_id_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_date, country_code, category)
);

CREATE INDEX idx_place_snapshots_date ON place_snapshots (snapshot_date);
CREATE INDEX idx_place_snapshots_country ON place_snapshots (country_code, category);

-- RLS
ALTER TABLE place_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "place_snapshots_read" ON place_snapshots FOR SELECT USING (true);

-- スナップショット取得関数
CREATE OR REPLACE FUNCTION take_place_snapshot()
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO place_snapshots (snapshot_date, country_code, category, total_count, verified_count, has_website_count, has_place_id_count)
  SELECT
    CURRENT_DATE,
    country_code,
    category,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'verified'),
    COUNT(*) FILTER (WHERE website IS NOT NULL),
    COUNT(*) FILTER (WHERE place_id IS NOT NULL)
  FROM places
  GROUP BY country_code, category
  ON CONFLICT (snapshot_date, country_code, category) DO UPDATE SET
    total_count = EXCLUDED.total_count,
    verified_count = EXCLUDED.verified_count,
    has_website_count = EXCLUDED.has_website_count,
    has_place_id_count = EXCLUDED.has_place_id_count;
$$;

-- 毎月1日 00:00 UTC に自動実行
SELECT cron.schedule(
  'monthly-place-snapshot',
  '0 0 1 * *',
  'SELECT take_place_snapshot()'
);
