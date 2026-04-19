# プレイス追加PRD 2026-04-19c

## 重要ルール（全エージェント共通）
- WebSearchで実在が確認できたものだけ追加する
- 検索結果が少ない・実在確認できない場合は0件で終了し次のカテゴリへ移る
- 架空・推測データは絶対に追加しない

## バッチ

- [x] batch01: vn/cafe追加（現72件→74件）+ id/cafe追加（現106件→109件）
- [x] batch02: fr/restaurant追加（現145件→150件）+ fr/cafe追加（現11件→13件）+ fr/0件カテゴリ（coworking1件/pharmacy1件/cleaning0件）
- [ ] batch03: ca/restaurant追加（現175件）+ ca/cafe追加（現13件）+ ca/0件カテゴリ（coworking/fitness/healthcare/pharmacy）
- [x] batch04: ch/restaurant追加（現41件→46件）+ ch/cafe追加（現11件・新規なし）+ ch/0件カテゴリ（dental/clinic=0件確認・coworking=0件確認・fitness=2件追加）
- [x] batch05: nl/restaurant追加（現44件→51件）+ nl/cafe追加（現11件→13件）
- [x] batch06: ph/restaurant追加（現43件→49件）+ ph/cafe追加（現7件→10件）

## 共通ルール: @REVIEW_RULES.md
## 対象ディレクトリ: `hp/content/directory/`
