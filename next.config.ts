import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // 旧slug → 新slugへの301リダイレクト（Googleインデックス済みの古いURL対応）
      {
        source: "/th/spot/restaurant/sumitei-yakiniku",
        destination: "/th/spot/restaurant/sumi-tei-yakiniku-thonglor",
        permanent: true,
      },

      // izakaya-bar カテゴリ廃止 → restaurant に統合（2026-04-03）
      // カテゴリページ（全12カ国）
      {
        source: "/:country/spot/izakaya-bar",
        destination: "/:country/spot/restaurant",
        permanent: true,
      },
      // スポット詳細ページ（統合先が restaurant に存在するもの）
      // MY
      { source: "/my/spot/izakaya-bar/rokka-robatayaki-by-little-june-sushi", destination: "/my/spot/restaurant/rokka-robatayaki-by-little-june-sushi", permanent: true },
      { source: "/my/spot/izakaya-bar/kyuten-robatayaki-japanese-izakaya", destination: "/my/spot/restaurant/kyuten-robatayaki-japanese-izakaya", permanent: true },
      { source: "/my/spot/izakaya-bar/tekku-izakaya-kota-damansara", destination: "/my/spot/restaurant/tekku-izakaya-kota-damansara", permanent: true },
      // SG
      { source: "/sg/spot/izakaya-bar/nikomi-253-japanese-izakaya", destination: "/sg/spot/restaurant/nikomi-253-japanese-izakaya", permanent: true },
      { source: "/sg/spot/izakaya-bar/izakaya-nijumaru-cuppage-bar", destination: "/sg/spot/restaurant/izakaya-nijumaru-cuppage-bar", permanent: true },
      // TH
      { source: "/th/spot/izakaya-bar/kitaro-itadaki-horumon", destination: "/th/spot/restaurant/kitaro-itadaki-horumon", permanent: true },
      { source: "/th/spot/izakaya-bar/nanami-japanese-bbq-restaurant", destination: "/th/spot/restaurant/nanami-japanese-bbq-restaurant", permanent: true },
      { source: "/th/spot/izakaya-bar/butsaba-wineandcafe-2", destination: "/th/spot/restaurant/butsaba-wineandcafe-2", permanent: true },
      // DE
      { source: "/de/spot/izakaya-bar/izakaya-bar-takezo", destination: "/de/spot/restaurant/izakaya-bar-takezo", permanent: true },
      // AU
      { source: "/au/spot/izakaya-bar/nomidokoro-indigo-darlinghurst-izakaya", destination: "/au/spot/restaurant/nomidokoro-indigo-darlinghurst-izakaya", permanent: true },
      { source: "/au/spot/izakaya-bar/wawawa-izakaya-cairns", destination: "/au/spot/restaurant/wawawa-izakaya-cairns", permanent: true },
      // GB
      { source: "/gb/spot/izakaya-bar/ichiran-solo-booth-london", destination: "/gb/spot/restaurant/ichiran-solo-booth-london", permanent: true },
      { source: "/gb/spot/izakaya-bar/katana-bar-leicester-square", destination: "/gb/spot/restaurant/katana-bar-leicester-square", permanent: true },
      // KR
      { source: "/kr/spot/izakaya-bar/hakata-bunko", destination: "/kr/spot/restaurant/hakata-bunko", permanent: true },
      { source: "/kr/spot/izakaya-bar/ookini-busan", destination: "/kr/spot/restaurant/ookini-busan", permanent: true },
      // HK
      { source: "/hk/spot/izakaya-bar/nelohe-sake-izakaya", destination: "/hk/spot/restaurant/nelohe-sake-izakaya", permanent: true },
      { source: "/hk/spot/izakaya-bar/akagi-izakaya", destination: "/hk/spot/restaurant/akagi-izakaya", permanent: true },
      { source: "/hk/spot/izakaya-bar/hokkori-izakaya-di", destination: "/hk/spot/restaurant/hokkori-izakaya-di", permanent: true },
      { source: "/hk/spot/izakaya-bar/kuki-izakaya-causeway-bay-2", destination: "/hk/spot/restaurant/kuki-izakaya-causeway-bay-2", permanent: true },
      { source: "/hk/spot/izakaya-bar/ouka-mong-kok", destination: "/hk/spot/restaurant/ouka-mong-kok", permanent: true },
      { source: "/hk/spot/izakaya-bar/the-aubrey-central-sushi", destination: "/hk/spot/restaurant/the-aubrey-central-sushi", permanent: true },
      { source: "/hk/spot/izakaya-bar/watami-whampoa-hung-hom", destination: "/hk/spot/restaurant/watami-whampoa-hung-hom", permanent: true },
      { source: "/hk/spot/izakaya-bar/yaki-ana-sha-tin-ntp", destination: "/hk/spot/restaurant/yaki-ana-sha-tin-ntp", permanent: true },
      { source: "/hk/spot/izakaya-bar/daieiki-japanese-restaurant-mong-kok", destination: "/hk/spot/grocery/daieiki-japanese-restaurant-mong-kok", permanent: true },
    ];
  },
};

export default nextConfig;
