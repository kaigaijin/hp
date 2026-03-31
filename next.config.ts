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
    ];
  },
};

export default nextConfig;
