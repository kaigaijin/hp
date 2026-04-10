#!/usr/bin/env python3
"""
Kaigaijin スポット収集スクリプト v2
- Web Search有効化（gemini-2.0-flash）
- 収集時バリデーション（日本人向け根拠チェック）
- プロンプト強化（架空名称・根拠なし施設の排除）
- 精度優先のため要求件数を絞る
"""
import requests, json, time, re, os
from datetime import date

# APIキー取得
API_KEY = open('/Users/ryuichiueda/works/zh/kaigaijin/hp/.env').read()
API_KEY = [l.split('=',1)[1].strip() for l in API_KEY.split('\n') if l.startswith('GEMINI_API_KEY')][0]

# gemini-2.0-flash: Web Search対応・RPD 1,500（無料）
MODEL = "gemini-2.0-flash"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
TODAY = date.today().isoformat()

# ────────────────────────────────────────────────────────────
# 日本人向け根拠バリデーション
# ────────────────────────────────────────────────────────────

# 確実に日本関連と判断できるキーワード
JP_SIGNALS_STRONG = [
    # 日本語テキスト
    '日本', '日系', '日語', '和食', '居酒屋', '寿司', 'ラーメン', '焼肉',
    '日本人', '日本語', '日本式', '日本料理', '日本製',
    # 日本企業・ブランド名
    'toyota', 'nissan', 'honda', 'mazda', 'mitsubishi', 'subaru', 'suzuki', 'lexus',
    'sony', 'panasonic', 'sharp', 'hitachi', 'toshiba', 'fujitsu', 'nec',
    'yamato', 'sagawa', 'nippon express',
    'mizuho', 'mufg', 'smbc', 'sumitomo', 'nomura', 'daiwa', 'nikko',
    'tokio marine', 'sompo', 'aioi', 'mitsui sumitomo',
    'uniqlo', 'muji', 'nitori', 'daiso',
    # 日本語スクール・文化
    'nihongo', 'nihon', 'nippon', 'jlpt', 'japanese school', 'japanese language',
    # 人名パターン（日系事務所）
    'mori hamada', 'nishimura', 'nagashima', 'anderson mori', 'atsumi',
    'tmi associates', 'one asia',
]

JP_SIGNALS_WEAK = [
    # 英語での日本関連表現
    'japanese', 'japan', 'nihon', 'nippon', 'sakura', 'fuji', 'tokyo', 'osaka',
    'sushi', 'ramen', 'tempura', 'yakitori', 'izakaya', 'bento', 'matcha',
    'ikebana', 'judo', 'karate', 'aikido', 'kendo',
]

def has_jp_signal(place: dict) -> tuple[bool, str]:
    """日本人向けの根拠があるか判定。(OK, 理由) を返す"""
    haystack = ' '.join([
        place.get('name', ''),
        place.get('name_ja', '') or '',
        ' '.join(place.get('tags', [])),
        place.get('description', '') or '',
    ]).lower()

    for kw in JP_SIGNALS_STRONG:
        if kw in haystack:
            return True, f"強シグナル: {kw}"

    # 弱シグナルは2つ以上で合格
    weak_hits = [kw for kw in JP_SIGNALS_WEAK if kw in haystack]
    if len(weak_hits) >= 2:
        return True, f"弱シグナル×{len(weak_hits)}: {weak_hits[:3]}"
    if len(weak_hits) == 1:
        return False, f"弱シグナルが1つのみ（{weak_hits[0]}）— 根拠不十分"

    return False, "日本人向けの根拠なし"


# ────────────────────────────────────────────────────────────
# Gemini API呼び出し
# ────────────────────────────────────────────────────────────

def call_gemini(prompt: str, retry: int = 0) -> str | None:
    try:
        res = requests.post(URL, json={
            "contents": [{"parts": [{"text": prompt}]}],
            "tools": [{"google_search": {}}],  # Web Search有効
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 8192}
        }, timeout=90)

        if res.status_code == 429:
            m = re.search(r'retry in ([0-9.]+)s', res.text)
            wait = int(float(m.group(1))) + 5 if m else (65 if retry < 3 else 120)
            print(f"  レート制限。{wait}秒待機...")
            time.sleep(wait)
            return call_gemini(prompt, retry + 1)

        if res.status_code != 200:
            print(f"  APIエラー {res.status_code}: {res.text[:200]}")
            return None

        candidates = res.json().get('candidates', [])
        if not candidates:
            return None
        parts = candidates[0].get('content', {}).get('parts', [])
        # Web Search使用時はparts複数になることがある（text以外のpartも含む）
        for p in parts:
            if 'text' in p:
                return p['text']
        return None

    except Exception as e:
        print(f"  例外: {e}")
        return None


def parse_json(text: str) -> list:
    if not text:
        return []
    m = re.search(r'```(?:json)?\s*(\[[\s\S]*?\])\s*```', text)
    if m:
        text = m.group(1)
    else:
        m = re.search(r'\[[\s\S]*\]', text)
        if m:
            text = m.group(0)
    try:
        return json.loads(text)
    except Exception as e:
        print(f"  JSON解析エラー: {e}")
        return []


def slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


# ────────────────────────────────────────────────────────────
# スポット保存（バリデーション付き）
# ────────────────────────────────────────────────────────────

def add_places(country: str, category: str, new_places: list) -> tuple[int, int]:
    """バリデーション通過後にJSONへ追加。(追加件数, 除外件数) を返す"""
    path = f"/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory/{country}/{category}.json"
    if not os.path.exists(path):
        existing = []
    else:
        existing = json.load(open(path))

    existing_names = {s['name'].lower().replace(' ', '') for s in existing}
    existing_slugs = {s['slug'] for s in existing}

    added = 0
    excluded = 0

    for s in new_places:
        name = s.get('name', '').strip()
        if not name:
            continue

        # 重複チェック
        if name.lower().replace(' ', '') in existing_names:
            continue

        # ── 収集時バリデーション ──
        ok, reason = has_jp_signal(s)
        if not ok:
            print(f"  [除外] {name} — {reason}")
            excluded += 1
            continue

        slug = slugify(name)
        base_slug = slug
        i = 2
        while slug in existing_slugs:
            slug = f"{base_slug}-{i}"; i += 1

        existing.append({
            "slug": slug,
            "name": name,
            "name_ja": s.get('name_ja'),
            "area": s.get('area'),
            "address": s.get('address'),
            "phone": s.get('phone'),
            "phone_local": None,
            "email": None,
            "website": s.get('website'),
            "description": "",
            "tags": s.get('tags', []),
            "hours": s.get('hours'),
            "last_verified": TODAY,
            "status": "unverified",
            "source": "gemini_search",
            "ai_reviewed": False,
            "place_id": None, "lat": None, "lng": None,
            "rating": None, "user_rating_count": None,
            "price_level": None, "photo_name": None,
        })
        existing_names.add(name.lower().replace(' ', ''))
        existing_slugs.add(slug)
        added += 1
        print(f"  [追加] {name}")

    if added > 0:
        json.dump(existing, open(path, 'w'), ensure_ascii=False, indent=2)

    return added, excluded


# ────────────────────────────────────────────────────────────
# 収集プロンプト（強化版）
# ────────────────────────────────────────────────────────────

COUNTRY_CONFIG = {
    'sg': {'name_ja': 'シンガポール', 'name_en': 'Singapore', 'area': 'Orchard/Tanjong Pagar/Novena/Buona Vista'},
    'th': {'name_ja': 'タイ・バンコク', 'name_en': 'Bangkok', 'area': 'スクンビット/トンロー/プロンポン/シーロム'},
    'my': {'name_ja': 'マレーシア・クアラルンプール', 'name_en': 'Kuala Lumpur', 'area': 'KLCC/モントキアラ/バンサー/ブキッビンタン'},
    'hk': {'name_ja': '香港', 'name_en': 'Hong Kong', 'area': '銅鑼湾/尖沙咀/中環/湾仔'},
    'tw': {'name_ja': '台湾・台北', 'name_en': 'Taipei', 'area': '中山区/信義区/大安区/内湖区'},
    'kr': {'name_ja': '韓国・ソウル', 'name_en': 'Seoul', 'area': '麻浦区/江南区/鍾路区/用山区'},
    'vn': {'name_ja': 'ベトナム・ホーチミン', 'name_en': 'Ho Chi Minh City', 'area': 'ビンタン区/1区/2区/7区'},
    'au': {'name_ja': 'オーストラリア・シドニー', 'name_en': 'Sydney', 'area': 'CBD/チャッツウッド/ストラスフィールド'},
    'ae': {'name_ja': 'UAE・ドバイ', 'name_en': 'Dubai', 'area': 'DIFC/ダウンタウン/JLT/マリーナ'},
    'de': {'name_ja': 'ドイツ・デュッセルドルフ', 'name_en': 'Düsseldorf', 'area': 'インマーマン通り/オーバービルク/ミッテ'},
    'gb': {'name_ja': 'イギリス・ロンドン', 'name_en': 'London', 'area': 'シティ/ソーホー/南ケンジントン/カナリーワーフ'},
    'id': {'name_ja': 'インドネシア・ジャカルタ', 'name_en': 'Jakarta', 'area': '南ジャカルタ/クニンガン/スディルマン'},
}

CAT_NAME_JA = {
    'bank': '銀行・金融機関', 'repair': '修理・リペアサービス', 'cleaning': 'ハウスクリーニング・家事代行',
    'car': 'カーディーラー・レンタカー・車関連', 'pharmacy': '薬局・ドラッグストア',
    'pet': 'ペットショップ・動物病院', 'moving': '引越し・国際配送サービス',
    'coworking': 'コワーキングスペース', 'insurance': '保険会社・保険代理店',
    'fitness': 'フィットネスジム・スポーツクラブ', 'accounting': '会計・税務事務所',
    'legal': '弁護士・法律事務所', 'dental': '歯科クリニック',
    'clinic': '内科・総合クリニック', 'beauty': '美容室・ヘアサロン',
    'nail-esthetic': 'ネイル・エステサロン', 'real-estate': '不動産会社',
    'education': '日本語学校・補習校・学習塾', 'grocery': '日本食材スーパー・食材店',
    'cafe': 'カフェ・喫茶店', 'restaurant': 'レストラン・居酒屋・バー',
    'travel': '旅行代理店', 'hotel': 'ホテル',
}


