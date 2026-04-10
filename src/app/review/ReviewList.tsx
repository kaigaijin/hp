"use client";

import { useState } from "react";
import { ExternalLink, AlertTriangle, MapPin, Tag } from "lucide-react";
import { ActionButtons } from "./ActionButtons";

type place = {
  slug: string;
  name: string;
  name_ja?: string;
  address?: string;
  website?: string | null;
  description?: string;
  review_note?: string;
  tags?: string[];
  country: string;
  category: string;
};

const COUNTRY_NAME: Record<string, string> = {
  sg: "シンガポール", th: "タイ", my: "マレーシア", hk: "香港",
  tw: "台湾", kr: "韓国", vn: "ベトナム", au: "オーストラリア",
  ae: "UAE", de: "ドイツ", gb: "イギリス", id: "インドネシア",
  cn: "中国", ph: "フィリピン", us: "アメリカ", ca: "カナダ", fr: "フランス",
};

const CATEGORY_NAME: Record<string, string> = {
  restaurant: "レストラン", cafe: "カフェ", clinic: "クリニック",
  dental: "歯科", pharmacy: "薬局", beauty: "美容室",
  "nail-esthetic": "ネイル・エステ", fitness: "フィットネス",
  "real-estate": "不動産", grocery: "スーパー", education: "教育",
  accounting: "会計", legal: "法律", insurance: "保険",
  bank: "銀行", moving: "引越し", travel: "旅行",
  coworking: "コワーキング", pet: "ペット", car: "車",
  cleaning: "クリーニング", repair: "修理",
};

export function ReviewList({ initialplaces }: { initialplaces: place[] }) {
  const [places, setplaces] = useState(initialplaces);

  function handleDone(slug: string, country: string, category: string, action: "delete" | "keep") {
    if (action === "delete" || action === "keep") {
      setplaces((prev) =>
        prev.filter((s) => !(s.slug === slug && s.country === country && s.category === category))
      );
    }
  }

  const byCountry: Record<string, place[]> = {};
  for (const place of places) {
    if (!byCountry[place.country]) byCountry[place.country] = [];
    byCountry[place.country].push(place);
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-lg">要確認スポットはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(byCountry).map(([country, countryplaces]) => (
        <section key={country}>
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">
              {COUNTRY_NAME[country] ?? country.toUpperCase()}
            </span>
            <span className="text-gray-400 text-sm font-normal">{countryplaces.length}件</span>
          </h2>

          <div className="space-y-3">
            {countryplaces.map((place) => (
              <div
                key={`${country}-${place.category}-${place.slug}`}
                className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm"
              >
                {/* 上段: 店名・カテゴリ・リンク */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                        {CATEGORY_NAME[place.category] ?? place.category}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug">
                        {place.name}
                        {place.name_ja && (
                          <span className="text-gray-500 font-normal ml-1">
                            ({place.name_ja})
                          </span>
                        )}
                      </h3>
                    </div>

                    {place.address && (
                      <p className="flex items-start gap-1 text-xs text-gray-500 mt-1">
                        <MapPin size={11} className="mt-0.5 shrink-0" />
                        {place.address}
                      </p>
                    )}
                  </div>

                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink size={12} />
                      公式サイト
                    </a>
                  )}
                </div>

                {place.description && (
                  <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                    {place.description}
                  </p>
                )}

                {place.review_note && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {place.review_note}
                    </p>
                  </div>
                )}

                {place.tags && place.tags.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <Tag size={11} className="text-gray-400" />
                    {place.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* アクションエリア */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                  <span className="text-xs text-gray-400">
                    slug: <code className="bg-gray-100 px-1 rounded text-gray-600">{place.slug}</code>
                  </span>
                  <div className="ml-auto">
                    <ActionButtons
                      country={place.country}
                      category={place.category}
                      slug={place.slug}
                      onDone={(action) => handleDone(place.slug, place.country, place.category, action)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
