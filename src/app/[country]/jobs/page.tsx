import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  JOB_INDUSTRIES,
  getIndustryCounts,
  getAllJobs,
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
  ArrowRight,
  BriefcaseBusiness,
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

  const counts = getIndustryCounts(code);
  const totalJobs = Object.values(counts).reduce((a, b) => a + b, 0);

  // 求人がある業種だけ上位に表示
  const industriesWithJobs = JOB_INDUSTRIES.filter(
    (ind) => (counts[ind.slug] ?? 0) > 0,
  );
  const industriesEmpty = JOB_INDUSTRIES.filter(
    (ind) => (counts[ind.slug] ?? 0) === 0,
  );

  return (
    <>
      <Header />
      <main className="bg-sand-50 dark:bg-stone-950 min-h-screen">
        {/* ヒーローヘッダー */}
        <div className="bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* パンくず */}
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-4">
              <Link href="/" className="hover:text-warm-600 transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}`}
                className="hover:text-warm-600 transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">求人情報</span>
            </nav>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <BriefcaseBusiness size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="heading-editorial text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
                  {country.flag} {country.name}の求人情報
                </h1>
                <p className="text-sm text-stone-400 dark:text-stone-500 mt-0.5">
                  {totalJobs > 0 ? `${totalJobs}件掲載中` : "求人情報を順次追加しています"}
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 max-w-2xl">
              {country.name}で働く日本人向けの求人情報を業種別にまとめています。日系企業・日本語対応職場の求人を掲載しています。
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 求人がある業種 */}
          {industriesWithJobs.length > 0 && (
            <section>
              <p className="section-label mb-5">— 業種から探す</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {industriesWithJobs.map((ind) => {
                  const count = counts[ind.slug] ?? 0;
                  const renderIcon = iconMap[ind.icon];
                  return (
                    <Link key={ind.slug} href={`/${code}/jobs/${ind.slug}`}>
                      <div className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all overflow-hidden flex">
                        {/* カラーアクセントバー */}
                        <div className="w-1.5 shrink-0 bg-blue-400 dark:bg-blue-600" />
                        {/* テキスト */}
                        <div className="flex-1 p-5 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-blue-600 dark:text-blue-400">
                              {renderIcon?.(18)}
                            </span>
                            <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {ind.label}
                            </h2>
                          </div>
                          <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
                            {ind.description}
                          </p>
                        </div>
                        {/* 件数 + 矢印 */}
                        <div className="shrink-0 flex flex-col items-end justify-between p-5 pl-0">
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">
                              {count}
                            </p>
                            <p className="text-[10px] text-stone-400 mt-0.5">件</p>
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* 求人がない業種（グレーアウト表示） */}
          {industriesEmpty.length > 0 && (
            <section className="mt-8">
              <p className="section-label mb-5">— 求人情報を準備中</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {industriesEmpty.map((ind) => {
                  const renderIcon = iconMap[ind.icon];
                  return (
                    <div
                      key={ind.slug}
                      className="bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 p-4 opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-stone-400">{renderIcon?.(14)}</span>
                        <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">
                          {ind.label}
                        </p>
                      </div>
                      <p className="text-xs text-stone-400 ml-[22px]">準備中</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* フッターCTA */}
          <section className="mt-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              求人情報の掲載・修正は
              <Link
                href="/contact"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium ml-1"
              >
                こちら
              </Link>
              からお知らせください（無料）
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
