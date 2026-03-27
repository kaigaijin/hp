import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import {
  categories,
  categoryGroups,
  getCategory,
  getCategoryGroup,
  getSpotsByCategory,
  getCategoryCounts,
} from "@/lib/directory";
import SpotGroupList from "@/components/SpotGroupList";
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
  MapPin,
  Phone,
  Globe,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
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
  const categoryParams = countries.flatMap((c) =>
    categories.map((cat) => ({ country: c.code, category: cat.slug })),
  );
  const groupParams = countries.flatMap((c) =>
    categoryGroups.map((g) => ({ country: c.code, category: g.slug })),
  );
  return [...categoryParams, ...groupParams];
}

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
        description: `${country.name}で日本人におすすめの${group.name}をカテゴリ別に探せるKAIスポット。`,
        openGraph: {
          title: `${country.name}の${group.name} | KAIスポット`,
          description: `${country.name}の${group.name}をカテゴリ別に探せるKAIスポット。`,
          type: "website",
          locale: "ja_JP",
          url: `https://kaigaijin.jp/${code}/spot/${slug}`,
          siteName: "Kaigaijin",
        },
      };
    }

    // カテゴリの場合
    const category = getCategory(slug);
    if (!category) return {};
    return {
      title: `${country.name}の${category.name}`,
      description: `${country.name}で日本人におすすめの${category.name}を一覧で紹介。住所・電話番号・営業時間など詳細情報つき。`,
      openGraph: {
        title: `${country.name}の${category.name} | Kaigaijin`,
        description: `${country.name}の${category.name}を探すなら。日本語対応の場所を中心にご紹介。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/spot/${slug}`,
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
    const groupSpots = group.categories.flatMap((catSlug) => {
      const cat = categories.find((c) => c.slug === catSlug);
      return getSpotsByCategory(code, catSlug).map((spot) => ({
        slug: spot.slug,
        name: spot.name,
        name_ja: spot.name_ja,
        area: spot.area,
        description: spot.description,
        tags: spot.tags,
        phone: spot.phone,
        website: spot.website,
        status: spot.status,
        categorySlug: catSlug,
        categoryName: cat?.name ?? catSlug,
      }));
    });

    const subCategories = childCategories
      .filter((c) => c.count > 0)
      .map((c) => ({ slug: c.slug, name: c.name, count: c.count }));

    const renderGroupIcon = iconMap[group.icon];

    return (
      <>
        <Header />
        <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
          <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
            <div className="max-w-6xl mx-auto px-4 py-5">
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
                <Link
                  href={`/${code}/spot`}
                  className="hover:text-ocean-600 transition-colors"
                >
                  KAIスポット
                </Link>
                <ChevronRight size={12} />
                <span className="text-stone-600 dark:text-stone-300">
                  {group.name}
                </span>
              </nav>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-50 dark:bg-stone-700 rounded-xl flex items-center justify-center text-ocean-600 dark:text-ocean-400">
                  {renderGroupIcon?.(20)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">
                    {country.name}の{group.name}
                  </h1>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    {groupTotal}件を掲載中
                  </p>
                </div>
              </div>
            </div>

            {/* 中分類フィルター + スポット一覧（クライアントコンポーネント） */}
            <SpotGroupList
              spots={groupSpots}
              subCategories={subCategories}
              countryCode={code}
            />
          </div>

          {/* フッター */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link
                href={`/${code}/spot`}
                className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                ← カテゴリ一覧
              </Link>
              <Link
                href="/contact"
                className="text-xs text-stone-400 hover:text-ocean-600 transition-colors"
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
  const spots = getSpotsByCategory(code, catSlug);
  const areas = [...new Set(spots.map((s) => s.area))].sort();

  // このカテゴリが属するグループを取得（パンくず用）
  const parentGroup = categoryGroups.find((g) =>
    g.categories.includes(catSlug),
  );

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        {/* コンパクトヘッダー */}
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
              <Link
                href="/"
                className="hover:text-ocean-600 transition-colors"
              >
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
              <Link
                href={`/${code}/spot`}
                className="hover:text-ocean-600 transition-colors"
              >
                KAIスポット
              </Link>
              {parentGroup && (
                <>
                  <ChevronRight size={12} />
                  <Link
                    href={`/${code}/spot/${parentGroup.slug}`}
                    className="hover:text-ocean-600 transition-colors"
                  >
                    {parentGroup.name}
                  </Link>
                </>
              )}
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">
                {category.name}
              </span>
            </nav>
            <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">
              {country.name}の{category.name}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {spots.length > 0
                ? `${spots.length}件を掲載中`
                : "情報を準備中です"}
            </p>
          </div>

          {/* エリアタブ */}
          {areas.length > 1 && (
            <div className="max-w-6xl mx-auto px-4 border-t border-stone-100 dark:border-stone-700">
              <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
                <span className="shrink-0 text-xs font-medium text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-ocean-900/30 px-3 py-1.5 rounded-full">
                  すべて（{spots.length}）
                </span>
                {areas.map((area) => (
                  <span
                    key={area}
                    className="shrink-0 text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-3 py-1.5 rounded-full"
                  >
                    {area}（{spots.filter((s) => s.area === area).length}）
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* スポットリスト */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {spots.length > 0 ? (
            <div className="space-y-3">
              {spots.map((spot, i) => (
                <Link
                  key={spot.slug}
                  href={`/${code}/spot/${catSlug}/${spot.slug}`}
                  className="group block"
                >
                  <article className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-md transition-all">
                    <div className="p-4 sm:p-5">
                      {/* 上段: 店名 + エリア */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-ocean-600 dark:text-ocean-400">
                              {i + 1}
                            </span>
                            <h2 className="text-base font-bold text-stone-800 dark:text-stone-100 truncate group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                              {spot.name_ja ?? spot.name}
                            </h2>
                          </div>
                          {spot.name_ja && (
                            <p className="text-xs text-stone-400 mt-0.5 ml-5">
                              {spot.name}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded">
                          <MapPin size={10} />
                          {spot.area}
                        </span>
                      </div>

                      {/* 説明文 */}
                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-3 ml-5 line-clamp-2">
                        {spot.description}
                      </p>

                      {/* 下段: タグ + 連絡先 */}
                      <div className="flex items-center justify-between gap-4 ml-5">
                        {/* タグ */}
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                          {spot.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-700 px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* ステータス + 連絡先 */}
                        <div className="flex items-center gap-3 shrink-0">
                          {spot.status === "reported_closed" && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle size={10} />
                              閉店の可能性
                            </span>
                          )}
                          {(!spot.status || spot.status === "unverified") && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-amber-500">
                              <Info size={10} />
                              未確認
                            </span>
                          )}
                          {spot.status === "verified" && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-green-500">
                              <CheckCircle2 size={10} />
                              確認済み
                            </span>
                          )}
                          {spot.phone && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-stone-400">
                              <Phone size={10} />
                              {spot.phone}
                            </span>
                          )}
                          {spot.website && (
                            <span className="flex items-center gap-1 text-xs text-ocean-500">
                              <Globe size={10} />
                              Web
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                {country.name}の{category.name}情報を順次追加しています。
              </p>
              <Link
                href={`/${code}/spot`}
                className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
              >
                ← カテゴリ一覧に戻る
              </Link>
            </div>
          )}

          {/* フッター */}
          <div className="mt-8 flex items-center justify-between">
            <Link
              href={parentGroup ? `/${code}/spot/${parentGroup.slug}` : `/${code}/spot`}
              className="text-sm text-ocean-600 dark:text-ocean-400 hover:underline"
            >
              ← {parentGroup ? parentGroup.name : "カテゴリ一覧"}
            </Link>
            <Link
              href="/contact"
              className="text-xs text-stone-400 hover:text-ocean-600 transition-colors"
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
