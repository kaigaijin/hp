import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpotGroupList from "@/components/SpotGroupList";
import { getCountry, countries } from "@/lib/countries";
import {
  getAllAreas,
  getAreaNameBySlug,
  getSpotsByArea,
  getCategory,
  categoryGroups,
  categories,
} from "@/lib/directory";
import { getCategoryTheme } from "@/lib/group-theme";
import { ChevronRight, MapPin } from "lucide-react";

export const dynamicParams = true;

export function generateStaticParams() {
  // SG のエリアのみ静的生成（他の国はオンデマンド）
  const sgAreas = getAllAreas("sg");
  return sgAreas.map((a) => ({ country: "sg", area: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; area: string }>;
}) {
  return params.then(({ country: code, area: areaSlug }) => {
    const country = getCountry(code);
    const areaName = getAreaNameBySlug(code, areaSlug);
    if (!country || !areaName) return {};
    return {
      title: `${areaName}エリアのスポット — ${country.name} KAIスポット`,
      description: `${country.name}・${areaName}エリアの日本人向けスポット一覧。レストラン、クリニック、美容室など。`,
      openGraph: {
        title: `${areaName} — ${country.name} KAIスポット | Kaigaijin`,
        description: `${country.name}・${areaName}エリアの日本人向けスポット一覧。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/spot/area/${areaSlug}`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ country: string; area: string }>;
}) {
  const { country: code, area: areaSlug } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const areaName = getAreaNameBySlug(code, areaSlug);
  if (!areaName) notFound();

  const spots = getSpotsByArea(code, areaName);
  if (spots.length === 0) notFound();

  // SpotGroupList用に変換
  const spotItems = spots.map((s) => ({
    slug: s.slug,
    name: s.name,
    name_ja: s.name_ja,
    area: s.area,
    description: s.description,
    tags: s.tags,
    phone: s.phone,
    website: s.website,
    status: s.status,
    categorySlug: s.category,
    categoryName: getCategory(s.category)?.name ?? s.category,
    images: (s as Record<string, unknown>).images as string[] | undefined,
  }));

  // サブカテゴリ（カテゴリフィルタ用）
  const catCounts: Record<string, number> = {};
  for (const s of spots) {
    catCounts[s.category] = (catCounts[s.category] ?? 0) + 1;
  }
  const subCategories = Object.entries(catCounts)
    .map(([slug, count]) => ({
      slug,
      name: getCategory(slug)?.name ?? slug,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // テーマ（一番スポットが多いカテゴリのグループテーマ）
  const topCategory = subCategories[0]?.slug;
  const theme = topCategory ? getCategoryTheme(topCategory) : undefined;

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        <div className={`bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 ${theme ? `border-t-2 ${theme.topBorder}` : ""}`}>
          <div className="max-w-6xl mx-auto px-4 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
              <Link href="/" className="hover:text-ocean-600 transition-colors">トップ</Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-ocean-600 transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/spot`} className="hover:text-ocean-600 transition-colors">KAIスポット</Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/spot/area`} className="hover:text-ocean-600 transition-colors">エリア</Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">{areaName}</span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ocean-50 dark:bg-ocean-900/20 rounded-xl flex items-center justify-center">
                <MapPin size={20} className="text-ocean-600 dark:text-ocean-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                  {areaName}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  {spots.length}件のスポット
                </p>
              </div>
            </div>
          </div>
        </div>

        <SpotGroupList
          spots={spotItems}
          subCategories={subCategories}
          countryCode={code}
          theme={theme ? {
            filterActive: theme.filterActive,
            hoverBorder: theme.hoverBorder,
            numberText: theme.numberText,
            accentHover: theme.accentHover,
            badgeBg: theme.badgeBg,
            badgeText: theme.badgeText,
          } : undefined}
        />

        {/* フッターCTA */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <section className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {areaName}エリアの情報修正・追加は
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
