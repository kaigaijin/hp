#!/usr/bin/env python3
"""タイ（TH）の日本人向けスポットをGemini APIで収集するスクリプト"""
import requests, json, time, os, re

# APIキー読み込み
env_content = open('/Users/ryuichiueda/works/zh/kaigaijin/hp/.env').read()
API_KEY = [l.split('=',1)[1].strip() for l in env_content.split('\n') if l.startswith('GEMINI_API_KEY')][0]
MODEL = "gemini-2.5-flash-lite"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

BASE_DIR = "/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory/th"

def call_gemini(prompt):
    """Gemini APIを呼び出す（レート制限対応・リトライ秒数解析付き）"""
    while True:
        res = requests.post(URL, json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 8192}
        }, timeout=60)
        if res.status_code == 429:
            # retry-in秒数を解析
            import re as _re
            m = _re.search(r'retry in ([0-9.]+)s', res.text)
            wait = int(float(m.group(1))) + 5 if m else 65
            print(f"  → レート制限。{wait}秒待機...")
            time.sleep(wait)
            continue
        if res.status_code != 200:
            print(f"  → エラー {res.status_code}: {res.text[:200]}")
            return None
        data = res.json()
        candidates = data.get('candidates', [])
        if not candidates:
            print("  → candidatesが空")
            return None
        parts = candidates[0].get('content', {}).get('parts', [])
        for p in parts:
            if 'text' in p:
                return p['text']
        print(f"  → テキストなし (finishReason: {candidates[0].get('finishReason')})")
        return None

def name_to_slug(name):
    """施設名をkebab-caseに変換"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug

def extract_json(text):
    """テキストからJSON配列を抽出"""
    # コードブロック除去
    text = re.sub(r'```(?:json)?\n?', '', text)
    text = text.strip()

    # JSON配列を探す
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1:
        return None

    json_str = text[start:end+1]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"  → JSON解析エラー: {e}")
        # 不正な部分を除いて再試行
        try:
            # 行ごとにチェックして問題のある行を除去
            return None
        except:
            return None

def collect_category(category, category_ja, target_count, current_count):
    """カテゴリのスポットを収集して追記"""
    filepath = f"{BASE_DIR}/{category}.json"

    # 既存データ読み込み
    with open(filepath, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    existing_names = {s['name'].lower() for s in existing}
    needed = target_count - current_count

    if needed <= 0:
        print(f"  {category}: 目標達成済みスキップ")
        return 0

    print(f"\n=== {category} ({current_count}件 → 目標{target_count}件、{needed}件追加予定) ===")

    # プロンプト構築
    request_count = min(needed + 5, 30)  # 少し多めに要求

    prompt = f"""タイ・バンコクにある日本人向け{category_ja}を{request_count}件リストアップしてください。

条件:
- 日本語対応、日本人経営、日系、または在タイ日本人が多く利用するサービスであること
- バンコク中心（スクンビット・シーロム・アソーク・トンロー・エカマイ・プロンポン等）
- 実在する施設・企業のみ（Google検索で確認できるもの）
- 以下の施設は除外（既に収集済み）: {', '.join(list(existing_names)[:20])}

以下のJSON配列形式のみで返してください（前後のテキスト・コードブロック不要）:
[
  {{
    "name": "施設名（英語またはローマ字）",
    "name_ja": "日本語名（あれば、なければnull）",
    "area": "エリア名（BTS/MRT駅名or地区名）",
    "address": "住所（英語）",
    "phone": "+66XXXXXXXX（E.164形式、不明ならnull）",
    "website": "公式URL（不明ならnull）",
    "tags": ["特徴タグ1", "特徴タグ2"],
    "hours": "営業時間（不明ならnull）"
  }}
]"""

    result = call_gemini(prompt)
    if not result:
        print(f"  → API呼び出し失敗")
        return 0

    spots = extract_json(result)
    if not spots:
        print(f"  → JSON抽出失敗")
        print(f"  → レスポンス先頭: {result[:300]}")
        return 0

    print(f"  → {len(spots)}件取得")

    added = 0
    for spot in spots:
        name = spot.get('name', '')
        if not name:
            continue

        # 重複チェック
        if name.lower() in existing_names:
            print(f"  スキップ（重複）: {name}")
            continue

        # 新規スポット構築
        new_spot = {
            "slug": name_to_slug(name),
            "name": name,
            "name_ja": spot.get('name_ja'),
            "area": spot.get('area', ''),
            "address": spot.get('address', ''),
            "phone": spot.get('phone'),
            "phone_local": None,
            "email": None,
            "website": spot.get('website'),
            "hours": spot.get('hours'),
            "tags": spot.get('tags', []),
            "description": "",
            "rating": None,
            "user_rating_count": None,
            "price_level": None,
            "photo_name": None,
            "place_id": None,
            "lat": None,
            "lng": None,
            "status": "unverified",
            "source": "gemini_search",
            "last_verified": "2026-04-02",
            "ai_reviewed": False
        }

        existing.append(new_spot)
        existing_names.add(name.lower())
        added += 1
        print(f"  追加: {name}")

    # 上書き保存
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"  → {added}件追加完了（合計{len(existing)}件）")
    return added

# 収集設定（cleaning以降を再実行）
CATEGORIES = [
    ("cleaning",   "クリーニング・洗濯",        20, 12),
    ("car",        "レンタカー・カーサービス",    15, 12),
    ("pharmacy",   "薬局・ドラッグストア",       20, 11),
    ("pet",        "ペットショップ・動物病院",    20, 11),
    ("moving",     "引越し・輸送サービス",       20, 12),
    ("coworking",  "コワーキングスペース",       20, 12),
    ("insurance",  "保険会社・代理店",          20, 14),
    ("fitness",    "フィットネス・ジム",         20, 15),
]

total_added = 0

for category, category_ja, target, current in CATEGORIES:
    added = collect_category(category, category_ja, target, current)
    total_added += added
    # レート制限: 4.5秒以上の間隔
    time.sleep(5)

print(f"\n{'='*50}")
print(f"全カテゴリ処理完了: 合計{total_added}件追加")
print(f"{'='*50}")
