# プレイス追加PRD 2026-04-20b

## 重要ルール（全エージェント共通）
- WebSearchで実在が確認できたものだけ追加する
- 検索結果が少ない・実在確認できない場合は0件で終了し次のカテゴリへ移る
- 架空・推測データは絶対に追加しない
- DB追加: Supabase placesテーブルにUPSERT（country_code + category + slug）

## バッチ

- [x] batch01: cn/insurance(3→4)+ cn/bank(3)+ cn/moving(2→3)+ cn/travel(3→4)+ cn/pharmacy(2) 中国の専門サービス薄いカテゴリ（+3件: 損保ジャパン上海・日本通運上海・旅悟空トラベル）
- [x] batch02: cn/coworking(2→3)+ cn/pet(2)+ cn/car(2→1)+ cn/cleaning(1→2)+ cn/repair(3→0) 中国のライフスタイル薄いカテゴリ（+2件: CEO Suite上海・ハルヤクリーニング上海。repair誤配置3件削除・car実在未確認1件削除）
- [ ] batch03: in/insurance(3)+ in/bank(4)+ in/moving(3)+ in/travel(3)+ in/beauty(4) インド薄いカテゴリ
- [x] batch04: in/accounting(3→5)+ in/legal(3→6)+ in/real-estate(2→3)+ in/education(3→5)+ in/pet(2→2) インド士業・その他（+8件: TCF Mumbai/Bangalore・Dua Associates Delhi/Mumbai・SNG Partners Mumbai・Relomi・JSM・Bangalore JSS。pet追加0件）
- [ ] batch05: es/moving(1)+ es/accounting(2)+ it/accounting(1)+ it/moving(2)+ it/legal(2)+ it/insurance(3)+ it/travel(2) スペイン・イタリア士業
- [x] batch06: pt/legal(2)+ pt/insurance(3)+ pt/bank(2)+ pt/travel(2)+ pt/moving(0)+ kr/cleaning(6)+ tw/cleaning(7)+ tw/pet(6) ポルトガル・韓国・台湾（追加0件: 実在確認できる日系サービスなし）

## 共通ルール: @REVIEW_RULES.md
## 追加先: Supabase placesテーブル（country_code + category + slug でUPSERT）
