import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpotSearch from "@/components/SpotSearch";
import { getCountry, countries } from "@/lib/countries";
import {
  categories,
  categoryGroups,
  getCategoryCounts,
  getGroupCounts,
  getAllSpots,
  getCategory,
} from "@/lib/directory";
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
  Briefcase,
  Compass,
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
  Briefcase: (s) => <Briefcase size={s} />,
  Compass: (s) => <Compass size={s} />,
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
  const groupCounts = getGroupCounts(code);
  const totalSpots = Object.values(counts).reduce((a, b) => a + b, 0);

  // 全スポットデータを検索用に整形
  const allSpots = getAllSpots(code);
  const searchableSpots = allSpots.map((spot) => ({
    slug: spot.slug,
    name: spot.name,
    name_ja: spot.name_ja,
    area: spot.area,
    category: spot.category,
    categoryName: getCategory(spot.category)?.name ?? spot.category,
    description: spot.description,
    tags: spot.tags,
  }));

  // スポットがあるカテゴリのslugセット
  const activeCategorySlugs = new Set(
    categories
      .filter((cat) => (counts[cat.slug] ?? 0) > 0)
      .map((cat) => cat.slug)
  );

  // まだスポットがないカテゴリ
  const emptyCategories = categories.filter(
    (cat) => (counts[cat.slug] ?? 0) === 0
  );

  // ピックアップスポット（各グループから1件ずつ選んでバランスよく表示）
  const recentSpots: typeof allSpots = [];
  for (const group of categoryGroups) {
    const groupSpot = allSpots.find(
      (s) => group.categories.includes(s.category) && !recentSpots.some((r) => r.slug === s.slug)
    );
    if (groupSpot) recentSpots.push(groupSpot);
  }
  // 7グループ未満の場合は残りから補充
  if (recentSpots.length < 7) {
    for (const s of allSpots) {
      if (recentSpots.length >= 7) break;
      if (!recentSpots.some((r) => r.slug === s.slug)) recentSpots.push(s);
    }
  }

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
                  {totalSpots}件のスポットを掲載中
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
          {/* 検索窓 */}
          <div className="mb-6">
            <SpotSearch spots={searchableSpots} countryCode={code} />
          </div>

          {/* カテゴリグループグリッド */}
          <section>
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
              カテゴリから探す
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryGroups.map((group) => {
                const groupCount = groupCounts[group.slug] ?? 0;
                const renderGroupIcon = iconMap[group.icon];
                const childCategories = group.categories
                  .map((slug) => {
                    const cat = categories.find((c) => c.slug === slug);
                    if (!cat) return null;
                    return { ...cat, count: counts[cat.slug] ?? 0 };
                  })
                  .filter(
                    (c): c is NonNullable<typeof c> => c !== null
                  );

                return (
                  <div
                    key={group.slug}
                    className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden"
                  >
                    {/* グループヘッダー */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 dark:border-stone-700">
                      <div className="w-9 h-9 bg-stone-50 dark:bg-stone-700 rounded-lg flex items-center justify-center text-ocean-600 dark:text-ocean-400">
                        {renderGroupIcon?.(18)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                          {group.name}
                        </p>
                        <p className="text-xs text-stone-400">
                          {groupCount}件
                        </p>
                      </div>
                    </div>

                    {/* 子カテゴリリスト */}
                    <div className="divide-y divide-stone-50 dark:divide-stone-700">
                      {childCategories.map((cat) => {
                        const hasSpots = activeCategorySlugs.has(cat.slug);
                        const renderCatIcon = iconMap[cat.icon];
                        if (hasSpots) {
                          return (
                            <Link
                              key={cat.slug}
                              href={`/${code}/spot/${cat.slug}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                            >
                              <span className="text-stone-400 dark:text-stone-500">
                                {renderCatIcon?.(14)}
                              </span>
                              <span className="flex-1 text-sm text-stone-600 dark:text-stone-300 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                                {cat.name}
                              </span>
                              <span className="text-xs text-stone-400 tabular-nums">
                                {cat.count}件
                              </span>
                              <ChevronRight
                                size={14}
                                className="text-stone-300 dark:text-stone-600"
                              />
                            </Link>
                          );
                        }
                        return (
                          <div
                            key={cat.slug}
                            className="flex items-center gap-3 px-4 py-2.5 opacity-50"
                          >
                            <span className="text-stone-400 dark:text-stone-500">
                              {renderCatIcon?.(14)}
                            </span>
                            <span className="flex-1 text-sm text-stone-400 dark:text-stone-500">
                              {cat.name}
                            </span>
                            <span className="text-xs text-stone-300 dark:text-stone-600">
                              準備中
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* まだスポットがないカテゴリ（グループに属さないもの） */}
            {emptyCategories.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {emptyCategories
                    .filter(
                      (cat) =>
                        !categoryGroups.some((g) =>
                          g.categories.includes(cat.slug)
                        )
                    )
                    .map((cat) => (
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
