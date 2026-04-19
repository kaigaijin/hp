# プレイス追加PRD 2026-04-19e

## 重要ルール（全エージェント共通）
- WebSearchで実在が確認できたものだけ追加する
- 検索結果が少ない・実在確認できない場合は0件で終了し次のカテゴリへ移る
- 架空・推測データは絶対に追加しない
- DB追加: Supabase placesテーブルにINSERT（country_code + category + slug でUPSERT）

## バッチ

- [x] batch01: ca/dental(現1件→3件)+ ca/legal(現1件・追加なし)+ ca/real-estate(現2件→4件)+ ca/education(現2件→4件) カナダ超薄いカテゴリ
- [x] batch02: ca/clinic(現5件→6件)+ ca/nail-esthetic(現3件→5件)+ ca/fitness(現3件→4件)+ ca/insurance(現2件→4件) カナダ薄いカテゴリ
- [x] batch03: fr/pharmacy(現1件)+ fr/nail-esthetic(現2件)+ fr/coworking(現1件)+ fr/beauty(現4件→8件) フランス薄いカテゴリ
- [x] batch04: nl/dental(現2件→追加なし)+ nl/nail-esthetic(現1件→追加なし)+ nl/real-estate(現2件→追加なし)+ nl/beauty(現6件→8件) オランダ薄いカテゴリ
- [x] batch05: ph/dental(現1件→3件)+ ph/fitness(現2件・追加なし)+ ph/insurance(現1件→2件)+ ph/beauty(現3件→5件)+ ph/legal(現2件→3件) フィリピン薄いカテゴリ
- [x] batch06: ch/accounting(現1件→2件)+ ch/fitness(現2件)+ ch/education(現2件→4件)+ ch/legal(現2件) スイス薄いカテゴリ

## 共通ルール: @REVIEW_RULES.md
## 追加先: Supabase placesテーブル（`/Users/ryuichiueda/works/zh/kaigaijin/hp/scripts/import-places-to-db.ts` 参照）
