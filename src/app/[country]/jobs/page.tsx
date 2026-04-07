import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  JOB_INDUSTRIES,
  getIndustryCounts,
} from "@/lib/jobs";
import {
  UtensilsCrossed,
  ShoppingBag,
  Laptop,
  GraduationCap,
  Hotel,
  Scissors,
  Stethoscope,
  Calculator,
  Briefcase,
  MoreHorizontal,
  ChevronRight,
  BriefcaseBusiness,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const iconMap: Record<string, (size: number) => React.ReactNode> = {
  UtensilsCrossed: (s) => <UtensilsCrossed size={s} />,
  ShoppingBag: (s) => <ShoppingBag size={s} />,
  Laptop: (s) => <Laptop size={s} />,
  GraduationCap: (s) => <GraduationCap size={s} />,
  Hotel: (s) => <Hotel size={s} />,
  Scissors: (s) => <Scissors size={s} />,
  Stethoscope: (s) => <Stethoscope size={s} />,
  Calculator: (s) => <Calculator size={s} />,
  Briefcase: (s) => <Briefcase size={s} />,
  MoreHorizontal: (s) => <MoreHorizontal size={s} />,
};

export const revalidate = 60; // 60秒ISRキャッシュ

export function generateStaticParams() {
  return countries.map((c) => ({ country: c.code }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  return params.then(({ country: code }) => {
    const country = getCountry(code);
    if (!country) return {};
    return {
      title: `${country.name}の求人情報 — 日本人向け現地求人一覧`,
      description: `${country.name}で働く日本人向けの求人情報。飲食・IT・教育・美容など業種別に探せます。`,
      openGraph: {
        title: `${country.name}の求人情報 | Kaigaijin`,
        description: `${country.name}で働く日本人向けの求人情報。飲食・IT・教育・美容など業種別に探せます。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/jobs`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function JobsIndexPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const counts = await getIndustryCounts(code);
  const totalJobs = Object.values(counts).reduce((a, b) => a + b, 0);

  const industriesWithJobs = JOB_INDUSTRIES.filter(
    (ind) => (counts[ind.slug] ?? 0) > 0,
  );
  const industriesEmpty = JOB_INDUSTRIES.filter(
    (ind) => (counts[ind.slug] ?? 0) === 0,
  );

  return (
    <>
      <Header />
      <main className="bg-stone-50 dark:bg-stone-900 min-h-screen">

        {/* ─── ヒーローエリア ────────────────────────── */}
        <div className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e]">
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-12">
            {/* パンくず */}
            <nav className="flex items-center gap-1.5 text-xs text-stone-400/80 mb-8">
              <Link href="/" className="hover:text-white transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-white transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <span className="text-white/90">求人情報</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-4">
                  — KAI JOB
                </p>
                <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                  <BriefcaseBusiness size={13} />
                  {country.flag} {country.name} 求人情報
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                  海外で働こう。
                </h1>
                <p className="text-stone-300 text-base leading-relaxed max-w-lg">
                  {country.name}で働く日本人向けの求人を業種別に掲載。
                  日系企業・日本語対応職場の求人が見つかります。
                </p>
                {totalJobs > 0 && (
                  <p className="mt-4 text-stone-400 text-sm font-medium">
                    現在{" "}
                    <span className="text-white font-bold text-lg">{totalJobs}</span>{" "}
                    件掲載中
                  </p>
                )}
              </div>

              {/* 求人掲載CTAカード */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 min-w-[260px]">
                <p className="text-white font-bold text-base mb-1">
                  求人を無料で掲載する
                </p>
                <p className="text-stone-400 text-xs mb-4 leading-relaxed">
                  日本人向け求人を無料で掲載できます。
                  審査後、掲載をお知らせします。
                </p>
                <Link
                  href={`/${code}/jobs/new`}
                  className="block w-full text-center bg-warm-500 hover:bg-warm-600 text-white font-bold text-sm px-5 py-3 rounded-xl transition shadow-md"
                >
                  求人掲載フォームへ →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* ─── 求人がある業種グリッド ─────────────── */}
          {industriesWithJobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                  業種から探す
                </p>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {industriesWithJobs.map((ind) => {
                  const count = counts[ind.slug] ?? 0;
                  const renderIcon = iconMap[ind.icon];
                  return (
                    <Link key={ind.slug} href={`/${code}/jobs/${ind.slug}`}>
                      <div className="group bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-warm-300 dark:hover:border-warm-600 hover:shadow-md transition-all duration-200 p-5 flex flex-col items-center text-center gap-3 h-full hover:-translate-y-0.5">
                        <div className="w-12 h-12 bg-warm-50 dark:bg-stone-700 rounded-xl flex items-center justify-center text-warm-600 dark:text-warm-400 group-hover:bg-warm-100 dark:group-hover:bg-stone-600 transition-colors shrink-0">
                          {renderIcon?.(22)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-800 dark:text-stone-100 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors leading-snug mb-1">
                            {ind.label}
                          </p>
                          <p className="text-xs text-warm-600 dark:text-warm-400 font-semibold">
                            {count}件
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── 求人がない業種（準備中バッジ） ─────── */}
          {industriesEmpty.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-2 mb-5">
                <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                  準備中
                </p>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              </div>
              <div className="flex flex-wrap gap-2">
                {industriesEmpty.map((ind) => {
                  const renderIcon = iconMap[ind.icon];
                  return (
                    <div
                      key={ind.slug}
                      className="inline-flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-xs font-medium px-3 py-2 rounded-full"
                    >
                      <span className="opacity-60">{renderIcon?.(12)}</span>
                      {ind.label}
                      <span className="text-stone-300 dark:text-stone-600 text-[10px] ml-0.5">
                        準備中
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── 求人掲載CTAバナー ───────────────────── */}
          <section className="mt-14">
            <div className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <Sparkles size={16} className="text-stone-400" />
                  <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
                    採用担当者の方へ
                  </p>
                </div>
                <p className="text-white text-xl font-extrabold mb-2">
                  {country.name}の求人を無料で掲載できます
                </p>
                <ul className="space-y-1">
                  {[
                    "掲載料 完全無料",
                    "日本人・日本語対応求人を専門掲載",
                    "フォームから3ステップで投稿完了",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-stone-300 text-sm"
                    >
                      <CheckCircle size={14} className="text-warm-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href={`/${code}/jobs/new`}
                className="shrink-0 inline-flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-sm whitespace-nowrap"
              >
                求人を無料掲載する
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
