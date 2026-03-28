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
  description: string;
  tags: string[];
};

type CategoryFilter = {
  slug: string;
  name: string;
  count: number;
};

// ズームレベルに応じた表示件数上限
// 有料スポット（priority >= 1）は常に表示
function getMaxSpotsForZoom(zoom: number): number {
  if (zoom >= 16) return Infinity; // ストリートレベル: 全件表示
  if (zoom >= 15) return 200;
  if (zoom >= 14) return 100;
  if (zoom >= 13) return 50;
  if (zoom >= 12) return 30;
  return 20; // 市全体: 厳選20件
}

// ビューポート内のスポットをフィルタ
function filterSpotsInView(
  spots: MapSpot[],
  bounds: google.maps.LatLngBounds | null,
  zoom: number,
  categoryFilter: string | null,
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

  // ズームレベル制御: 有料スポットを優先表示
  const maxSpots = getMaxSpotsForZoom(zoom);
  if (filtered.length <= maxSpots) return filtered;

  // 有料スポットは常に表示
  const premium = filtered.filter((s) => s.priority >= 1);
  const normal = filtered.filter((s) => s.priority < 1);

  // 通常スポットから残り枠を埋める
  const remaining = maxSpots - premium.length;
  if (remaining <= 0) return premium;

  return [...premium, ...normal.slice(0, remaining)];
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
    () => filterSpotsInView(spots, bounds, zoom, categoryFilter),
    [spots, bounds, zoom, categoryFilter],
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
          {visibleSpots.map((spot) => (
            <AdvancedMarker
              key={`${spot.category}-${spot.slug}`}
              position={{ lat: spot.lat, lng: spot.lng }}
              onClick={() => setSelectedSpot(spot)}
              title={spot.name_ja ?? spot.name}
            >
              <div
                className={`w-3 h-3 rounded-full border-2 border-white shadow-md ${
                  spot.priority >= 1
                    ? "bg-amber-500 w-4 h-4"
                    : "bg-ocean-600"
                }`}
              />
            </AdvancedMarker>
          ))}

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
