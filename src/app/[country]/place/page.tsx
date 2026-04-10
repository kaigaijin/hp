import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import placeSearch from "@/components/SpotSearch";
import placePickup from "@/components/SpotPickup";
import { getCountry, countries } from "@/lib/countries";
import {
  categories,
  categoryGroups,
  getCategoryCounts,
  getGroupCounts,
  getAllplaces,
  getAllAreas,
  getCategory,
} from "@/lib/directory";
import { getGroupTheme } from "@/lib/group-theme";
import CountryHero from "@/components/CountryHero";
import { getArticlesByCountry } from "@/lib/articles";
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
  ChevronRight,
  MapPin,
  Map,
  ArrowRight,
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
  Briefcase: (s) => <Calculator size={s} />,
  Compass: (s) => <Plane size={s} />,
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
      title: `${country.name}のKAIプレイス — 日本人向けスポット一覧`,
      description: `${country.name}で日本人に便利なレストラン・クリニック・美容室・不動産など、カテゴリ別に探せるKAIプレイス。`,
      openGraph: {
        title: `${country.name}のKAIプレイス | Kaigaijin`,
        description: `${country.name}で日本人に便利なスポットをカテゴリ別に探せるKAIプレイス。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/place`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function placeIndexPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const counts = getCategoryCounts(code);
  const groupCounts = getGroupCounts(code);
  const totalplaces = Object.values(counts).reduce((a, b) => a + b, 0);
  const articles = getArticlesByCountry(code);
  const areas = getAllAreas(code).slice(0, 12);

  const allplaces = getAllplaces(code);
  const searchableplaces = allplaces.map((place) => ({
    slug: place.slug,
    name: place.name,
    name_ja: place.name_ja,
    area: place.area,
    category: place.category,
    categoryName: getCategory(place.category)?.name ?? place.category,
    description: place.description,
    tags: place.tags,
  }));

  const pickupplaces = allplaces.map((s) => ({
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
      <main className="bg-sand-50 dark:bg-stone-950 min-h-screen">

        <CountryHero
          countryCode={code}
          countryName={country.name}
          countryFlag={country.flag}
          currentLabel="KAIプレイス"
          label="— KAI PLACE"
          title="日本人向けスポット"
          subtitle={`${country.name}のレストラン・クリニック・美容室・不動産など ${totalplaces}件掲載中`}
          articleCount={articles.length}
          placeCount={totalplaces}
          right={
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
              <p className="text-white/80 text-xs font-semibold mb-3">名前・エリア・キーワードで検索</p>
              <placeSearch places={searchableplaces} countryCode={code} />
            </div>
          }
          subTabs={
            <div className="flex gap-0 border-b border-white/10">
              <span className="text-sm font-semibold text-warm-400 border-b-2 border-warm-500 pb-2.5 px-4 -mb-px">
                カテゴリ
              </span>
              <Link href={`/${code}/place/area`} className="text-sm text-stone-400 hover:text-white pb-2.5 px-4 transition-colors">
                エリア
              </Link>
              <Link href={`/${code}/place/map`} className="text-sm text-stone-400 hover:text-white pb-2.5 px-4 transition-colors flex items-center gap-1.5">
                <Map size={13} />地図
              </Link>
            </div>
          }
        />

        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* カテゴリバナーグリッド */}
          <section>
            <p className="section-label mb-5">— カテゴリから探す</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryGroups.map((group) => {
                const groupCount = groupCounts[group.slug] ?? 0;
                const renderGroupIcon = iconMap[group.icon];
                const theme = getGroupTheme(group.slug);

                // 子カテゴリ名（最大4件）
                const childCategoryNames = group.categories
                  .map((slug) => categories.find((c) => c.slug === slug)?.name)
                  .filter(Boolean)
                  .slice(0, 4) as string[];

                return (
                  <Link key={group.slug} href={`/${code}/place/${group.slug}`}>
                    <div className={`group bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 hover:shadow-md ${theme.hoverBorder} transition-all overflow-hidden flex`}>
                      {/* 左: カラーアクセントバー */}
                      <div className={`w-1.5 shrink-0 ${theme.accentBar}`} />
                      {/* 中: テキスト */}
                      <div className="flex-1 p-5 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={theme.iconText}>
                            {renderGroupIcon?.(18)}
                          </span>
                          <h3 className={`text-base font-bold text-stone-800 dark:text-stone-100 ${theme.accentHover} transition-colors`}>
                            {group.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {childCategoryNames.map((name) => (
                            <span
                              key={name}
                              className="text-xs text-stone-400 bg-stone-50 dark:bg-stone-800 px-2 py-0.5 rounded-full"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* 右: 件数 + 矢印 */}
                      <div className="shrink-0 flex flex-col items-end justify-between p-5 pl-0">
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${theme.numberText} leading-none`}>
                            {groupCount}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">件</p>
                        </div>
                        <ArrowRight
                          size={14}
                          className={`${theme.iconText} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* エリアセクション */}
          {areas.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <p className="section-label">— エリアから探す</p>
                <Link
                  href={`/${code}/place/area`}
                  className="text-xs text-warm-600 dark:text-warm-400 hover:underline flex items-center gap-1"
                >
                  すべてのエリア
                  <ChevronRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/${code}/place/area/${area.slug}`}
                    className="group bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 hover:border-warm-400 dark:hover:border-warm-500 hover:shadow-md transition-all p-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-teal-500 dark:text-teal-400 shrink-0" />
                      <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 group-hover:text-warm-700 dark:group-hover:text-warm-400 transition-colors truncate">
                        {area.name}
                      </p>
                    </div>
                    <p className="text-xs text-stone-400 ml-[22px]">
                      {area.count}件
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ピックアップスポット */}
          <placePickup
            places={pickupplaces}
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
          <section className="mt-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              掲載されていない場所や情報の修正は
              <Link
                href="/contact"
                className="text-warm-600 dark:text-warm-400 hover:underline font-medium ml-1"
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
