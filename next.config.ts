import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Google Places API / Googleユーザーコンテンツ
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      { protocol: "https", hostname: "lh5.googleusercontent.com" },
      { protocol: "https", hostname: "lh6.googleusercontent.com" },
      // 各プレイス公式サイト画像（将来対応）
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      // 旧slug → 新slugへの301リダイレクト（Googleインデックス済みの古いURL対応）
      {
        source: "/th/place/restaurant/sumitei-yakiniku",
        destination: "/th/place/restaurant/sumi-tei-yakiniku-thonglor",
        permanent: true,
      },
      // monster-curry → monster-curry-ion-orchard（2026-04-10）
      {
        source: "/sg/place/restaurant/monster-curry",
        destination: "/sg/place/restaurant/monster-curry-ion-orchard",
        permanent: true,
      },

      // izakaya-bar カテゴリ廃止 → restaurant に統合（2026-04-03）
      // カテゴリページ（全12カ国）
      {
        source: "/:country/place/izakaya-bar",
        destination: "/:country/place/restaurant",
        permanent: true,
      },
      // スポット詳細ページ（統合先が restaurant に存在するもの）
      // MY
      { source: "/my/place/izakaya-bar/rokka-robatayaki-by-little-june-sushi", destination: "/my/place/restaurant/rokka-robatayaki-by-little-june-sushi", permanent: true },
      { source: "/my/place/izakaya-bar/kyuten-robatayaki-japanese-izakaya", destination: "/my/place/restaurant/kyuten-robatayaki-japanese-izakaya", permanent: true },
      { source: "/my/place/izakaya-bar/tekku-izakaya-kota-damansara", destination: "/my/place/restaurant/tekku-izakaya-kota-damansara", permanent: true },
      // SG
      { source: "/sg/place/izakaya-bar/nikomi-253-japanese-izakaya", destination: "/sg/place/restaurant/nikomi-253-japanese-izakaya", permanent: true },
      { source: "/sg/place/izakaya-bar/izakaya-nijumaru-cuppage-bar", destination: "/sg/place/restaurant/izakaya-nijumaru-cuppage-bar", permanent: true },
      // TH
      { source: "/th/place/izakaya-bar/kitaro-itadaki-horumon", destination: "/th/place/restaurant/kitaro-itadaki-horumon", permanent: true },
      { source: "/th/place/izakaya-bar/nanami-japanese-bbq-restaurant", destination: "/th/place/restaurant/nanami-japanese-bbq-restaurant", permanent: true },
      { source: "/th/place/izakaya-bar/butsaba-wineandcafe-2", destination: "/th/place/restaurant/butsaba-wineandcafe-2", permanent: true },
      // DE
      { source: "/de/place/izakaya-bar/izakaya-bar-takezo", destination: "/de/place/restaurant/izakaya-bar-takezo", permanent: true },
      // AU
      { source: "/au/place/izakaya-bar/nomidokoro-indigo-darlinghurst-izakaya", destination: "/au/place/restaurant/nomidokoro-indigo-darlinghurst-izakaya", permanent: true },
      { source: "/au/place/izakaya-bar/wawawa-izakaya-cairns", destination: "/au/place/restaurant/wawawa-izakaya-cairns", permanent: true },
      // GB
      { source: "/gb/place/izakaya-bar/ichiran-solo-booth-london", destination: "/gb/place/restaurant/ichiran-solo-booth-london", permanent: true },
      { source: "/gb/place/izakaya-bar/katana-bar-leicester-square", destination: "/gb/place/restaurant/katana-bar-leicester-square", permanent: true },
      // KR
      { source: "/kr/place/izakaya-bar/hakata-bunko", destination: "/kr/place/restaurant/hakata-bunko", permanent: true },
      { source: "/kr/place/izakaya-bar/ookini-busan", destination: "/kr/place/restaurant/ookini-busan", permanent: true },
      // HK
      { source: "/hk/place/izakaya-bar/nelohe-sake-izakaya", destination: "/hk/place/restaurant/nelohe-sake-izakaya", permanent: true },
      { source: "/hk/place/izakaya-bar/akagi-izakaya", destination: "/hk/place/restaurant/akagi-izakaya", permanent: true },
      { source: "/hk/place/izakaya-bar/hokkori-izakaya-di", destination: "/hk/place/restaurant/hokkori-izakaya-di", permanent: true },
      { source: "/hk/place/izakaya-bar/kuki-izakaya-causeway-bay-2", destination: "/hk/place/restaurant/kuki-izakaya-causeway-bay-2", permanent: true },
      { source: "/hk/place/izakaya-bar/ouka-mong-kok", destination: "/hk/place/restaurant/ouka-mong-kok", permanent: true },
      { source: "/hk/place/izakaya-bar/the-aubrey-central-sushi", destination: "/hk/place/restaurant/the-aubrey-central-sushi", permanent: true },
      { source: "/hk/place/izakaya-bar/watami-whampoa-hung-hom", destination: "/hk/place/restaurant/watami-whampoa-hung-hom", permanent: true },
      { source: "/hk/place/izakaya-bar/yaki-ana-sha-tin-ntp", destination: "/hk/place/restaurant/yaki-ana-sha-tin-ntp", permanent: true },
      { source: "/hk/place/izakaya-bar/daieiki-japanese-restaurant-mong-kok", destination: "/hk/place/grocery/daieiki-japanese-restaurant-mong-kok", permanent: true },

      // HK grocery: 壊れたslug "-10" を修正（2026-04-04）
      { source: "/hk/place/grocery/-10", destination: "/hk/place/grocery/nihon-meiriki-flagship-tsim-sha-tsui", permanent: true },
      // HK izakaya-bar: "-10" slug経由でアクセスされていたURL（念のため）
      { source: "/hk/place/izakaya-bar/-10", destination: "/hk/place/grocery/nihon-meiriki-flagship-tsim-sha-tsui", permanent: true },

      // /column/column/:slug → /overseas/column/:slug（2026-04-14）
      {
        source: "/column/column/:slug",
        destination: "/overseas/column/:slug",
        permanent: true,
      },

      // /confessions → /ask リダイレクト（2026-04-15）
      { source: "/confessions", destination: "/ask", permanent: true },

      // /spot → /place リダイレクト（2026-04-08）
      { source: "/:country/spot", destination: "/:country/place", permanent: true },
      { source: "/:country/spot/map", destination: "/:country/place/map", permanent: true },
      { source: "/:country/spot/area", destination: "/:country/place/area", permanent: true },
      { source: "/:country/spot/area/:area", destination: "/:country/place/area/:area", permanent: true },
      { source: "/:country/spot/:category", destination: "/:country/place/:category", permanent: true },
      { source: "/:country/spot/:category/:slug", destination: "/:country/place/:category/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
