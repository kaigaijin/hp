"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  Tag,
  Filter,
  Loader2,
  ChevronDown,
} from "lucide-react";

type Place = {
  id: string;
  slug: string;
  name: string;
  name_ja?: string;
  country_code: string;
  category: string;
  area?: string;
  address?: string;
  website?: string | null;
  source_url?: string | null;
  description?: string;
  tags?: string[];
  hours?: string | null;
  status?: string;
  phone?: string | null;
  human_reviewed: boolean;
  human_review_result?: string | null;
  human_reviewed_at?: string | null;
  needs_review?: boolean;
};

type FilterType = "unreviewed" | "approved" | "rejected" | "all";

const COUNTRY_NAME: Record<string, string> = {
  sg: "🇸🇬 シンガポール",
  th: "🇹🇭 タイ",
  my: "🇲🇾 マレーシア",
  hk: "🇭🇰 香港",
  tw: "🇹🇼 台湾",
  kr: "🇰🇷 韓国",
  vn: "🇻🇳 ベトナム",
  au: "🇦🇺 オーストラリア",
  ae: "🇦🇪 UAE",
  de: "🇩🇪 ドイツ",
  gb: "🇬🇧 イギリス",
  id: "🇮🇩 インドネシア",
  us: "🇺🇸 アメリカ",
  ca: "🇨🇦 カナダ",
  fr: "🇫🇷 フランス",
};

const CATEGORY_NAME: Record<string, string> = {
  restaurant: "レストラン",
  cafe: "カフェ",
  clinic: "クリニック",
  dental: "歯科",
  pharmacy: "薬局",
  beauty: "美容室",
  "nail-esthetic": "ネイル・エステ",
  fitness: "フィットネス",
  "real-estate": "不動産",
  grocery: "スーパー",
  education: "教育",
  accounting: "会計",
  legal: "法律",
  insurance: "保険",
  bank: "銀行",
  moving: "引越し",
  travel: "旅行",
  coworking: "コワーキング",
  pet: "ペット",
  car: "車",
  cleaning: "クリーニング",
  repair: "修理",
  salon: "サロン",
};

const FILTER_LABELS: Record<FilterType, string> = {
  unreviewed: "未レビュー",
  approved: "承認済み",
  rejected: "却下済み",
  all: "すべて",
};

export function ReviewDashboard({ password }: { password: string }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("unreviewed");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, reviewed: 0, approved: 0, rejected: 0 });

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (countryFilter) params.set("country", countryFilter);
    if (categoryFilter) params.set("category", categoryFilter);

    const res = await fetch(`/api/review?${params}`, {
      headers: { "x-review-password": password },
    });
    if (res.ok) {
      const data = await res.json();
      setPlaces(data.places);
    }
    setLoading(false);
  }, [password, filter, countryFilter, categoryFilter]);

  const fetchStats = useCallback(async () => {
    const [allRes, approvedRes, rejectedRes] = await Promise.all([
      fetch("/api/review?filter=all", { headers: { "x-review-password": password } }),
      fetch("/api/review?filter=approved", { headers: { "x-review-password": password } }),
      fetch("/api/review?filter=rejected", { headers: { "x-review-password": password } }),
    ]);
    if (allRes.ok && approvedRes.ok && rejectedRes.ok) {
      const [allData, approvedData, rejectedData] = await Promise.all([
        allRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
      ]);
      const total = allData.places.length;
      const approved = approvedData.places.length;
      const rejected = rejectedData.places.length;
      setStats({ total, reviewed: approved + rejected, approved, rejected });
    }
  }, [password]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-review-password": password,
      },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        approved: action === "approve" ? prev.approved + 1 : prev.approved,
        rejected: action === "reject" ? prev.rejected + 1 : prev.rejected,
      }));
    }
    setActionLoading(null);
  }

  const countries = [...new Set(places.map((p) => p.country_code))].sort();
  const categoriesInView = [...new Set(places.map((p) => p.category))].sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gray-900 text-white px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">プレイス精査</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                全{stats.total}件
              </span>
              <span className="text-green-400">
                ✓ {stats.approved}
              </span>
              <span className="text-red-400">
                ✗ {stats.rejected}
              </span>
              <span className="text-yellow-400">
                残 {stats.total - stats.reviewed}
              </span>
            </div>
          </div>

          {/* プログレスバー */}
          {stats.total > 0 && (
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${(stats.approved / stats.total) * 100}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-[72px] z-40">
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <Filter size={14} className="text-gray-400" />

          {/* ステータスフィルタ */}
          <div className="flex gap-1">
            {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  filter === f
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-300" />

          {/* 国フィルタ */}
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 pr-7 appearance-none bg-white"
            >
              <option value="">全国</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {COUNTRY_NAME[c] ?? c.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* カテゴリフィルタ */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 pr-7 appearance-none bg-white"
            >
              <option value="">全カテゴリ</option>
              {categoriesInView.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_NAME[c] ?? c}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {loading ? "読込中..." : `${places.length}件表示`}
          </span>
        </div>
      </div>

      {/* プレイスリスト */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={32} className="mx-auto mb-3 animate-spin text-gray-300" />
            <p className="text-gray-400 text-sm">読み込み中...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-300" />
            <p className="text-gray-500">
              {filter === "unreviewed"
                ? "未レビューのプレイスはありません"
                : "該当するプレイスはありません"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isLoading={actionLoading === place.id}
                onAction={(action) => handleAction(place.id, action)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceCard({
  place,
  isLoading,
  onAction,
}: {
  place: Place;
  isLoading: boolean;
  onAction: (action: "approve" | "reject") => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* 上段 */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {COUNTRY_NAME[place.country_code] ?? place.country_code.toUpperCase()}
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {CATEGORY_NAME[place.category] ?? place.category}
            </span>
            {place.needs_review && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                要確認
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-sm mt-1">
            {place.name}
            {place.name_ja && (
              <span className="text-gray-500 font-normal ml-1">
                ({place.name_ja})
              </span>
            )}
          </h3>

          {place.address && (
            <p className="flex items-start gap-1 text-xs text-gray-500 mt-1">
              <MapPin size={11} className="mt-0.5 shrink-0" />
              {place.address}
            </p>
          )}
        </div>

        {/* リンク */}
        <div className="flex flex-col gap-1 shrink-0">
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink size={12} />
              公式サイト
            </a>
          )}
          {place.source_url && place.source_url !== place.website && (
            <a
              href={place.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink size={12} />
              ソース
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {place.description && (
        <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
          {place.description}
        </p>
      )}

      {/* Tags */}
      {place.tags && place.tags.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <Tag size={11} className="text-gray-400" />
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* アクション */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
        <span className="text-[10px] text-gray-400">
          {place.hours && `${place.hours} · `}
          {place.phone && `${place.phone} · `}
          {place.status}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {place.human_reviewed ? (
            <span
              className={`text-xs font-medium flex items-center gap-1 ${
                place.human_review_result === "approved"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {place.human_review_result === "approved" ? (
                <>
                  <CheckCircle size={14} /> 承認済み
                </>
              ) : (
                <>
                  <XCircle size={14} /> 却下済み
                </>
              )}
            </span>
          ) : (
            <>
              <button
                onClick={() => onAction("approve")}
                disabled={isLoading}
                className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                OK
              </button>
              <button
                onClick={() => onAction("reject")}
                disabled={isLoading}
                className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                NG
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
