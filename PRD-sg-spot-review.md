# PRD: SG スポット一括レビュー

## 概要

シンガポールの全スポット（2293件）を Claude Code サブエージェント（WebSearch + WebFetch）で1件ずつ調査し、以下を実施する。

1. **日本人向け判定**（最優先）— 非対象は削除、判断不能は保留
2. **`japanese_staff` フラグ付与**
3. **email・価格帯・メニュー取得**
4. **description 再生成**（SEO用・60〜120文字）
5. **detail 生成**（500〜1000文字・利用判断用）

完了後、`spot_reviewed: true` を付与して再実行対象から除外する。

---

## フラグ設計

| フラグ | 型 | 意味 |
|---|---|---|
| `spot_reviewed` | `boolean` | このPRDのレビュー完了フラグ。`true` = 処理済み（再実行しない） |
| `japanese_staff` | `boolean \| null` | `true`=日本人/日本語スタッフあり、`false`=Japanese-styleのみ、`null`=不明 |
| `needs_review` | `boolean` | 判断不能で保留中。`true` の場合は `spot_reviewed: true` でも次回再レビュー対象にする |

**`ai_reviewed` は既存フィールドのため変更しない。** 今回は `spot_reviewed` を新設して区別する。

---

## 日本人向け判定基準

### 日本人向け（維持）
- 日本人・日本語対応スタッフが在籍
- 日本語メニュー・日本語サービスを提供
- 日本食・日本式サービス（日本式ヘアカット・日本式マッサージ等）を明示的に提供
- 日系チェーン・日本人オーナー経営
- 日本語 Google レビューが多数ある証拠がある

### japanese_staff フラグ
- `true`: 日本人スタッフ在籍 or 日本語対応スタッフがいる
- `false`: スタッフ対応なしだが Japanese-style・日本食で日本人に有用
- `null`: 確認できない（`needs_review: true` と併用）

### 削除対象
- 日本との接点が全くないローカル店
- 「日式」と名乗るだけで実態が全く異なる店
- 日本人が利用する理由が見当たらない店

### 保留（`needs_review: true`）
- 公式サイト・Web情報から判断できない
- 削除はしない。次回再レビュー対象

---

## 実行方式

- **Claude Code サブエージェント**（general-purpose）が各カテゴリを担当
- 各サブエージェントは WebSearch + WebFetch でスポットを1件ずつ調査
- カテゴリ単位で並列実行（最大5並列）
- `spot_reviewed: true` **かつ** `detail` が200文字以上のスポットはスキップ → 途中停止しても再実行可能
- `spot_reviewed: true` でも `detail` が空・200文字未満なら再処理（detail未生成の残骸）

---

## カテゴリ一覧・進捗

restaurant は件数が多いため50件ずつのチャンクに分割する。

### 小規模カテゴリ（〜60件）— 1サブエージェントで全件処理

- [ ] accounting（52件）
- [ ] bank（36件）
- [ ] car（38件）
- [ ] cleaning（37件）
- [ ] clinic（50件）
- [ ] coworking（46件）
- [ ] dental（41件）
- [ ] fitness（50件）
- [ ] insurance（48件）
- [ ] moving（53件）
- [ ] nail-esthetic（53件）
- [ ] pet（43件）
- [ ] pharmacy（37件）
- [ ] real-estate（37件）
- [ ] repair（36件）
- [ ] travel（54件）

### 中規模カテゴリ（61〜150件）— 1サブエージェントで全件処理

- [ ] beauty（145件）
- [ ] education（99件）
- [ ] grocery（120件）
- [ ] legal（63件）

### 大規模カテゴリ（150件超）— 50件チャンクに分割

- [ ] cafe（295件）
  - [ ] cafe chunk 1（1〜50件）
  - [ ] cafe chunk 2（51〜100件）
  - [ ] cafe chunk 3（101〜150件）
  - [ ] cafe chunk 4（151〜200件）
  - [ ] cafe chunk 5（201〜295件）
