import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCountry, countries } from "@/lib/countries";
import { getAllAreas } from "@/lib/directory";
import { ChevronRight, MapPin } from "lucide-react";

// シンガポールのエリアをゾーンごとにグルーピング
const sgAreaZones: Record<string, { name: string; areas: string[] }> = {
  central: {
    name: "セントラル",
    areas: [
      "Orchard", "Somerset", "Dhoby Ghaut", "City Hall", "Bugis",
      "Raffles Place", "Tanjong Pagar", "Telok Ayer", "Shenton Way",
      "Boat Quay", "Clarke Quay", "Robertson Quay", "River Valley",
      "Marina Bay", "Marina Centre", "Promenade", "Suntec City",
      "CBD", "Robinson Road", "Cecil Street", "Chinatown",
      "Keong Saik", "Duxton", "Bukit Pasoh", "China Square",
      "Outram Park", "Tiong Bahru", "Great World", "Bras Basah",
      "Beach Road", "Little India", "Farrer Park", "Lavender",
      "CHIJMES", "Chijmes", "Cineleisure", "Millenia Walk",
      "Novena", "Stevens", "Tanglin", "Dempsey Hill",
      "Maxwell", "Balestier", "Geylang", "Aljunied",
    ],
  },
  east: {
    name: "イースト",
    areas: [
      "Changi", "Tampines", "Paya Lebar", "Bedok", "Katong",
      "Tanjong Katong", "East Coast", "Marine Parade", "Pasir Ris",
      "Kembangan", "Ubi", "Simei",
    ],
  },
  west: {
    name: "ウエスト",
    areas: [
      "Jurong East", "Jurong", "Jurong West", "Buona Vista",
      "Clementi", "West Coast", "Alexandra", "Leng Kee",
      "HarbourFront", "Sentosa", "Pasir Panjang", "Labrador Park",
      "Bukit Timah", "Holland Village", "Sunset Way", "Beauty World",
      "Adam Road", "Queenstown", "Bukit Merah", "Thomson",
      "Upper Thomson",
    ],
  },
  north: {
    name: "ノース",
    areas: [
      "Woodlands", "Yishun", "Ang Mo Kio", "Bishan", "Serangoon",
      "Punggol", "Sengkang", "Hougang", "Toa Payoh", "Kallang",
      "Bukit Batok", "Bukit Panjang", "Choa Chu Kang",
    ],
  },
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
      title: `${country.name}のKAIスポット — エリアから探す`,
      description: `${country.name}のスポットをエリア・地区別に探せます。`,
      openGraph: {
        title: `${country.name} エリア別スポット | Kaigaijin`,
        description: `${country.name}のスポットをエリア・地区別に探せます。`,
        type: "website",
        locale: "ja_JP",
        url: `https://kaigaijin.jp/${code}/spot/area`,
        siteName: "Kaigaijin",
      },
    };
  });
}

export default async function AreaIndexPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const areas = getAllAreas(code);
  const totalSpots = areas.reduce((sum, a) => sum + a.count, 0);

  // ゾーン別にグルーピング（SGのみ。他の国はフラット表示）
  const zones = code === "sg" ? sgAreaZones : null;

  // ゾーンに属さないエリア
  const allZoneAreas = zones
    ? Object.values(zones).flatMap((z) => z.areas)
    : [];
  const otherAreas = areas.filter(
    (a) => !allZoneAreas.includes(a.name) && a.name !== "Various" && a.name !== "Island-wide" && a.name !== "Online" && a.name !== "Singapore",
  );
  const specialAreas = areas.filter(
    (a) => a.name === "Various" || a.name === "Island-wide" || a.name === "Online" || a.name === "Singapore",
  );

  return (
    <>
      <Header />
      <main className="bg-stone-100 dark:bg-stone-900 min-h-screen">
        <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <nav className="flex items-center gap-1.5 text-xs text-stone-400 mb-3">
              <Link href="/" className="hover:text-warm-600 transition-colors">トップ</Link>
              <ChevronRight size={12} />
              <Link href={`/${code}`} className="hover:text-warm-600 transition-colors">
                {country.flag} {country.name}
              </Link>
              <ChevronRight size={12} />
              <Link href={`/${code}/spot`} className="hover:text-warm-600 transition-colors">KAIスポット</Link>
              <ChevronRight size={12} />
              <span className="text-stone-600 dark:text-stone-300">エリアから探す</span>
            </nav>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
              {country.flag} エリアから探す
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {areas.length}エリア・{totalSpots}件のスポット
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ナビゲーション */}
          <div className="flex gap-2 mb-6">
            <Link
              href={`/${code}/spot`}
              className="text-xs text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-full hover:border-warm-400 transition-colors"
            >
              カテゴリ
            </Link>
            <span className="text-xs text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-warm-900/30 px-3 py-1.5 rounded-full">
              エリア
            </span>
            <Link
              href={`/${code}/spot/map`}
              className="text-xs text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-full hover:border-warm-400 transition-colors"
            >
              地図
            </Link>
          </div>

          {zones ? (
            // ゾーン別表示（SG）
            <div className="space-y-8">
              {Object.entries(zones).map(([zoneSlug, zone]) => {
                const zoneAreas = areas.filter((a) =>
                  zone.areas.includes(a.name),
                );
                if (zoneAreas.length === 0) return null;
                return (
                  <section key={zoneSlug}>
                    <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                      {zone.name}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {zoneAreas.map((area) => (
                        <Link
                          key={area.slug}
                          href={`/${code}/spot/area/${area.slug}`}
                          className="group bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-warm-400 dark:hover:border-warm-500 hover:shadow-md transition-all p-4"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin size={14} className="text-warm-500 dark:text-warm-400 shrink-0" />
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
                );
              })}

              {/* ゾーン外エリア */}
              {otherAreas.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    その他のエリア
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {otherAreas.map((area) => (
                      <Link
                        key={area.slug}
                        href={`/${code}/spot/area/${area.slug}`}
                        className="group bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-warm-400 dark:hover:border-warm-500 hover:shadow-md transition-all p-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={14} className="text-warm-500 dark:text-warm-400 shrink-0" />
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

              {/* 特殊エリア */}
              {specialAreas.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    エリア指定なし
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {specialAreas.map((area) => (
                      <Link
                        key={area.slug}
                        href={`/${code}/spot/area/${area.slug}`}
                        className="group bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-warm-400 dark:hover:border-warm-500 hover:shadow-md transition-all p-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={14} className="text-stone-400 shrink-0" />
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
            </div>
          ) : (
            // フラット表示（SG以外）
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {areas.map((area) => (
                <Link
                  key={area.slug}
                  href={`/${code}/spot/area/${area.slug}`}
                  className="group bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-warm-400 dark:hover:border-warm-500 hover:shadow-md transition-all p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-warm-500 dark:text-warm-400 shrink-0" />
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
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
