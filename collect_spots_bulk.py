#!/usr/bin/env python3
"""複数国・カテゴリのスポットをGemini APIで一括収集するスクリプト"""
import requests, json, time, os, re

# APIキー読み込み
env_content = open('/Users/ryuichiueda/works/zh/kaigaijin/hp/.env').read()
API_KEY = [l.split('=',1)[1].strip() for l in env_content.split('\n') if l.startswith('GEMINI_API_KEY')][0]
MODEL = "gemini-2.5-flash-lite"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

BASE_DIR = "/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory"

TODAY = "2026-04-03"

# 国の設定
COUNTRY_CONFIG = {
    "ae": {
        "name_ja": "UAE（ドバイ）",
        "city": "ドバイ・アブダビ",
        "city_en": "Dubai, Abu Dhabi",
        "area_hint": "DIFC・ダウンタウンドバイ・ジュメイラ・マリーナ・ビジネスベイ等",
    },
    "vn": {
        "name_ja": "ベトナム（ホーチミン・ハノイ）",
        "city": "ホーチミン・ハノイ",
        "city_en": "Ho Chi Minh City, Hanoi",
        "area_hint": "ビンタン区・1区・3区・ハノイ市内等",
    },
    "gb": {
        "name_ja": "イギリス（ロンドン）",
        "city": "ロンドン",
        "city_en": "London",
        "area_hint": "シティ・ソーホー・コベントガーデン・カナリーワーフ・ノッティングヒル等",
    },
    "kr": {
        "name_ja": "韓国（ソウル）",
        "city": "ソウル",
        "city_en": "Seoul",
        "area_hint": "麻浦区・江南区・鍾路区・中区・用山区等",
    },
    "id": {
        "name_ja": "インドネシア（ジャカルタ・バリ）",
        "city": "ジャカルタ・バリ",
        "city_en": "Jakarta, Bali",
        "area_hint": "南ジャカルタ・クニンガン・スディルマン・バリ島クタ・スミニャック等",
    },
    "au": {
        "name_ja": "オーストラリア（シドニー・メルボルン）",
        "city": "シドニー・メルボルン",
        "city_en": "Sydney, Melbourne",
        "area_hint": "シティCBD・チャッツウッド・ストラスフィールド・メルボルンCBD等",
    },
}

# カテゴリ設定
CATEGORY_CONFIG = {
    "bank": "銀行・金融機関（日本人向け・日本語対応）",
    "clinic": "内科・一般診療クリニック（日本語対応・日系）",
    "dental": "歯科クリニック（日本語対応・日系）",
    "insurance": "保険会社・保険代理店（日系・日本語対応）",
    "legal": "弁護士・法律事務所（日系・日本語対応）",
    "accounting": "会計・税務事務所（日系・日本語対応）",
    "moving": "引越し・輸送サービス（日系・日本人向け）",
    "grocery": "スーパー・食材店（日本食材・日本人向け）",
    "cafe": "カフェ・喫茶店（日本系・日本人経営）",
    "beauty": "美容室・ヘアサロン（日系・日本語対応）",
    "education": "日本語学校・補習校・学習塾",
    "real-estate": "不動産（日系・日本語対応）",
    "fitness": "フィットネスジム（日系・日本人向け）",
    "coworking": "コワーキングスペース（日本人向け・日本語対応）",
    "pharmacy": "薬局・ドラッグストア（日本薬品取扱・日本語対応）",
    "pet": "ペットショップ・動物病院（日本語対応・日系）",
    "car": "レンタカー・カーサービス（日本語対応）",
    "travel": "旅行代理店（日系・日本語対応）",
}

# 収集タスク: (国コード, カテゴリ, 追加目標件数)
TASKS = [
    # VN - 件数少ないカテゴリ（前回未完了）
    ("vn", "insurance", 15),
    ("vn", "legal", 20),
    ("vn", "moving", 20),
    ("vn", "grocery", 30),
    ("vn", "cafe", 40),
    ("vn", "education", 20),
    # GB - 件数少ないカテゴリ
    ("gb", "accounting", 20),
    ("gb", "legal", 20),
    ("gb", "moving", 20),
    ("gb", "travel", 20),
    # KR - 件数少ないカテゴリ
    ("kr", "bank", 20),
    ("kr", "car", 20),
    ("kr", "cleaning", 20),
    ("kr", "moving", 20),
    ("kr", "pharmacy", 20),
    # ID - 補強
    ("id", "bank", 15),
    ("id", "pharmacy", 20),
    # AE - 補強
    ("ae", "bank", 15),
    ("ae", "clinic", 15),
    ("ae", "dental", 15),
]


def call_gemini(prompt):
    """Gemini APIを呼び出す（レート制限対応・リトライ秒数解析付き）"""
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
    """施設名をkebab-caseに変換"""
    slug = name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def extract_json(text):
    """テキストからJSON配列を抽出"""
    text = re.sub(r'```(?:json)?\n?', '', text)
    text = text.strip()
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1:
        return None
    json_str = text[start:end+1]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"  → JSON解析エラー: {e}")
        return None


def load_existing(filepath):
    """既存JSONを読み込む（ファイルがなければ空リスト）"""
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def collect_spots(country, category, add_count):
    """指定国・カテゴリのスポットをadd_count件追加収集"""
    filepath = f"{BASE_DIR}/{country}/{category}.json"
    country_cfg = COUNTRY_CONFIG.get(country, {})
    category_ja = CATEGORY_CONFIG.get(category, category)

    existing = load_existing(filepath)
    existing_names = {s['name'].lower() for s in existing}
    current_count = len(existing)

    print(f"\n=== {country}/{category} ({current_count}件 → +{add_count}件) ===")

    request_count = min(add_count + 5, 30)

    prompt = f"""{country_cfg.get('name_ja', country)}（{country_cfg.get('city', '')}）にある日本人向け{category_ja}を{request_count}件リストアップしてください。

条件:
- 日本語対応、日本人経営、日系、または在{country_cfg.get('name_ja', country).split('（')[0]}日本人が多く利用するサービスであること
- {country_cfg.get('city_en', '')}中心（{country_cfg.get('area_hint', '')}）
- 実在する施設・企業のみ（Google検索で確認できるもの）
- 以下の施設は除外（既に収集済み）: {', '.join(list(existing_names)[:20])}

以下のJSON配列形式のみで返してください（前後のテキスト・コードブロック不要）:
[
  {{
    "name": "施設名（英語またはローマ字）",
    "name_ja": "日本語名（あれば、なければnull）",
    "area": "エリア名（駅名or地区名）",
    "address": "住所（英語）",
    "phone": "+国番号電話番号（E.164形式、不明ならnull）",
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

        if name.lower() in existing_names:
            print(f"  スキップ（重複）: {name}")
            continue

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
            "last_verified": TODAY,
            "ai_reviewed": False
        }

        existing.append(new_spot)
        existing_names.add(name.lower())
        added += 1
        print(f"  追加: {name}")

        if added >= add_count:
            break

    # 保存
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    print(f"  → {added}件追加完了（合計{len(existing)}件）")
    return added


# メイン実行
total_added = 0
for country, category, add_count in TASKS:
    added = collect_spots(country, category, add_count)
    total_added += added
    print(f"  [累計] {total_added}件追加済み")
    time.sleep(5)  # レート制限対応

print(f"\n{'='*50}")
print(f"全タスク処理完了: 合計{total_added}件追加")
print(f"{'='*50}")
