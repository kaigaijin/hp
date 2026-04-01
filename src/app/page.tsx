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
        <section className="relative overflow-hidden bg-gradient-to-br from-warm-800 to-warm-600 text-white">

          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* 左: キャッチコピー + CTA */}
              <div>
                <p className="text-warm-200 text-xs font-semibold tracking-widest uppercase mb-4">
                  海外在住日本人のためのメディア
                </p>
                <h1 className="heading-editorial text-4xl md:text-5xl lg:text-5xl font-bold leading-tight mb-5">
                  その国で暮らす
                  <br />
                  <span className="text-warm-200">リアル</span>を、
                  <br />
                  深く届ける。
                </h1>
                <p className="text-warm-100 leading-relaxed mb-8 max-w-md">
                  ビザ、税金、保険、住居、医療——国ごとに異なる「暮らしの実務」を、在住者の視点で丁寧に解説します。
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="#countries"
                    className="inline-flex items-center justify-center gap-2 bg-white text-warm-800 font-bold px-7 py-3.5 rounded-xl text-sm hover:bg-warm-50 transition-colors shadow-lg"
                  >
                    住んでいる国を選ぶ →
                  </a>
                  <a
                    href="/sg/spot"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium px-7 py-3.5 rounded-xl text-sm transition-colors"
                  >
                    🇸🇬 まずシンガポールを見る
                  </a>
                </div>
              </div>

              {/* 右: 国グリッド */}
              <div className="hidden lg:block">
                <p className="text-warm-200 text-xs font-medium mb-3 tracking-wider uppercase">対応国 — {countries.length}カ国</p>
                <div className="grid grid-cols-2 gap-2">
                  {countries.map((c) => (
                    <a
                      key={c.code}
                      href={`/${c.code}`}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/12 border border-white/10 hover:border-white/30 px-4 py-3 rounded-xl text-sm transition-all group"
                    >
                      <span className="text-2xl">{c.flag}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-white group-hover:text-amber-300 transition-colors">{c.name}</p>
                        <p className="text-xs text-warm-200 truncate">{c.population}</p>
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
                  <div className="w-12 h-12 bg-warm-50 dark:bg-warm-900/30 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="text-warm-600 dark:text-warm-400" size={24} />
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
                  <Globe className="text-warm-600 dark:text-warm-400" size={20} />
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
                    className="mx-auto text-warm-400 mb-3"
                    size={28}
                  />
                  <p className="heading-editorial text-3xl md:text-4xl font-bold text-warm-800 dark:text-warm-300">
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
