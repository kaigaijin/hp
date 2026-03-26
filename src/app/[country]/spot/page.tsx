import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { categories, getCategoryCounts } from "@/lib/directory";
import {
  UtensilsCrossed,
  Stethoscope,
  Scissors,
  Building2,
  ShoppingCart,
  GraduationCap,
  ArrowRight,
  MapPin,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed size={28} />,
  Stethoscope: <Stethoscope size={28} />,
  Scissors: <Scissors size={28} />,
  Building2: <Building2 size={28} />,
  ShoppingCart: <ShoppingCart size={28} />,
  GraduationCap: <GraduationCap size={28} />,
};

export function generateStaticParams() {
  return countries.filter((c) => c.phase === 1).map((c) => ({ country: c.code }));
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

  return (
    <>
      <Header />
      <main>
        {/* ヒーロー */}
        <section className="bg-gradient-to-br from-ocean-800 to-ocean-600 text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={24} className="text-ocean-300" />
              <Link
                href={`/${code}`}
                className="text-ocean-300 hover:text-white transition-colors text-sm"
              >
                {country.flag} {country.name}
              </Link>
            </div>
            <h1 className="heading-editorial text-3xl md:text-4xl font-bold mb-3">
              {country.name}のスポットを探す
            </h1>
            <p className="text-ocean-200 text-lg">
              日本人に人気のレストラン・クリニック・美容室など、
              {totalSpots > 0 ? `${totalSpots}件` : ""}
              のスポットをカテゴリ別にご紹介
            </p>
          </div>
        </section>

        {/* カテゴリ一覧 */}
        <section className="py-12 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const count = counts[cat.slug] ?? 0;
                return (
                  <Link
                    key={cat.slug}
                    href={`/${code}/spot/${cat.slug}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 h-full flex flex-col country-card">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-ocean-50 dark:bg-ocean-900/30 rounded-xl flex items-center justify-center text-ocean-600 dark:text-ocean-400">
                          {iconMap[cat.icon]}
                        </div>
                        <div>
                          <h2 className="heading-editorial text-lg font-bold group-hover:text-ocean-700 dark:group-hover:text-ocean-400 transition-colors">
                            {cat.name}
                          </h2>
                          {count > 0 && (
                            <span className="text-sm text-stone-400">
                              {count}件
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed flex-1">
                        {cat.description}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm text-ocean-600 dark:text-ocean-400 font-medium group-hover:gap-2 transition-all">
                        一覧を見る
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-stone-100 dark:bg-stone-800/50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="heading-editorial text-xl font-bold mb-3">
              掲載リクエスト・情報修正
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-6 max-w-lg mx-auto text-sm">
              掲載されていないスポットの追加や、掲載情報の修正をご希望の方はお気軽にご連絡ください。
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-600 text-white rounded-xl hover:bg-ocean-700 transition-colors font-medium text-sm"
            >
              お問い合わせ
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
