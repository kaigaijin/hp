# プレイスレビュー共通ルール

## 判定
1. websiteもsource_urlもnull → 即削除
2. WebFetchで確認し、日本人向けの根拠（日本語対応・日本人経営・日本食文化専門）がなければ削除

## 更新フィールド（残すアイテム）
- `ai_reviewed: true`, `last_verified: "2026-04-16"`, `status: "unverified"`
- `description`: 60〜120文字、日本人向けの根拠必須
- `detail`: 200〜400文字、公式サイトから取得した事実ベース
- `email`, `price_range`, `menu_highlights`, `japanese_staff`（取得できれば）

## git
```
git -C /Users/ryuichiueda/works/zh/kaigaijin/hp add content/directory/{path}
git -C /Users/ryuichiueda/works/zh/kaigaijin/hp commit -m "{ファイル名} {batchN} ブラッシュアップ"
```
- ファイル全体を書き出す（全件含む）、pushはしない
- バッチ完了ごとにコミット＋PRDの[ ]を[x]に更新してコミット
