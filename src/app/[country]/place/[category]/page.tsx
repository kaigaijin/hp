import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  categories,
  categoryGroups,
  getCategory,
  getCategoryGroup,
  getplacesByCategory,
  getCategoryCounts,
} from "@/lib/directory";
import PlaceGroupList from "@/components/SpotGroupList";
import PlaceCategoryList from "@/components/SpotCategoryList";
import { getGroupTheme, getCategoryTheme, type GroupTheme } from "@/lib/group-theme";
import { rankPlaces, parseProfile } from "@/lib/rank-places";
import {
  UtensilsCrossed,
  Coffee,
  Beer,
  Stethoscope,
  SmilePlus,
  Pill,
  Scissors,
  Sparkles,
  Dumbbell,
  Building2,
  ShoppingCart,
  GraduationCap,
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
  Briefcase,
  Compass,
  ChevronRight,
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

// CookieベースのパーソナライズのためSSR（force-dynamic）
export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; category: string }>;
}) {
  return params.then(({ country: code, category: slug }) => {
    const country = getCountry(code);
    if (!country) return {};

    // グループの場合
    const group = getCategoryGroup(slug);
    if (group) {
      return {
        title: `${country.name}の${group.name}`,
        description: `${country.name}で日本人におすすめの${group.name}をカテゴリ別に探せるKAIプレイス。`,
        openGraph: {
          title: `${country.name}の${group.name} | KAIプレイス`,
          description: `${country.name}の${group.name}をカテゴリ別に探せるKAIプレイス。`,
          type: "website",
          locale: "ja_JP",
          url: `https://kaigaijin.jp/${code}/place/${slug}`,
          siteName: "Kaigaijin",
        },
      };
    }

    // カテゴリの場合
    const category = getCategory(slug);
    if (!category) return {};
    const desc = `${country.name}の${category.name}を一覧で紹介。${category.description}住所・電話番号・営業時間など詳細情報つき。`;
    return {
      title: `${country.name}の${category.name}【日本人向け】`,
      description: desc,
      openGraph: {
        title: `${country.name}の${category.name}【日本人向け】 | Kaigaijin`,
        description: desc,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/place/${slug}`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ country: string; category: string }>;
}) {
  const { country: code, category: slug } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  // Cookieからユーザープロファイルを取得（パーソナライズ用）
  const cookieStore = await cookies();
  const profileRaw = cookieStore.get("place-profile")?.value;
  const profile = parseProfile(profileRaw);

  // グループスラッグの場合 → サブカテゴリ一覧を表示
  const group = getCategoryGroup(slug);
  if (group) {
    const counts = getCategoryCounts(code);
    const groupTotal = group.categories.reduce(
      (sum, cat) => sum + (counts[cat] ?? 0),
      0,
    );
    const childCategories = group.categories
      .map((catSlug) => {
        const cat = categories.find((c) => c.slug === catSlug);
        if (!cat) return null;
        return { ...cat, count: counts[cat.slug] ?? 0 };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // 全子カテゴリのスポットを集約
    const rawGroupplaces = group.categories.flatMap((catSlug) => {
      const cat = categories.find((c) => c.slug === catSlug);
      return getplacesByCategory(code, catSlug).map((place) => ({
        slug: place.slug,
        name: place.name,
        name_ja: place.name_ja,
        area: place.area,
        description: place.description,
        tags: place.tags,
        phone: place.phone,
        website: place.website,
        status: place.status,
        categorySlug: catSlug,
        categoryName: cat?.name ?? catSlug,
        images: (place as Record<string, unknown>).images as string[] | undefined,
      }));
    });

    // パーソナライズソート
    const groupplaces = rankPlaces(rawGroupplaces, profile);

    const subCategories = childCategories
      .filter((c) => c.count > 0)
      .map((c) => ({ slug: c.slug, name: c.name, count: c.count }));

    const renderGroupIcon = iconMap[group.icon];
    const theme = getGroupTheme(group.slug);

    return (
      <>
        <Header />
        <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
          <div className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e]">
            <div className="max-w-6xl mx-auto px-4 pt-4 pb-8">
              <nav className="flex items-center gap-1.5 text-xs text-stone-400/80 mb-6">
                <Link href="/" className="hover:text-white transition-colors">
                  トップ
                </Link>
                <ChevronRight size={12} />
                <Link
                  href={`/${code}/column`}
                  className="hover:text-white transition-colors"
                >
                  {country.flag} {country.name}
                </Link>
                <ChevronRight size={12} />
                <Link
                  href={`/${code}/place`}
                  className="hover:text-white transition-colors"
                >
                  KAIプレイス
                </Link>
                <ChevronRight size={12} />
                <span className="text-white/90">
                  {group.name}
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-warm-400">
                  {renderGroupIcon?.(20)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {country.name}の{group.name}
                  </h1>
                  <p className="text-sm text-stone-400 mt-0.5">
                    {groupTotal}件を掲載中
                  </p>
                </div>
              </div>
            </div>

            {/* 中分類フィルター + スポット一覧（クライアントコンポーネント） */}
            <PlaceGroupList
              places={groupplaces}
              subCategories={subCategories}
              countryCode={code}
              theme={{
                filterActive: theme.filterActive,
                hoverBorder: theme.hoverBorder,
                numberText: theme.numberText,
                accentHover: theme.accentHover,
                badgeBg: theme.badgeBg,
                badgeText: theme.badgeText,
              }}
            />
          </div>

          {/* フッター */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link
                href={`/${code}/place`}
                className={`text-sm ${theme.accent} hover:underline`}
              >
                ← カテゴリ一覧
              </Link>
              <Link
                href="/contact"
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                情報の修正・掲載リクエスト
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // カテゴリスラッグの場合 → 従来のスポット一覧
  const category = getCategory(slug);
  if (!category) notFound();

  const catSlug = slug;
  const rawPlaces = getplacesByCategory(code, catSlug);
  // パーソナライズソート（Cookieは上で取得済み）
  const places = rankPlaces(
    rawPlaces.map((p) => ({ ...p, categorySlug: catSlug })),
    profile,
  );
  const areas = [...new Set(places.map((s) => s.area))].sort();
  const catTheme = getCategoryTheme(catSlug);

  // このカテゴリが属するグループを取得（パンくず用）
  const parentGroup = categoryGroups.find((g) =>
    g.categories.includes(catSlug),
  );

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        {/* ダークアースヒーロー */}
        <div className="bg-gradient-to-br from-stone-950 via-[#1a2e35] to-[#2d1a0e]">
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-8">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400/80 mb-6">
              <Link
                href="/"
                className="hover:text-white transition-colors"
              >
                トップ
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/column`}
                className="hover:text-white transition-colors"
              >
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link
                href={`/${code}/place`}
                className="hover:text-white transition-colors"
              >
                KAIプレイス
              </Link>
              {parentGroup && (
                <>
                  <ChevronRight size={12} />
                  <Link
                    href={`/${code}/place/${parentGroup.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {parentGroup.name}
                  </Link>
                </>
              )}
              <ChevronRight size={12} />
              <span className="text-white/90">
                {category.name}
              </span>
            </nav>
            <h1 className="text-2xl font-bold text-white">
              {country.name}の{category.name}
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              {places.length > 0
                ? `${places.length}件を掲載中`
                : "情報を準備中です"}
            </p>
          </div>

          {/* エリアタブ */}
          {areas.length > 1 && (
            <div className="max-w-6xl mx-auto px-4 border-t border-white/10">
              <div className="flex gap-1 overflow-x-auto overflow-y-hidden py-2 scrollbar-hide touch-pan-x">
                <span className="shrink-0 text-xs font-medium text-warm-400 bg-warm-900/30 px-3 py-1.5 rounded-full">
                  すべて（{places.length}）
                </span>
                {areas.map((area) => (
                  <span
                    key={area}
                    className="shrink-0 text-xs text-stone-400 bg-white/10 px-3 py-1.5 rounded-full"
                  >
                    {area}（{places.filter((s) => s.area === area).length}）
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* スポットリスト */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {places.length > 0 ? (
            <PlaceCategoryList
              places={places}
              countryCode={code}
              categorySlug={catSlug}
              catTheme={catTheme}
            />
          ) : (
            <div className="text-center py-20 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                {country.name}の{category.name}情報を順次追加しています。
              </p>
              <Link
                href={`/${code}/place`}
                className={`text-sm ${catTheme.accent} hover:underline`}
              >
                ← カテゴリ一覧に戻る
              </Link>
            </div>
          )}

          {/* フッター */}
          <div className="mt-8 flex items-center justify-between">
            <Link
              href={parentGroup ? `/${code}/place/${parentGroup.slug}` : `/${code}/place`}
              className={`text-sm ${catTheme.accent} hover:underline`}
            >
              ← {parentGroup ? parentGroup.name : "カテゴリ一覧"}
            </Link>
            <Link
              href="/contact"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              情報の修正・掲載リクエスト
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