def build_prompt(country: str, category: str, n: int, exclude_names: list) -> str:
    cfg = COUNTRY_CONFIG[country]
    cat_ja = CAT_NAME_JA.get(category, category)
    exclude_str = '、'.join(exclude_names[:15]) if exclude_names else 'なし'

    return f"""あなたは{cfg['name_ja']}在住の日本人向け生活情報を専門とするリサーチャーです。
Web検索を使って、{cfg['name_ja']}にある**日本人向け**の{cat_ja}を{n}件調査してください。

【必須条件】以下のいずれかを公式サイト・GoogleマップのレビューなどのWebで確認できた施設のみリストアップすること:
1. 日本語スタッフが在籍している
2. 日系企業・日本人経営である
3. 日本食・日本式サービスを提供している
4. 在{cfg['name_ja'].split('・')[0]}日本人コミュニティで広く認知されている

【除外条件】
- 上記条件をWebで確認できない施設は絶対に含めない
- 実在確認できない施設は含めない
- 以下は既に収集済みなので除外: {exclude_str}

【エリア】{cfg['area']}を中心に

以下のJSON配列のみを返してください（説明文・前置き不要）:
[
  {{
    "name": "施設名（英語またはローマ字）",
    "name_ja": "日本語名（確認できた場合のみ、不明ならnull）",
    "area": "エリア・駅名",
    "address": "住所（英語、確認できた場合のみ）",
    "phone": "+国番号XXXXXXXX（E.164形式、確認できた場合のみ。不明ならnull）",
    "website": "公式URL（確認できた場合のみ。不明ならnull）",
    "tags": ["日本語対応" or "日系" or "日本人経営" など根拠を示すタグを必ず含める", "特徴タグ2"],
    "hours": "営業時間（確認できた場合のみ。不明ならnull）"
  }}
]"""


def collect_category(country: str, category: str, n_need: int) -> tuple[int, int]:
    """n_need件追加を試みる。(追加件数, 除外件数) を返す"""
    path = f"/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory/{country}/{category}.json"
    existing = json.load(open(path)) if os.path.exists(path) else []
    exclude_names = [s['name'] for s in existing]

    # 精度優先: 要求件数を絞る（最大15件/回）
    request_n = min(n_need + 3, 15)

    prompt = build_prompt(country, category, request_n, exclude_names)
    text = call_gemini(prompt)
    if not text:
        print(f"  レスポンスなし")
        return 0, 0

    places = parse_json(text)
    if not places:
        print(f"  JSONパース失敗。先頭: {text[:150]}")
        return 0, 0

    print(f"  取得: {len(places)}件 → バリデーション中...")
    added, excluded = add_places(country, category, places)
    return added, excluded


# ────────────────────────────────────────────────────────────
# タスク定義（国・カテゴリ・追加目標件数）
# ────────────────────────────────────────────────────────────

import sys

# コマンドライン引数でタスクファイルを指定可能: python collect_places.py tasks_vn.json
TASKS_FILE = sys.argv[1] if len(sys.argv) > 1 else None

if TASKS_FILE and os.path.exists(TASKS_FILE):
    TASKS = json.load(open(TASKS_FILE))
    print(f"タスクファイル読み込み: {TASKS_FILE} ({len(TASKS)}件)")
else:
    # デフォルトタスク（件数少ないカテゴリを優先）
    TASKS = [
        # SG
        ("sg", "bank", 15), ("sg", "repair", 15), ("sg", "cleaning", 15),
        # TH
        ("th", "bank", 15), ("th", "repair", 15), ("th", "pharmacy", 15),
        # MY
        ("my", "bank", 15), ("my", "repair", 15), ("my", "cleaning", 15),
    ]


def get_count(country, category):
    path = f"/Users/ryuichiueda/works/zh/kaigaijin/hp/content/directory/{country}/{category}.json"
    if not os.path.exists(path):
        return 0
    return len(json.load(open(path)))


# ────────────────────────────────────────────────────────────
# メイン実行
# ────────────────────────────────────────────────────────────

total_added = 0
total_excluded = 0

for task in TASKS:
    country, category, n_need = task[0], task[1], task[2]
    current = get_count(country, category)
    print(f"\n[{country.upper()}/{category}] 現在{current}件 → +{n_need}件目標")

    added, excluded = collect_category(country, category, n_need)
    total_added += added
    total_excluded += excluded
    new_count = get_count(country, category)

    print(f"  結果: +{added}件追加 / {excluded}件除外 → 計{new_count}件")
    print(f"  [累計] 追加{total_added}件 / 除外{total_excluded}件")

    time.sleep(5)  # RPM対策

print(f"\n{'='*50}")
print(f"完了: 追加{total_added}件 / 除外{total_excluded}件")
print(f"除外率: {total_excluded/(total_added+total_excluded)*100:.1f}%" if (total_added+total_excluded) > 0 else "")
print(f"{'='*50}")
