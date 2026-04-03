#!/usr/bin/env python3
"""descriptionが空のスポットをClaude APIで埋めるスクリプト"""
import requests, json, time, os, re

# Anthropic APIキー読み込み
env_content = open('/Users/ryuichiueda/works/zh/kaigaijin/hp/.env').read()
ANTHROPIC_KEY = None
for line in env_content.split('\n'):
    if line.startswith('ANTHROPIC_API_KEY'):
        ANTHROPIC_KEY = line.split('=', 1)[1].strip()
        break

# .envになければ環境変数から
if not ANTHROPIC_KEY:
    ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')

if not ANTHROPIC_KEY:
    print("ANTHROPIC_API_KEY が見つかりません。環境変数で指定してください:")
    print("  ANTHROPIC_API_KEY=sk-ant-xxx python3 fill_descriptions_claude.py")
    exit(1)

BASE_DIR = "/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory"
MODEL = "claude-haiku-4-5-20251001"  # 速い・安い

COUNTRY_NAME = {
    "sg": "シンガポール", "th": "タイ", "my": "マレーシア", "hk": "香港",
    "tw": "台湾", "kr": "韓国", "vn": "ベトナム", "au": "オーストラリア",
    "ae": "UAE（ドバイ）", "de": "ドイツ", "gb": "イギリス", "id": "インドネシア",
}


def call_claude(prompt):
    res = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": MODEL,
            "max_tokens": 300,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=30,
    )
    if res.status_code == 429:
        print("  → レート制限。60秒待機...")
        time.sleep(60)
        return call_claude(prompt)
    if res.status_code != 200:
        print(f"  → エラー {res.status_code}: {res.text[:200]}")
        return None
    data = res.json()
    return data.get("content", [{}])[0].get("text", "").strip()


def build_prompt(spot, category, country):
    website_hint = f"公式サイト: {spot['website']}" if spot.get('website') else ""
    tags = "・".join(spot.get("tags", [])) or "なし"
    country_ja = COUNTRY_NAME.get(country, country)
    return f"""以下のスポットのdescriptionを生成してください。

【スポット情報】
店名: {spot['name']}
日本語名: {spot.get('name_ja') or '不明'}
国: {country_ja}
エリア: {spot.get('area') or '不明'}
住所: {spot.get('address') or '不明'}
カテゴリ: {category}
タグ: {tags}
{website_hint}

【生成ルール】
- 60〜120文字（厳守）
- 1文目: 日本人向けの根拠を必ず入れる（日本語対応・日本人経営・日本食・日系ブランド等）
- 2文目以降: 場所（駅名・地区名）と具体的な特徴（サービス内容・実績等）
- 事実のみ。推測・主観・「人気」「おすすめ」は禁止
- descriptionの文字列だけを返す（説明文・引用符・改行・前置き不要）"""


def fill_descriptions(country=None):
    """description空のスポットを埋める"""
    total_filled = 0

    for c in sorted(os.listdir(BASE_DIR)):
        if country and c != country:
            continue
        cp = f"{BASE_DIR}/{c}"
        if not os.path.isdir(cp):
            continue

        for fname in sorted(os.listdir(cp)):
            if not fname.endswith(".json"):
                continue
            fpath = f"{cp}/{fname}"
            category = fname.replace(".json", "")

            with open(fpath, encoding="utf-8") as f:
                spots = json.load(f)

            # description空のスポットを抽出
            empty_indices = [
                i for i, s in enumerate(spots)
                if not s.get("description", "").strip()
            ]

            if not empty_indices:
                continue

            print(f"\n=== {c}/{category}: {len(empty_indices)}件空 ===")
            modified = False

            for i in empty_indices:
                spot = spots[i]
                print(f"  生成: {spot['name']}")

                prompt = build_prompt(spot, category, c)
                desc = call_claude(prompt)

                if not desc:
                    print(f"  → 失敗")
                    continue

                # 文字数チェック
                if len(desc) < 30:
                    print(f"  → 短すぎる({len(desc)}文字): {desc}")
                    continue

                # 引用符などを除去
                desc = desc.strip('"\'「」')

                spots[i]["description"] = desc
                print(f"  → ({len(desc)}文字) {desc}")
                modified = True
                total_filled += 1

                time.sleep(0.5)  # Claude API は余裕あり

            if modified:
                with open(fpath, "w", encoding="utf-8") as f:
                    json.dump(spots, f, ensure_ascii=False, indent=2)
                print(f"  → 保存完了")

    print(f"\n{'='*50}")
    print(f"完了: {total_filled}件のdescriptionを生成")
    print(f"{'='*50}")


fill_descriptions()
