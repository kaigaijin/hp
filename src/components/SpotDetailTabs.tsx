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

type SpotData = {
  name: string;
  address: string;
  description: string;
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

export default function SpotDetailTabs({
  spot,
  displayName,
  overviewContent,
  mapEmbed,
}: {
  spot: SpotData;
  displayName: string;
  overviewContent: React.ReactNode;
  mapEmbed: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // メニューをカテゴリ別にグループ化
  const menuByCategory: Record<string, MenuItem[]> = {};
  if (spot.menu && spot.menu.length > 0) {
    for (const item of spot.menu) {
      const cat = item.category ?? "その他";
      if (!menuByCategory[cat]) menuByCategory[cat] = [];
      menuByCategory[cat].push(item);
    }
  }

  const hasMenu = spot.menu && spot.menu.length > 0;
  const hasDetailInfo =
    spot.price_range ||
    (spot.payment && spot.payment.length > 0) ||
    spot.seats != null ||
    spot.parking ||
    spot.reservation ||
    spot.smoking ||
    (spot.languages && spot.languages.length > 0);

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
                  ? "text-ocean-600 dark:text-ocean-400 border-ocean-600 dark:border-ocean-400"
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
            <div className="p-5">
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                {spot.description}
              </p>
            </div>
            {/* 地図 */}
            {mapEmbed}
          </div>
        )}

        {/* 写真タブ */}
        {activeTab === "photos" && (
          <>
            {spot.images && spot.images.length > 0 ? (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {spot.images.map((src, i) => (
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
                {spot.price_range && (
                  <div className="flex items-start gap-2.5">
                    <DollarSign size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">価格帯</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.price_range}
                      </dd>
                    </div>
                  </div>
                )}
                {spot.payment && spot.payment.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <CreditCard size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">支払い方法</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.payment.join(", ")}
                      </dd>
                    </div>
                  </div>
                )}
                {spot.seats != null && (
                  <div className="flex items-start gap-2.5">
                    <Armchair size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">席数</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.seats}席
                      </dd>
                    </div>
                  </div>
                )}
                {spot.parking && (
                  <div className="flex items-start gap-2.5">
                    <CarFront size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">駐車場</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.parking}
                      </dd>
                    </div>
                  </div>
                )}
                {spot.reservation && (
                  <div className="flex items-start gap-2.5">
                    <CalendarCheck size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">予約</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.reservation}
                      </dd>
                    </div>
                  </div>
                )}
                {spot.smoking && (
                  <div className="flex items-start gap-2.5">
                    <Cigarette size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">喫煙</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.smoking}
                      </dd>
                    </div>
                  </div>
                )}
                {spot.languages && spot.languages.length > 0 && (
                  <div className="flex items-start gap-2.5">
                    <Languages size={14} className="text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs text-stone-400 mb-0.5">対応言語</dt>
                      <dd className="text-sm text-stone-700 dark:text-stone-300">
                        {spot.languages.join(", ")}
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
