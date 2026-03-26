import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { categories, getCategoryCounts, type Spot, getAllSpots } from "@/lib/directory";
import {
  UtensilsCrossed,
  Stethoscope,
  Scissors,
  Building2,
  ShoppingCart,
  GraduationCap,
  Coffee,
  Beer,
  SmilePlus,
  Pill,
  Sparkles,
  Dumbbell,
  Calculator,
  Scale,
  Shield,
  Truck,
  Plane,
  Laptop,
  PawPrint,
  Car,
  SprayCan,
  Wrench,
  MapPin,
  Search,
  ChevronRight,
  Phone,
  Globe,
} from "lucide-react";

const iconMap: Record<string, (size: number) => React.ReactNode> = {
  UtensilsCrossed: (s) => <UtensilsCrossed size={s} />,
  Coffee: (s) => <Coffee size={s} />,
  Beer: (s) => <Beer size={s} />,
  Stethoscope: (s) => <Stethoscope size={s} />,
  SmilePlus: (s) => <SmilePlus size={s} />,
  Pill: (s) => <Pill size={s} />,
  Scissors: (s) => <Scissors size={s} />,
  Sparkles: (s) => <Sparkles size={s} />,
  Dumbbell: (s) => <Dumbbell size={s} />,
  Building2: (s) => <Building2 size={s} />,
  ShoppingCart: (s) => <ShoppingCart size={s} />,
  GraduationCap: (s) => <GraduationCap size={s} />,
  Calculator: (s) => <Calculator size={s} />,
  Scale: (s) => <Scale size={s} />,
  Shield: (s) => <Shield size={s} />,
  Truck: (s) => <Truck size={s} />,
  Plane: (s) => <Plane size={s} />,
  Laptop: (s) => <Laptop size={s} />,
  PawPrint: (s) => <PawPrint size={s} />,
  Car: (s) => <Car size={s} />,
  SprayCan: (s) => <SprayCan size={s} />,
  Wrench: (s) => <Wrench size={s} />,
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
      title: `${country.name}の日本人向けスポット一覧`,
      description: `${country.name}で日本人に人気のレストラン・クリニック・美容室・不動産など、カテゴリ別に探せるスポットガイド。`,
      openGraph: {
        title: `${country.name}の日本人向けスポット一覧 | Kaigaijin`,
        description: `${country.name}で日本人に人気のスポットをカテゴリ別に探せます。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/spot`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function SpotIndexPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const counts = getCategoryCounts(code);
  const totalSpots = Object.values(counts).reduce((a, b) => a + b, 0);

  // スポットがあるカテゴリのみ表示、件数順
  const activeCategories = categories
    .filter((cat) => (counts[cat.slug] ?? 0) > 0)
    .sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0));

  // まだスポットがないカテゴリ
  const emptyCategories = categories.filter(
    (cat) => (counts[cat.slug] ?? 0) === 0,
  );

  // 最近追加されたスポット（各カテゴリから最大1件）
  const allSpots = getAllSpots(code);
  const recentSpots = allSpots.slice(0, 6);

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        {/* コンパクトヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
              <Link href="/" className="hover:text-ocean-600 transition-colors">
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}`}
                className="hover:text-ocean-600 transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">スポット</span>
            </nav>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                  {country.flag} {country.name}のスポット
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {totalSpots}件のスポットを{activeCategories.length}
                  カテゴリで掲載中
                </p>
              </div>
              <Link
                href="/contact"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ocean-600 dark:text-ocean-400 hover:underline border border-ocean-200 dark:border-ocean-800 rounded-lg px-3 py-1.5"
              >
                掲載リクエスト
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* カテゴリグリッド */}
          <section>
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
              カテゴリから探す
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeCategories.map((cat) => {
                const count = counts[cat.slug] ?? 0;
                const renderIcon = iconMap[cat.icon];
                return (
                  <Link
                    key={cat.slug}
                    href={`/${code}/spot/${cat.slug}`}
                    className="group bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-stone-50 dark:bg-stone-700 rounded-lg flex items-center justify-center text-ocean-600 dark:text-ocean-400 group-hover:bg-ocean-50 dark:group-hover:bg-ocean-900/30 transition-colors">
                        {renderIcon?.(20)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                          {cat.name}
                        </p>
                        <p className="text-xs text-stone-400">{count}件</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* まだスポットがないカテゴリ */}
            {emptyCategories.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {emptyCategories.map((cat) => (
                    <span
                      key={cat.slug}
                      className="text-xs text-stone-400 dark:text-stone-500 bg-stone-200/50 dark:bg-stone-800 rounded-full px-3 py-1"
                    >
                      {cat.name}（準備中）
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ピックアップスポット */}
          {recentSpots.length > 0 && (
            <section className="mt-10">
              <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
                ピックアップ
              </h2>
              <div className="space-y-2">
                {recentSpots.map((spot) => (
                  <Link
                    key={`${spot.category}-${spot.slug}`}
                    href={`/${code}/spot/${spot.category}/${spot.slug}`}
                    className="group flex items-center gap-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-3 hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 truncate group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                          {spot.name_ja ?? spot.name}
                        </p>
                        {spot.name_ja && (
                          <span className="text-xs text-stone-400 hidden sm:inline truncate">
                            {spot.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                          <MapPin size={10} />
                          {spot.area}
                        </span>
                        <span className="text-xs text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 px-1.5 py-0.5 rounded">
                          {categories.find((c) => c.slug === spot.category)
                            ?.name ?? spot.category}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-stone-300 dark:text-stone-600 group-hover:text-ocean-500 shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* フッターCTA */}
          <section className="mt-10 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              掲載されていないスポットや情報の修正は
              <Link
                href="/contact"
                className="text-ocean-600 dark:text-ocean-400 hover:underline font-medium ml-1"
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
