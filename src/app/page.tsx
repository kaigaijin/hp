import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CountryCard from "@/components/CountryCard";
import { countries, regionOrder, regionLabels } from "@/lib/countries";
import { getCategoryCounts } from "@/lib/directory";
import {
  Globe,
  BookOpen,
  Shield,
  TrendingUp,
  MapPin,
  Plane,
} from "lucide-react";

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
        <section className="relative overflow-hidden bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 text-white">
          {/* 背景の装飾 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 text-8xl">🌏</div>
            <div className="absolute top-40 right-20 text-6xl">✈️</div>
            <div className="absolute bottom-20 left-1/3 text-7xl">🏠</div>
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36">
            <div className="max-w-2xl">
              <p className="text-ocean-300 text-sm font-medium tracking-widest uppercase mb-4">
                海外在住日本人のためのメディア
              </p>
              <h1 className="heading-editorial text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                その国で暮らす
                <br />
                <span className="text-ocean-300">リアル</span>を、
                <br />
                深く届ける。
              </h1>
              <p className="text-lg text-ocean-200 leading-relaxed mb-10 max-w-lg">
                ビザ、税金、保険、住居、医療——
                <br />
                国ごとに異なる「暮らしの実務」を、
                <br />
                在住者の視点で丁寧に解説します。
              </p>

              {/* メインCTA */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <a
                  href="#countries"
                  className="inline-flex items-center justify-center gap-2 bg-white text-ocean-800 font-bold px-8 py-4 rounded-xl text-base hover:bg-ocean-50 transition-colors shadow-lg"
                >
                  <span>住んでいる国を選ぶ</span>
                  <span>→</span>
                </a>
                <a
                  href="/sg/spot"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium px-8 py-4 rounded-xl text-base transition-colors"
                >
                  🇸🇬 まずシンガポールを見る
                </a>
              </div>

              {/* 国フラグ一覧 */}
              <div className="flex flex-wrap gap-2">
                {countries.filter((c) => c.phase === 1).map((c) => (
                  <a
                    key={c.code}
                    href={`/${c.code}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm transition-colors"
                  >
                    <span>{c.flag}</span>
                    {c.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 波形の区切り */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 40C360 80 720 0 1080 40C1260 60 1380 60 1440 40V80H0V40Z"
                className="fill-stone-50 dark:fill-stone-900"
              />
            </svg>
          </div>
        </section>

        {/* ===== Kaigaijinとは ===== */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="heading-editorial text-3xl md:text-4xl font-bold mb-6 line-accent mx-auto w-fit">
                国別に深い、だから役に立つ
              </h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed mt-8">
                住居、医療、ビザ、税金、銀行——海外で暮らすと「日本語で読める実務情報」が足りないことに気づく。
                <br />
                Kaigaijinは、国ごとの生活情報を日本語でまとめたメディアです。
              </p>
            </div>

            {/* 特徴グリッド */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Globe,
                  title: "国別に特化",
                  desc: "シンガポール、タイ、UAE…それぞれの国に特化した深い情報。広く浅いメディアとは一線を画します。",
                },
                {
                  icon: BookOpen,
                  title: "実務に直結",
                  desc: "ビザの取り方、確定申告の仕方、保険の選び方。生活に直結する実務情報を分かりやすく。",
                },
                {
                  icon: Shield,
                  title: "在住者の視点",
                  desc: "観光ガイドではなく、実際にその国で暮らす人のための情報。現地の空気感が伝わるコンテンツを。",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-8"
                >
                  <div className="w-12 h-12 bg-ocean-50 dark:bg-ocean-900/30 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="text-ocean-600 dark:text-ocean-400" size={24} />
                  </div>
                  <h3 className="heading-editorial text-lg font-bold mb-3">
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
        <section id="countries" className="py-20 md:py-28 bg-sand-50 dark:bg-stone-800/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="heading-editorial text-3xl md:text-4xl font-bold mb-12">
              国別ガイド
            </h2>
            {countriesByRegion.map((group, i) => (
              <div key={group.region} className={i < countriesByRegion.length - 1 ? "mb-16" : ""}>
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="text-ocean-600 dark:text-ocean-400" size={20} />
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
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="heading-editorial text-3xl md:text-4xl font-bold text-center mb-16">
              海外在住日本人のリアル
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  number: "129万人",
                  label: "海外在住日本人",
                  icon: Globe,
                },
                {
                  number: "34.8万人",
                  label: "アジア在住",
                  icon: MapPin,
                },
                {
                  number: "年3-5%",
                  label: "増加率",
                  icon: TrendingUp,
                },
                {
                  number: "12カ国+",
                  label: "カバー予定",
                  icon: Plane,
                },
              ].map(({ number, label, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon
                    className="mx-auto text-ocean-400 mb-3"
                    size={28}
                  />
                  <p className="heading-editorial text-3xl md:text-4xl font-bold text-ocean-800 dark:text-ocean-300">
                    {number}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{label}</p>
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
