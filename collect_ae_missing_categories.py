#!/usr/bin/env python3
"""AEに存在しないカテゴリを新規作成して収集するスクリプト"""
import requests, json, time, os, re

# APIキー読み込み
env_content = open('/Users/ryuichiueda/works/zh/kaigaijin/hp/.env').read()
API_KEY = [l.split('=',1)[1].strip() for l in env_content.split('\n') if l.startswith('GEMINI_API_KEY')][0]
MODEL = "gemini-2.5-flash-lite"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

BASE_DIR = "/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory/ae"
TODAY = "2026-04-03"

# AEに存在しないが需要があるカテゴリ
TASKS = [
    ("car",       "レンタカー・カーサービス（日系・日本語対応）",    20),
    ("coworking", "コワーキングスペース（日本人向け・日本語対応）",  15),
    ("pet",       "ペットショップ・動物病院（日本語対応・日系）",    15),
    ("fitness",   "フィットネスジム（日系・日本人向け）",           20),
    ("pharmacy",  "薬局・ドラッグストア（日本薬品取扱・日本語対応）", 15),
    ("repair",    "家電修理・修繕サービス（日本語対応・日系）",      10),
    ("cleaning",  "クリーニング・洗濯サービス（日本語対応）",        15),
]


def call_gemini(prompt):
    while True:
        res = requests.post(URL, json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 8192}
        }, timeout=60)
        if res.status_code == 429:
            m = re.search(r'retry in ([0-9.]+)s', res.text)
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
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def extract_json(text):
    text = re.sub(r'```(?:json)?\n?', '', text)
    text = text.strip()
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(text[start:end+1])
    except json.JSONDecodeError as e:
        print(f"  → JSON解析エラー: {e}")
        return None


def collect_new_category(category, category_ja, target_count):
    filepath = f"{BASE_DIR}/{category}.json"
    print(f"\n=== ae/{category} (新規作成・{target_count}件) ===")

    prompt = f"""UAE（ドバイ・アブダビ）にある日本人向け{category_ja}を{target_count + 5}件リストアップしてください。

条件:
- 日本語対応、日本人経営、日系、または在UAE日本人が多く利用するサービスであること
- ドバイ・アブダビ中心（DIFC・ダウンタウンドバイ・ジュメイラ・マリーナ・ビジネスベイ等）
- 実在する施設・企業のみ（Google検索で確認できるもの）

以下のJSON配列形式のみで返してください（前後のテキスト・コードブロック不要）:
[
  {{
    "name": "施設名（英語またはローマ字）",
    "name_ja": "日本語名（あれば、なければnull）",
    "area": "エリア名（地区名）",
    "address": "住所（英語）",
    "phone": "+971XXXXXXXX（E.164形式、不明ならnull）",
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

    new_spots = []
    seen_names = set()
    for spot in spots:
        name = spot.get('name', '')
        if not name or name.lower() in seen_names:
            continue
        new_spots.append({
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
            "last_verified": TODAY,
            "ai_reviewed": False
        })
        seen_names.add(name.lower())
        print(f"  追加: {name}")
        if len(new_spots) >= target_count:
            break

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(new_spots, f, ensure_ascii=False, indent=2)

    print(f"  → {len(new_spots)}件で新規作成完了")
    return len(new_spots)


total_added = 0
for category, category_ja, target in TASKS:
    added = collect_new_category(category, category_ja, target)
    total_added += added
    print(f"  [累計] {total_added}件追加済み")
    time.sleep(5)

print(f"\n{'='*50}")
print(f"AE新規カテゴリ作成完了: 合計{total_added}件")
print(f"{'='*50}")
