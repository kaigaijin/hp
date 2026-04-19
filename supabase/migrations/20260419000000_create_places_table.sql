-- placesテーブル: Kaigaijinのプレイスディレクトリデータを管理
-- content/directory/{country}/{category}.json の全データを格納する

CREATE TABLE places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 識別フィールド
  country_code TEXT NOT NULL,    -- 'sg', 'th', 'my' etc.
  category TEXT NOT NULL,         -- 'cafe', 'restaurant', 'dental' etc.
  slug TEXT NOT NULL,
  -- 基本情報
  name TEXT NOT NULL,
  name_ja TEXT,
  name_local TEXT,                -- 現地語名（タイ語・韓国語等）
  area TEXT,
  city TEXT,
  address TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  -- 連絡先
  phone TEXT,                     -- E.164形式
  phone_local TEXT,               -- 現地表示形式（表示用）
  email TEXT,
  email_ja TEXT,
  email_local TEXT,
  email_note TEXT,
  website TEXT,
  source_url TEXT,
  -- 説明・詳細
  description TEXT,
  detail TEXT,
  detail_menu TEXT,
  -- 分類・タグ
  tags TEXT[] DEFAULT '{}',
  subcategory TEXT,
  -- 営業情報
  hours TEXT,
  closed_days TEXT,
  -- Google Places API フィールド
  place_id TEXT,                  -- Google Places API place_id（空文字はNULL）
  rating NUMERIC(3, 2),
  user_rating_count INTEGER,
  price_level INTEGER,
  photo_name TEXT,
  -- 料金・メニュー
  price TEXT,
  price_range TEXT,
  menu TEXT[],
  menu_highlights TEXT[],
  -- スタッフ・言語
  japanese_staff BOOLEAN,
  languages TEXT[],
  -- ステータス・品質管理
  status TEXT DEFAULT 'unverified',  -- 'unverified', 'verified', 'reported_closed'
  last_verified DATE,
  source TEXT,                        -- 'website', 'google_maps', 'sns', 'user_report'
  ai_reviewed BOOLEAN DEFAULT false,
  place_reviewed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  needs_review BOOLEAN DEFAULT false,
  review_note TEXT,
  slug_display TEXT,
  -- 削除フラグ（_delete: true のものは除外）
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (country_code, category, slug)
);

-- インデックス
CREATE INDEX places_country_category_idx ON places(country_code, category);
CREATE INDEX places_country_idx ON places(country_code);
CREATE INDEX places_category_idx ON places(category);
CREATE INDEX places_status_idx ON places(status);
CREATE INDEX places_ai_reviewed_idx ON places(ai_reviewed);
CREATE INDEX places_slug_idx ON places(slug);
CREATE INDEX places_place_id_idx ON places(place_id) WHERE place_id IS NOT NULL;

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW
  EXECUTE FUNCTION update_places_updated_at();

-- RLS
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places_public_read" ON places FOR SELECT USING (true);
CREATE POLICY "places_service_write" ON places FOR ALL USING (auth.role() = 'service_role');
