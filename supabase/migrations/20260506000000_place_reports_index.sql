-- place_reportsのSeq scanを解消するインデックス
-- 57,862回のSeq scanが発生していたため、主要クエリパターンに合わせたインデックスを追加

CREATE INDEX IF NOT EXISTS idx_place_reports_lookup
  ON place_reports (country, category, spot_slug, report_type);
