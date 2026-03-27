import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpotSearch from "@/components/SpotSearch";
import SpotPickup from "@/components/SpotPickup";
import { getCountry, countries } from "@/lib/countries";
import {
  categories,
  categoryGroups,
  getCategoryCounts,
  getGroupCounts,
  getAllSpots,
  getCategory,
} from "@/lib/directory";
import { getGroupTheme } from "@/lib/group-theme";
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
      title: `${country.name}のKAIスポット — 日本人向けスポット一覧`,
      description: `${country.name}で日本人に便利なレストラン・クリニック・美容室・不動産など、カテゴリ別に探せるKAIスポット。`,
      openGraph: {
        title: `${country.name}のKAIスポット | Kaigaijin`,
        description: `${country.name}で日本人に便利なスポットをカテゴリ別に探せるKAIスポット。`,
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

  // ピックアップ用データ（クライアントコンポーネントでランダム表示）
  const pickupSpots = allSpots.map((s) => ({
    slug: s.slug,
    name: s.name,
    name_ja: s.name_ja,
    area: s.area,
    category: s.category,
    categoryName: getCategory(s.category)?.name ?? s.category,
    tags: s.tags,
    group: categoryGroups.find((g) => g.categories.includes(s.category))?.slug ?? "",
  }));

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
              <span className="text-stone-600 dark:text-stone-300">KAIスポット</span>
            </nav>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                  {country.flag} {country.name}のKAIスポット
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {totalSpots}件を掲載中
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryGroups.map((group) => {
                const groupCount = groupCounts[group.slug] ?? 0;
                const renderGroupIcon = iconMap[group.icon];
                const theme = getGroupTheme(group.slug);

                return (
                  <Link
                    key={group.slug}
                    href={`/${code}/spot/${group.slug}`}
                    className={`group bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 border-t-2 ${theme.topBorder} p-4 ${theme.hoverBorder} hover:shadow-md transition-all text-center`}
                  >
                    <div className={`w-12 h-12 mx-auto ${theme.iconBg} rounded-xl flex items-center justify-center ${theme.iconText} ${theme.iconBgActive} transition-colors mb-3`}>
                      {renderGroupIcon?.(22)}
                    </div>
                    <p className={`text-sm font-semibold text-stone-700 dark:text-stone-200 ${theme.accentHover} transition-colors`}>
                      {group.name}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      {groupCount}件
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ピックアップスポット（クライアントサイドでランダム表示） */}
          <SpotPickup
            spots={pickupSpots}
            countryCode={code}
            groups={categoryGroups.map((g) => g.slug)}
            groupThemes={Object.fromEntries(
              categoryGroups.map((g) => {
                const t = getGroupTheme(g.slug);
                return [g.slug, { badgeBg: t.badgeBg, badgeText: t.badgeText, hoverBorder: t.hoverBorder, accentHover: t.accentHover }];
              }),
            )}
          />

          {/* フッターCTA */}
          <section className="mt-10 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              掲載されていない場所や情報の修正は
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
