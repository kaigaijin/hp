"use client";

import { useState, useCallback, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";

type MapSpot = {
  slug: string;
  name: string;
  name_ja?: string;
  area: string;
  category: string;
  categoryName: string;
  lat: number;
  lng: number;
  priority: number;
  score?: number; // レビュースコア（将来用、0〜5）
  description: string;
  tags: string[];
};

type CategoryFilter = {
  slug: string;
  name: string;
  count: number;
};

// カテゴリグループ → マーカー色マッピング
const categoryColorMap: Record<string, { bg: string; ring: string }> = {
  restaurant: { bg: "#e85d04", ring: "#dc2626" },
  cafe: { bg: "#e85d04", ring: "#dc2626" },
  "izakaya-bar": { bg: "#e85d04", ring: "#dc2626" },
  grocery: { bg: "#e85d04", ring: "#dc2626" },
  clinic: { bg: "#16a34a", ring: "#15803d" },
  dental: { bg: "#16a34a", ring: "#15803d" },
  pharmacy: { bg: "#16a34a", ring: "#15803d" },
  beauty: { bg: "#d946ef", ring: "#a21caf" },
  "nail-esthetic": { bg: "#d946ef", ring: "#a21caf" },
  fitness: { bg: "#d946ef", ring: "#a21caf" },
  "real-estate": { bg: "#2563eb", ring: "#1d4ed8" },
  moving: { bg: "#2563eb", ring: "#1d4ed8" },
  cleaning: { bg: "#2563eb", ring: "#1d4ed8" },
  repair: { bg: "#2563eb", ring: "#1d4ed8" },
  education: { bg: "#8b5cf6", ring: "#7c3aed" },
  accounting: { bg: "#64748b", ring: "#475569" },
  legal: { bg: "#64748b", ring: "#475569" },
  insurance: { bg: "#64748b", ring: "#475569" },
  bank: { bg: "#64748b", ring: "#475569" },
  travel: { bg: "#0891b2", ring: "#0e7490" },
  coworking: { bg: "#0891b2", ring: "#0e7490" },
  pet: { bg: "#0891b2", ring: "#0e7490" },
  car: { bg: "#0891b2", ring: "#0e7490" },
};

// カテゴリの頭文字（アイコン代わり）
const categoryLabel: Record<string, string> = {
  restaurant: "食",
  cafe: "茶",
  "izakaya-bar": "酒",
  grocery: "買",
  clinic: "医",
  dental: "歯",
  pharmacy: "薬",
  beauty: "美",
  "nail-esthetic": "美",
  fitness: "健",
  "real-estate": "住",
  moving: "引",
  cleaning: "清",
  repair: "修",
  education: "学",
  accounting: "税",
  legal: "法",
  insurance: "保",
  bank: "銀",
  travel: "旅",
  coworking: "席",
  pet: "ペ",
  car: "車",
};

const defaultColor = { bg: "#0284c7", ring: "#0369a1" };

// ズームレベルに応じた表示件数上限（カスタムDOMマーカーは200件超で重くなる）
function getMaxSpotsForZoom(zoom: number): number {
  if (zoom >= 16) return Infinity; // ストリートレベル: 全件表示
  if (zoom >= 15) return 200;
  if (zoom >= 14) return 150;
  if (zoom >= 13) return 100;
  if (zoom >= 12) return 60;
  return 40;
}

// シード付き疑似乱数（同じシードなら同じ列を返す、セッション単位で変わる）
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// 地図で探す需要が低いカテゴリ（会社・事務所系）は重みを下げる
const lowMapDemandCategories = new Set([
  "moving", "cleaning", "repair",
  "accounting", "legal", "insurance",
]);

// スコアに基づく重みを計算
// score 5.0 → 重み4倍、score 0（未評価）→ 重み1倍
function getWeight(spot: MapSpot): number {
  const base = lowMapDemandCategories.has(spot.category) ? 0.3 : 1;
  const scoreBonus = (spot.score ?? 0) * 0.6; // 0〜3.0の追加重み
  const priorityBonus = spot.priority * 2;    // 有料スポットの追加重み
  return base + scoreBonus + priorityBonus;
}

// セッション開始時に全スポットの表示優先度（ランダムキー）を事前計算する
// キーが高いほど表示されやすい。画面移動しても順位は変わらない
function precomputeRankKeys(
  spots: MapSpot[],
  seed: number,
): Record<string, number> {
  const rng = seededRandom(seed);
  const keys: Record<string, number> = {};
  for (const s of spots) {
    const id = `${s.category}-${s.slug}`;
    // Efraimidis-Spirakis: key = random^(1/weight) → 重みが大きいほど高い値になりやすい
    keys[id] = Math.pow(rng(), 1 / getWeight(s));
  }
  return keys;
}

// ビューポート内のスポットをフィルタ
function filterSpotsInView(
  spots: MapSpot[],
  bounds: google.maps.LatLngBounds | null,
  zoom: number,
  categoryFilter: string | null,
  rankKeys: Record<string, number>,
): MapSpot[] {
  let filtered = spots;

  // カテゴリフィルタ
  if (categoryFilter) {
    filtered = filtered.filter((s) => s.category === categoryFilter);
  }

  // ビューポートフィルタ
  if (bounds) {
    filtered = filtered.filter((s) =>
      bounds.contains({ lat: s.lat, lng: s.lng }),
    );
  }

  const maxSpots = getMaxSpotsForZoom(zoom);
  if (filtered.length <= maxSpots) return filtered;

  if (categoryFilter) {
    // カテゴリ選択時: 事前計算したランクキー順でソートして上位N件
    return [...filtered]
      .sort((a, b) =>
        (rankKeys[`${b.category}-${b.slug}`] ?? 0) -
        (rankKeys[`${a.category}-${a.slug}`] ?? 0)
      )
      .slice(0, maxSpots);
  }

  // 「すべて」表示: カテゴリ均等 + 各カテゴリ内はランクキー順
  const byCategory: Record<string, MapSpot[]> = {};
  for (const s of filtered) {
    (byCategory[s.category] ??= []).push(s);
  }
  // 各カテゴリ内をランクキー降順でソート
  for (const key of Object.keys(byCategory)) {
    byCategory[key].sort((a, b) =>
      (rankKeys[`${b.category}-${b.slug}`] ?? 0) -
      (rankKeys[`${a.category}-${a.slug}`] ?? 0)
    );
  }

  const catKeys = Object.keys(byCategory);
  if (catKeys.length === 0) return [];

  // カテゴリごとの割当枠を計算（均等配分 + 余り分配）
  const perCat = Math.floor(maxSpots / catKeys.length);
  let remainder = maxSpots - perCat * catKeys.length;

  const result: MapSpot[] = [];
  for (const key of catKeys) {
    const pool = byCategory[key];
    const quota = perCat + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    result.push(...pool.slice(0, quota));
  }

  return result;
}

function MapContent({
  spots,
  countryCode,
  categories,
  center,
}: {
  spots: MapSpot[];
  countryCode: string;
  categories: CategoryFilter[];
  center: { lat: number; lng: number };
}) {
  const map = useMap();
  const [selectedSpot, setSelectedSpot] = useState<MapSpot | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(12);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  // セッションごとに異なるシード → 全スポットのランク順位を1回だけ事前計算
  const rankKeys = useMemo(() => {
    const seed = Math.floor(Math.random() * 2147483647);
    return precomputeRankKeys(spots, seed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      setZoom(ev.detail.zoom);
      // LatLngBoundsLiteral → contains判定用の関数を手動で実装
      const b = ev.detail.bounds;
      setBounds({
        contains: (pos: { lat: number; lng: number }) =>
          pos.lat >= b.south &&
          pos.lat <= b.north &&
          pos.lng >= b.west &&
          pos.lng <= b.east,
      } as unknown as google.maps.LatLngBounds);
    },
    [],
  );

  const visibleSpots = useMemo(
    () => filterSpotsInView(spots, bounds, zoom, categoryFilter, rankKeys),
    [spots, bounds, zoom, categoryFilter, rankKeys],
  );

  const maxSpots = getMaxSpotsForZoom(zoom);
  const totalInView = useMemo(() => {
    let filtered = categoryFilter
      ? spots.filter((s) => s.category === categoryFilter)
      : spots;
    if (bounds) {
      filtered = filtered.filter((s) =>
        bounds.contains({ lat: s.lat, lng: s.lng }),
      );
    }
    return filtered.length;
  }, [spots, bounds, categoryFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* フィルタバー */}
      <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-4 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              categoryFilter === null
                ? "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30"
                : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600"
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                setCategoryFilter(
                  categoryFilter === cat.slug ? null : cat.slug,
                )
              }
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                categoryFilter === cat.slug
                  ? "text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30"
                  : "text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600"
              }`}
            >
              {cat.name}（{cat.count}）
            </button>
          ))}
        </div>
      </div>

      {/* 地図 */}
      <div className="flex-1 relative">
        <Map
          defaultZoom={12}
          defaultCenter={center}
          mapId="kai-spot-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          onCameraChanged={handleCameraChanged}
          className="w-full h-full"
        >
          {visibleSpots.map((spot) => {
            const color = categoryColorMap[spot.category] ?? defaultColor;
            const label = categoryLabel[spot.category] ?? "●";
            const isPremium = spot.priority >= 1;
            return (
              <AdvancedMarker
                key={`${spot.category}-${spot.slug}`}
                position={{ lat: spot.lat, lng: spot.lng }}
                onClick={() => setSelectedSpot(spot)}
                title={spot.name_ja ?? spot.name}
              >
                {/* ドロップピン型マーカー */}
                <div className="flex flex-col items-center" style={{ transform: "translate(0, -50%)" }}>
                  <div
                    className="flex items-center justify-center rounded-full shadow-lg text-white font-bold"
                    style={{
                      width: isPremium ? 36 : 30,
                      height: isPremium ? 36 : 30,
                      fontSize: isPremium ? 14 : 12,
                      backgroundColor: isPremium ? "#f59e0b" : color.bg,
                      border: `2.5px solid white`,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    {label}
                  </div>
                  {/* ピンの先端 */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: `6px solid white`,
                      marginTop: -1,
                    }}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {selectedSpot && (
            <InfoWindow
              position={{ lat: selectedSpot.lat, lng: selectedSpot.lng }}
              onCloseClick={() => setSelectedSpot(null)}
            >
              <div className="max-w-[260px] p-1">
                <Link
                  href={`/${countryCode}/spot/${selectedSpot.category}/${selectedSpot.slug}`}
                  className="group"
                >
                  <h3 className="text-sm font-bold text-stone-800 group-hover:text-ocean-600 transition-colors">
                    {selectedSpot.name_ja ?? selectedSpot.name}
                    <ExternalLink
                      size={12}
                      className="inline ml-1 opacity-50"
                    />
                  </h3>
                  {selectedSpot.name_ja && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {selectedSpot.name}
                    </p>
                  )}
                </Link>
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                  <MapPin size={10} />
                  {selectedSpot.area}
                </p>
                <p className="text-xs text-ocean-600 mt-0.5">
                  {selectedSpot.categoryName}
                </p>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  {selectedSpot.description}
                </p>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* 表示件数インジケータ */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-xs text-stone-600 dark:text-stone-300 px-3 py-1.5 rounded-lg shadow-md border border-stone-200 dark:border-stone-700">
          {visibleSpots.length < totalInView ? (
            <>
              {totalInView}件中 {visibleSpots.length}件を表示
              <span className="text-stone-400 ml-1">
                （ズームで全件表示）
              </span>
            </>
          ) : (
            <>{visibleSpots.length}件を表示</>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SpotMap({
  spots,
  countryCode,
  categories,
  center,
  apiKey,
}: {
  spots: MapSpot[];
  countryCode: string;
  categories: CategoryFilter[];
  center: { lat: number; lng: number };
  apiKey: string;
}) {
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900 text-stone-500 text-sm">
        地図を表示するにはGoogle Maps APIキーが必要です
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900 text-stone-500 text-sm">
        座標データ付きのスポットがまだありません
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapContent
        spots={spots}
        countryCode={countryCode}
        categories={categories}
        center={center}
      />
    </APIProvider>
  );
}
