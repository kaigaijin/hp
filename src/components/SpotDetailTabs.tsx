"use client";

import { useState } from "react";
import {
  UtensilsCrossed,
  DollarSign,
  Camera,
  MapPin,
  CreditCard,
  Armchair,
  CarFront,
  CalendarCheck,
  Cigarette,
  Languages,
  ImageOff,
  ListX,
  FileQuestion,
} from "lucide-react";

type MenuItem = {
  name: string;
  price?: string;
  description?: string;
  category?: string;
};

type placeData = {
  name: string;
  address: string;
  description: string;
  detail?: string | null;
  menu?: MenuItem[];
  price_range?: string;
  payment?: string[];
  seats?: number | null;
  parking?: string | null;
  reservation?: string | null;
  smoking?: string | null;
  languages?: string[];
  images?: string[];
};

const tabs = [
  { id: "overview", label: "概要", icon: MapPin },
  { id: "photos", label: "写真", icon: Camera },
  { id: "menu", label: "メニュー", icon: UtensilsCrossed },
  { id: "details", label: "料金・詳細", icon: DollarSign },
] as const;

type TabId = (typeof tabs)[number]["id"];

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="py-12 text-center">
      <Icon size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
      <p className="text-sm font-medium text-stone-400 dark:text-stone-500 mb-1">
        {title}
      </p>
      <p className="text-xs text-stone-300 dark:text-stone-600">{description}</p>
    </div>
  );
}

export default function placeDetailTabs({
  place,
  displayName,
  overviewContent,
  mapEmbed,
}: {
  place: placeData;
  displayName: string;
  overviewContent: React.ReactNode;
  mapEmbed: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // メニューをカテゴリ別にグループ化
  const menuByCategory: Record<string, MenuItem[]> = {};
  if (place.menu && place.menu.length > 0) {
    for (const item of place.menu) {
      const cat = item.category ?? "その他";
      if (!menuByCategory[cat]) menuByCategory[cat] = [];
      menuByCategory[cat].push(item);
    }
  }

  const hasMenu = place.menu && place.menu.length > 0;
  const hasDetailInfo =
    place.price_range ||
    (place.payment && place.payment.length > 0) ||
    place.seats != null ||
    place.parking ||
    place.reservation ||
    place.smoking ||
    (place.languages && place.languages.length > 0);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      {/* タブヘッダー */}
      <div className="flex border-b border-stone-200 dark:border-stone-700 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-warm-600 dark:text-warm-400 border-warm-600 dark:border-warm-400"
                  : "text-stone-400 dark:text-stone-500 border-transparent hover:text-stone-600 dark:hover:text-stone-300"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* タブコンテンツ */}
      <div className="min-h-[200px]">
        {/* 概要タブ */}
        {activeTab === "overview" && (
          <div>
            <div className="p-5 space-y-3">
              {place.detail ? (
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  {place.detail}
                </p>
              ) : (
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                  {place.description}
                </p>
              )}
            </div>
            {/* 地図 */}
            {mapEmbed}
          </div>
        )}

        {/* 写真タブ */}
        {activeTab === "photos" && (
          <>
            {place.images && place.images.length > 0 ? (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {place.images.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ImageOff}
                title="写真はまだありません"
                description="店舗オーナーの方は、お問い合わせから写真を掲載できます"
              />
            )}
          </>
        )}

        {/* メニュータブ */}
        {activeTab === "menu" && (
          <>
            {hasMenu ? (
              <div className="divide-y divide-stone-100 dark:divide-stone-700">
                {Object.entries(menuByCategory).map(([catName, items]) => (
                  <div key={catName}>
                    {Object.keys(menuByCategory).length > 1 && (
                      <div className="px-5 py-2 bg-stone-50 dark:bg-stone-700/50">
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                          {catName}
                        </p>
                      </div>
                    )}
                    <table className="w-full">
                      <tbody>
                        {items.map((item, i) => (
                          <tr
                            key={i}
                            className="border-b border-stone-50 dark:border-stone-700/50 last:border-b-0"
                          >
                            <td className="px-5 py-2.5">
                              <p className="text-sm text-stone-700 dark:text-stone-200">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-2.5 text-right whitespace-nowrap">
                              {item.price && (
                                <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                                  {item.price}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ListX}
                title="メニュー情報はまだありません"
                description="店舗オーナーの方は、お問い合わせからメニューを掲載できます"
              />
            )}
          </>
        )}

        {/* 料金・詳細タブ */}
        {activeTab === "details" && (
          <>
            {hasDetailInfo ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {place.price_range && (
                  <div className="flex items-start gap-2.5">
                    <DollarSign size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">価格帯</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.price_range}
                      </dd>
                    </div>
                  </div>
                )}
                {place.payment && place.payment.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <CreditCard size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">支払い方法</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.payment.join(", ")}
                      </dd>
                    </div>
                  </div>
                )}
                {place.seats != null && (
                  <div className="flex items-start gap-2.5">
                    <Armchair size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">席数</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.seats}席
                      </dd>
                    </div>
                  </div>
                )}
                {place.parking && (
                  <div className="flex items-start gap-2.5">
                    <CarFront size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">駐車場</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.parking}
                      </dd>
                    </div>
                  </div>
                )}
                {place.reservation && (
                  <div className="flex items-start gap-2.5">
                    <CalendarCheck size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">予約</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.reservation}
                      </dd>
                    </div>
                  </div>
                )}
                {place.smoking && (
                  <div className="flex items-start gap-2.5">
                    <Cigarette size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">喫煙</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.smoking}
                      </dd>
                    </div>
                  </div>
                )}
                {place.languages && place.languages.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <Languages size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">対応言語</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {place.languages.join(", ")}
                      </dd>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={FileQuestion}
                title="詳細情報はまだありません"
                description="店舗オーナーの方は、お問い合わせから情報を掲載できます"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
