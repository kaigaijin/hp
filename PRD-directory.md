# PRD: ディレクトリ（スポット検索）機能

## 概要

Hot Pepper / 食べログのような現地ビジネスディレクトリ機能。
公開情報をベースに無料で掲載し、ページ数・SEO資産を稼ぐ。
将来的にオーナー編集機能→有料プラン（上位表示・クーポン等）でマネタイズ。

## URL設計

```
/{country}/spot/                     → カテゴリ一覧ページ
/{country}/spot/{category}/          → そのカテゴリの店舗一覧
/{country}/spot/{category}/{slug}    → 店舗詳細ページ
```

## カテゴリ

| slug | 表示名 | アイコン |
|------|--------|----------|
| restaurant | レストラン・日本食 | UtensilsCrossed |
| clinic | クリニック・病院 | Stethoscope |
| beauty | 美容室・理容室 | Scissors |
| real-estate | 不動産 | Building2 |
| grocery | 日本食スーパー・食材店 | ShoppingCart |
| education | 学習塾・幼稚園・インター校 | GraduationCap |

※ カテゴリは今後追加可能な設計にする

## データ構造

`content/directory/{country_code}/{category}.json`

```json
[
  {
    "slug": "nippon-medical-care",
    "name": "Nippon Medical Care",
    "name_ja": "日本メディカルケア",
    "area": "Orchard",
    "address": "6A Napier Road, #03-31 Annexe Block, Gleneagles Hospital, Singapore 258500",
    "phone": "+6564747707",
    "website": "https://www.nipponmedicalcare.com.sg/",
    "description": "オーチャードのグレニーグルズ病院内にある日系クリニック。内科・小児科・婦人科・健康診断に対応。日本語で受診可能。",
    "tags": ["日本語対応", "予約可", "保険対応"],
    "hours": "月〜金 9:00-12:00, 14:00-17:00 / 土 9:00-12:00",
    "last_verified": "2026-03-26"
  }
]
```

## ページ構成

### カテゴリ一覧 `/{country}/spot/`
- カテゴリカードのグリッド表示（アイコン + カテゴリ名 + 件数）
- 国のヒーロー（国旗・国名）

### 店舗一覧 `/{country}/spot/{category}/`
- カテゴリ内の全店舗をカード表示
- エリアでのフィルタリング（将来）
- 各カードに: 店名・エリア・タグ・概要

### 店舗詳細 `/{country}/spot/{category}/{slug}`
- 店名・住所・電話・営業時間・Webサイト・説明
- Google Maps埋め込み（将来）
- 関連記事リンク（同じ国の記事）
- JSON-LD構造化データ（LocalBusiness）

## SEO

- 各ページに適切なmetadata（title, description, canonical, OG）
- 店舗詳細にLocalBusiness JSON-LD
- sitemap.tsに全ディレクトリページを追加
- パンくずリスト: トップ → 国 → スポット → カテゴリ → 店名

## タスク一覧

### Phase 1: 基盤実装

- [x] 1.1 データ構造定義・カテゴリ定義（`lib/directory.ts`）
- [x] 1.2 SG/TH/MY初期データJSON作成（各カテゴリ最低2-3件）
- [x] 1.3 カテゴリ一覧ページ（`[country]/spot/page.tsx`）
- [x] 1.4 店舗一覧ページ（`[country]/spot/[category]/page.tsx`）
- [x] 1.5 店舗詳細ページ（`[country]/spot/[category]/[slug]/page.tsx`）
- [x] 1.6 Header にスポットリンク追加
- [x] 1.7 国ページにスポットセクション追加
- [x] 1.8 sitemap.ts にディレクトリページ追加
- [x] 1.9 ビルド確認 → OK（78スポット生成確認済み）
- [x] 1.10 push・デプロイ確認
