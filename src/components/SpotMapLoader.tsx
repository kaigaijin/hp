"use client";

import dynamic from "next/dynamic";

const SpotMap = dynamic(() => import("@/components/SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900 text-stone-500 text-sm">
      地図を読み込み中...
    </div>
  ),
});

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

export default function SpotMapLoader({
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
  return (
    <SpotMap
      spots={spots}
      countryCode={countryCode}
      categories={categories}
      center={center}
      apiKey={apiKey}
    />
  );
}
