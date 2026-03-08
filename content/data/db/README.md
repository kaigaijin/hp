# DB用データ

後々Supabaseに投入するための正規化済みデータ。
記事用の補足テキスト（description, tips, pros/cons等）は含まない。

## テーブル設計方針

- 1ファイル = 1テーブル相当
- `country_code` で国を区別（sg, th, ae, ...）
- 数値はそのまま数値型。通貨はSGD等を明記
- 推定値は `estimated: true`
- 出典は `source` フィールド
- `last_verified` で鮮度管理

## ファイル一覧

| ファイル | テーブル名(案) | 内容 |
|---|---|---|
| banks.json | banks | 銀行エンティティ |
| clinics.json | clinics | 日本語対応クリニック |
| schools.json | schools | 学校（日本人学校+インター） |
| visa_types.json | visa_types | ビザ種類・給与要件 |
| tax_rates.json | tax_rates | 所得税率テーブル |
| cpf_rates.json | cpf_rates | CPF拠出率 |
| rent_prices.json | rent_prices | 家賃相場 |
| cost_items.json | cost_items | 生活コスト項目 |
| mrt_lines.json | mrt_lines | MRT路線 |
| remittance_services.json | remittance_services | 海外送金サービス |
| japanese_residents.json | japanese_residents | 在留邦人数推移 |
| public_holidays.json | public_holidays | 祝日 |
| countries.json | countries | 国基本情報 |
| emergency_contacts.json | emergency_contacts | 緊急連絡先 |
