# プレイス description + detail 一括 enrich PRD

## 目的

- description が 60文字未満のプレイス 4,012件 を enrich → Google インデックス率向上
- 同時に detail（100〜250文字の詳細説明）も生成 → ページコンテンツ充実

## スクリプト

`scripts/enrich-places-db.ts`

- Supabase から直接取得・更新（JSONファイル不要）
- Gemini 2.0 Flash で公式サイト参照 description + detail を同時生成
- 15 RPM 制限 → 4,500ms間隔
- `--country` / `--limit` / `--dry-run` / `--force` オプション

## 実行コマンド

```bash
npx tsx scripts/enrich-places-db.ts --country au --limit 200
```

## 対象件数（description < 60文字）

| 国 | 件数 | 優先度 |
|----|------|--------|
| au | 746  | 高 |
| de | 671  | 高 |
| us | 483  | 高 |
| vn | 278  | 中 |
| tw | 259  | 中 |
| hk | 225  | 中 |
| ae | 221  | 中 |
| th | 198  | 中 |
| gb | 178  | 中 |
| sg | 175  | 中 |
| id | 156  | 中 |
| kr | 121  | 低 |
| my | 48   | 低 |
| その他 | 253 | 低 |
| **合計** | **4,012** | |

## バッチ計画（1バッチ = 200件上限 / 15 RPM = 約15分）

- [ ] batch01: au 200件 (offset 0)
- [ ] batch02: au 200件 (offset 200)
- [ ] batch03: au 200件 (offset 400)
- [ ] batch04: au 146件 (offset 600)
- [ ] batch05: de 200件 (offset 0)
- [ ] batch06: de 200件 (offset 200)
- [ ] batch07: de 200件 (offset 400)
- [ ] batch08: de 71件 (offset 600)
- [ ] batch09: us 200件 (offset 0)
- [ ] batch10: us 200件 (offset 200)
- [ ] batch11: us 83件 (offset 400)
- [ ] batch12: vn 200件 (offset 0)
- [ ] batch13: vn 78件 (offset 200)
- [ ] batch14: tw 200件 (offset 0)
- [ ] batch15: tw 59件 (offset 200)
- [ ] batch16: hk 200件 (offset 0)
- [ ] batch17: hk 25件 (offset 200)
- [ ] batch18: ae 200件 (offset 0)
- [ ] batch19: ae 21件 (offset 200)
- [ ] batch20: th 198件 (offset 0)
- [ ] batch21: gb 178件 (offset 0)
- [ ] batch22: sg 175件 (offset 0)
- [ ] batch23: id 156件 (offset 0)
- [ ] batch24: kr 121件 (offset 0)
- [ ] batch25: my + その他 301件 (offset 0)

## 完了条件

- 全バッチ `[x]` 済み
- Supabase で `SELECT COUNT(*) FROM places WHERE length(description) < 60` → 0件（またはほぼ0）
- デプロイ後、Google Search Console でインデックス未登録ページが減少傾向
