# プレイス追加PRD 2026-04-20

## 重要ルール（全エージェント共通）
- WebSearchで実在が確認できたものだけ追加する
- 検索結果が少ない・実在確認できない場合は0件で終了し次のカテゴリへ移る
- 架空・推測データは絶対に追加しない
- DB追加: Supabase placesテーブルにUPSERT（country_code + category + slug）

## バッチ

- [x] batch01: cn/cafe(5→7件)+ cn/dental(3→6件)+ cn/fitness(4件変化なし)+ cn/nail-esthetic(2→4件) 中国の薄いカテゴリ
- [x] batch02: cn/real-estate(4件→7件)+ cn/education(5件→5件・誤混入1件削除+補習クラブ追加)+ cn/accounting(2件→3件)+ cn/legal(5件→7件) 中国の士業・専門サービス
- [x] batch03: in/cafe(6件変化なし)+ in/grocery(7→10件)+ in/clinic(3→4件)+ in/dental(3件変化なし) インドの薄いカテゴリ
- [x] batch04: es/clinic(2件→2件変化なし)+ es/beauty(4件→7件)+ es/real-estate(2件→3件)+ es/education(4件→5件) スペインの薄いカテゴリ
- [x] batch05: it/clinic(1→2件)+ it/dental(2件変化なし)+ it/beauty(5件変化なし)+ it/real-estate(2→3件)+ it/education(3→4件) イタリアの薄いカテゴリ
- [ ] batch06: pt/dental(2件)+ pt/beauty(3件)+ pt/education(3件)+ nz/nail-esthetic(2件)+ nz/fitness(2件) ポルトガル・NZ薄いカテゴリ

## 共通ルール: @REVIEW_RULES.md
## 追加先: Supabase placesテーブル（country_code + category + slug でUPSERT）
