import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountryCard from "@/components/CountryCard";
import { countries, regionOrder, regionLabels } from "@/lib/countries";
import { getCategoryCounts } from "@/lib/directory";
import { Globe } from "lucide-react";

export default function Home() {
  // 地域ごとにグルーピング
  const countriesByRegion = regionOrder.map((region) => ({
    region,
    label: regionLabels[region],
    countries: countries.filter((c) => c.region === region),
  }));

  // 各国のスポット件数を計算
  const spotCounts: Record<string, number> = {};
  for (const c of countries) {
    const counts = getCategoryCounts(c.code);
    spotCounts[c.code] = Object.values(counts).reduce((a, b) => a + b, 0);
  }

  return (
    <>
      <Header />
      <main>
        {/* ===== ヒーロー ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e] text-white">

          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

              {/* 左: キャッチコピー + CTA */}
              <div>
                <p className="section-label mb-5 text-teal-400">
                  — Overseas Japanese Media
                </p>
                <h1 className="heading-editorial text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                  その国で、
                  <br />
                  <span style={{ color: "#e8a46e" }}>深く</span>暮らす。
                </h1>
                <p className="text-stone-400 leading-relaxed max-w-md text-base mb-8">
                  ビザ、税金、保険、住居、医療——国ごとに異なる「暮らしの実務」を、在住者の視点で丁寧に解説します。
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#countries"
                    className="inline-flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
                  >
                    国別ガイドを見る
                  </a>
                  <a
                    href="/sg/place"
                    className="inline-flex items-center gap-2 border border-stone-600 hover:border-stone-400 text-stone-300 hover:text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
                  >
                    スポットを探す
                  </a>
                </div>
              </div>

              {/* 右: 国グリッド（デスクトップ） */}
              <div className="hidden lg:block">
                <p className="section-label mb-4 text-teal-400">— {countries.length} カ国 対応</p>
                <div className="grid grid-cols-2 gap-2">
                  {countries.map((c) => (
                    <a
                      key={c.code}
                      href={`/${c.code}`}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-warm-400/50 px-4 py-3 rounded-xl text-sm transition-all group"
                    >
                      <span className="text-2xl">{c.flag}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-200 group-hover:text-warm-300 transition-colors">{c.name}</p>
                        <p className="text-xs text-stone-500 truncate">{c.population}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* モバイル: フラグ横並び */}
              <div className="lg:hidden flex flex-wrap gap-2">
                {countries.map((c) => (
                  <a
                    key={c.code}
                    href={`/${c.code}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm transition-colors"
                  >
                    <span>{c.flag}</span>
                    {c.name}
                  </a>
                ))}
              </div>

            </div>
          </div>

          {/* 波形の区切り（繊細な2重波） */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 88"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 48C240 88 480 16 720 48C960 80 1200 20 1440 48V88H0V48Z"
                className="fill-sand-50 dark:fill-stone-900"
                fillOpacity="0.5"
              />
              <path
                d="M0 60C300 88 600 28 900 60C1080 76 1260 52 1440 60V88H0V60Z"
                className="fill-sand-50 dark:fill-stone-900"
              />
            </svg>
          </div>
        </section>

        {/* ===== Kaigaijinとは ===== */}
        <section className="py-20 md:py-28 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl mb-16">
              <p className="section-label mb-4">— ABOUT</p>
              <h2 className="heading-editorial text-4xl md:text-5xl font-bold mb-6">
                国別に深い、
                <br />
                だから役に立つ
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                住居、医療、ビザ、税金、銀行——海外で暮らすと「日本語で読める実務情報」が足りないことに気づく。
                Kaigaijinは、国ごとの生活情報を日本語でまとめたメディアです。
              </p>
            </div>

            {/* 特徴グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "🌏",
                  title: "国別に特化",
                  desc: "シンガポール、タイ、UAE…それぞれの国に特化した深い情報。広く浅いメディアとは一線を画します。",
                },
                {
                  emoji: "📋",
                  title: "実務に直結",
                  desc: "ビザの取り方、確定申告の仕方、保険の選び方。生活に直結する実務情報を分かりやすく。",
                },
                {
                  emoji: "🏡",
                  title: "在住者の視点",
                  desc: "観光ガイドではなく、実際にその国で暮らす人のための情報。現地の空気感が伝わるコンテンツを。",
                },
              ].map(({ emoji, title, desc }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-stone-800 rounded-2xl border-t border-r border-b border-stone-200 dark:border-stone-700 border-l-4 border-l-warm-500 p-8"
                >
                  <div className="text-2xl mb-4">{emoji}</div>
                  <h3 className="heading-editorial text-xl font-bold mb-3">
                    {title}
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 国別ガイド ===== */}
        <section id="countries" className="py-20 md:py-28 bg-white dark:bg-stone-950">
          <div className="max-w-6xl mx-auto px-4">
            <div className="mb-12">
              <p className="section-label mb-4">— COUNTRIES</p>
              <h2 className="heading-editorial text-4xl md:text-5xl font-bold">
                国別ガイド
              </h2>
            </div>
            {countriesByRegion.map((group, i) => (
              <div key={group.region} className={i < countriesByRegion.length - 1 ? "mb-16" : ""}>
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="text-warm-500 dark:text-warm-400" size={18} />
                  <h3 className="heading-editorial text-2xl font-bold">
                    {group.label}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.countries.map((c) => (
                    <CountryCard key={c.code} country={c} spotCount={spotCounts[c.code] ?? 0} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 数字で見る ===== */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-stone-950 to-[#1a2e35] text-white">
          <div className="max-w-6xl mx-auto px-4">
            <p className="section-label mb-6 text-teal-400">— IN NUMBERS</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                {
                  number: "129万人",
                  label: "海外在住日本人",
                },
                {
                  number: "34.8万人",
                  label: "アジア在住",
                },
                {
                  number: "年3-5%",
                  label: "増加率",
                },
                {
                  number: "12カ国+",
                  label: "カバー予定",
                },
              ].map(({ number, label }) => (
                <div key={label} className="text-center">
                  <p className="heading-editorial text-5xl md:text-6xl font-bold text-warm-400 leading-none mb-3">
                    {number}
                  </p>
                  <p className="text-stone-400 text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