- [ ] restaurant（860件）
  - [ ] restaurant chunk 1（1〜50件）
  - [ ] restaurant chunk 2（51〜100件）
  - [ ] restaurant chunk 3（101〜150件）
  - [ ] restaurant chunk 4（151〜200件）
  - [ ] restaurant chunk 5（201〜250件）
  - [ ] restaurant chunk 6（251〜300件）
  - [ ] restaurant chunk 7（301〜350件）
  - [ ] restaurant chunk 8（351〜400件）
  - [ ] restaurant chunk 9（401〜450件）
  - [ ] restaurant chunk 10（451〜500件）
  - [ ] restaurant chunk 11（501〜550件）
  - [ ] restaurant chunk 12（551〜600件）
  - [ ] restaurant chunk 13（601〜650件）
  - [ ] restaurant chunk 14（651〜700件）
  - [ ] restaurant chunk 15（701〜750件）
  - [ ] restaurant chunk 16（751〜800件）
  - [ ] restaurant chunk 17（801〜860件）

---

## サブエージェントへの指示テンプレート

各サブエージェントに以下の指示を渡す（カテゴリ・ファイルパス・スライス範囲を差し替える）。

```
## タスク
/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory/sg/{category}.json
の {start}〜{end} 件目（0-indexed）のスポットを1件ずつ調査してJSONを更新してください。

## 処理対象
- `spot_reviewed: true` かつ `detail` が200文字以上のスポットはスキップする
- `spot_reviewed: true` でも `detail` が空・200文字未満なら再処理する（detail未生成の残骸）
- `needs_review: true` のスポットは常に再調査する
- `needs_review: true` のスポットは再調査する

## 各スポットの処理手順
1. WebSearch で「{店名} Singapore」「{店名} シンガポール 日本語」等を検索
2. website があれば WebFetch で公式サイトを取得
3. 以下を判定・取得:

### 日本人向け判定（最優先）
以下のいずれかに該当すれば日本人向け:
- 日本人・日本語対応スタッフが在籍
- 日本語メニュー・日本語サービスを提供
- 日本食・日本式サービスを明示的に提供（日本式ヘアカット・ラーメン・寿司等）
- 日系チェーン・日本人オーナー経営
- 日本語 Google レビューが多数ある

判定不能（情報が見つからない）→ needs_review: true で保留（削除しない）
明らかに日本人向けでない → スポットをJSONから削除

### japanese_staff フラグ
- true: 日本人スタッフ在籍 or 日本語対応スタッフがいる
- false: スタッフ対応なしだが Japanese-style・日本食で日本人に有用
- null: 確認できない

### 取得する追加情報
- email: 問い合わせ用メールアドレス（確認できない場合は既存値を維持）
- price_range: 価格帯（例: "SGD 15-30/人"。確認できない場合は null）
- menu_highlights: 代表メニュー最大5件（配列。確認できない場合は null）

### description（60〜120文字）
- 1文目: 日本人向けの根拠を必ず含める
- このスポット固有の情報のみ。テンプレート文禁止
- 事実のみ。推測・「人気」「おすすめ」禁止

### detail（500〜1000文字）
- 日本人が「行くかどうか判断できる」情報を自然な文章で記述
- 含める（情報が取れた場合）: 概要・対象ユーザー・言語対応・メニュー/価格帯・雰囲気・アクセス・営業時間・注意点
- 箇条書き禁止。取れなかった項目は省略（「不明」と書かない）
- テンプレート文禁止。固有情報のみ

## 完了フラグ
各スポットの処理完了後、必ず以下を設定する:
- `spot_reviewed: true`
- `last_verified: "{TODAY}"`

削除したスポットはJSONから除去する（削除後のJSONを保存）。

## 保存タイミング
5件処理するごとにJSONファイルを保存する（途中停止に備えて）。

## 完了報告
処理完了後、以下を報告する:
- 維持: X件
- 削除: X件（削除した店名リスト）
- 保留(needs_review): X件
- 失敗: X件
```

---

## 検証条件

各カテゴリ完了後:
- [ ] `spot_reviewed: true` の件数が処理件数と一致する
- [ ] 削除されたスポットの店名リストを確認（意図しない削除がないか）
- [ ] `needs_review: true` のスポットを手動確認

全カテゴリ完了後:
- [ ] `validate-spots.ts` を実行して suspect 0件を確認
- [ ] コミット・push・デプロイ確認

---

## 実行順序

1. 小規模カテゴリを最大5並列で一括開始（dental・clinic・pharmacy・bank・carなど）
2. 結果確認・問題なければ中規模カテゴリへ
3. cafe・restaurant は順次チャンク実行（並列可）
4. 全完了後 validate-spots.ts → コミット → push
