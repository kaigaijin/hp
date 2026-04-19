import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CountryTabs from "./CountryTabs";

type Props = {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  currentLabel: string;         // パンくずの現在地テキスト
  label: string;                // 「— KAI PLACE」など
  title: string;                // h1
  subtitle?: string;            // 説明文
  articleCount: number;
  placeCount: number;
  right?: React.ReactNode;      // 右側スロット（検索・CTA等）
  subTabs?: React.ReactNode;    // スポット内のカテゴリ/エリア/地図タブ
};

export default function CountryHero({
  countryCode,
  countryName,
  countryFlag,
  currentLabel,
  label,
  title,
  subtitle,
  articleCount,
  placeCount,
  right,
  subTabs,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e] pb-0">
      {/* 国別タブ（記事/スポット/求人）— パンくずの上 */}
      <CountryTabs
        countryCode={countryCode}
        articleCount={articleCount}
        placeCount={placeCount}
      />
      {/* ヒーロー本体 — 全ページ同じ高さに揃える */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-8" style={{ minHeight: 220 }}>
        {/* パンくず */}
        <nav className="flex items-center gap-1.5 text-xs text-stone-400/80 mb-6">
          <Link href="/" className="hover:text-white transition-colors">トップ</Link>
          <ChevronRight size={12} />
          <Link href={`/${countryCode}/column`} className="hover:text-white transition-colors">
            {countryFlag} {countryName}
          </Link>
          <ChevronRight size={12} />
          <span className="text-white/90">{currentLabel}</span>
        </nav>

        {/* メインコンテンツ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-500 mb-3">
              {label}
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-stone-400 text-sm leading-relaxed max-w-lg">
                {subtitle}
              </p>
            )}
          </div>
          {right && (
            <div className="shrink-0 w-full md:w-auto md:min-w-[260px] md:max-w-[320px]">
              {right}
            </div>
          )}
        </div>

        {/* subTabs or 等価スペーサー — 全ページで底辺の高さを揃える */}
        <div className="mt-6" style={{ minHeight: 40 }}>
          {subTabs}
        </div>
      </div>
    </div>
  );
}
